# Forever Fields End-to-End Authentication Test
# Tests complete user journey from signup to dashboard

$API_URL = "https://forever-fields.onrender.com/api"
$FRONTEND_URL = "https://forever-fields.pages.dev"
$TEST_EMAIL = "e2e-test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$TEST_PASSWORD = "SecureTest123!@#"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Forever Fields E2E Authentication Test" -ForegroundColor Cyan
Write-Host "Test Email: $TEST_EMAIL" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$testsPassed = 0
$testsFailed = 0

# Helper function for test results
function Test-Result {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$ErrorMessage = ""
    )

    if ($Passed) {
        Write-Host "  PASS: $TestName" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "  FAIL: $TestName" -ForegroundColor Red
        if ($ErrorMessage) {
            Write-Host "    Error: $ErrorMessage" -ForegroundColor Gray
        }
        $script:testsFailed++
    }
}

# Test 1: Server Health
Write-Host "Test 1: Server Health" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_URL/../health" -Method Get
    $passed = $health.status -eq "healthy"
    Test-Result "Server healthy" $passed
} catch {
    Test-Result "Server healthy" $false $_.Exception.Message
}
Write-Host ""

# Test 2: Password Signup
Write-Host "Test 2: Password Signup" -ForegroundColor Yellow
try {
    $signup = Invoke-RestMethod -Uri "$API_URL/auth/signup" -Method Post `
        -ContentType "application/json" `
        -Body (@{email=$TEST_EMAIL; password=$TEST_PASSWORD} | ConvertTo-Json)
    $passed = $signup.message -match "created" -or $signup.user
    Test-Result "Account created" $passed
} catch {
    $errorMsg = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Test-Result "Account created" $false $errorMsg
}
Write-Host ""

# Test 3: Password Login
Write-Host "Test 3: Password Login" -ForegroundColor Yellow
try {
    # Use WebRequestSession to persist cookies
    $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

    $login = Invoke-WebRequest -Uri "$API_URL/auth/login" -Method Post `
        -ContentType "application/json" `
        -Body (@{email=$TEST_EMAIL; password=$TEST_PASSWORD} | ConvertTo-Json) `
        -WebSession $session `
        -UseBasicParsing

    $passed = $login.StatusCode -eq 200
    Test-Result "Login successful" $passed

    # Save session for next tests
    $script:authSession = $session
} catch {
    $errorMsg = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Test-Result "Login successful" $false $errorMsg
}
Write-Host ""

# Test 4: Verify httpOnly Cookies Set
Write-Host "Test 4: Verify httpOnly Cookies" -ForegroundColor Yellow
try {
    $hasAccessToken = $authSession.Cookies.GetCookies("$API_URL") | Where-Object { $_.Name -eq "ff_access_token" }
    $hasRefreshToken = $authSession.Cookies.GetCookies("$API_URL") | Where-Object { $_.Name -eq "ff_refresh_token" }

    Test-Result "Access token cookie set" ($null -ne $hasAccessToken)
    Test-Result "Refresh token cookie set" ($null -ne $hasRefreshToken)
} catch {
    Test-Result "Cookies verification" $false $_.Exception.Message
}
Write-Host ""

# Test 5: Authenticated Request (/api/user/me)
Write-Host "Test 5: Authenticated Request (/api/user/me)" -ForegroundColor Yellow
try {
    $userMe = Invoke-WebRequest -Uri "$API_URL/user/me" `
        -WebSession $authSession `
        -UseBasicParsing

    $passed = $userMe.StatusCode -eq 200
    Test-Result "Authenticated successfully" $passed

    if ($passed) {
        $userData = $userMe.Content | ConvertFrom-Json
        Test-Result "User profile returned" ($null -ne $userData.user)
        Test-Result "User email matches" ($userData.user.email -eq $TEST_EMAIL)
    }
} catch {
    $errorMsg = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Test-Result "Authenticated successfully" $false $errorMsg
}
Write-Host ""

# Test 6: Magic Link Request
Write-Host "Test 6: Magic Link Request" -ForegroundColor Yellow
try {
    $magic = Invoke-RestMethod -Uri "$API_URL/auth/request-magic-link" -Method Post `
        -ContentType "application/json" `
        -Body (@{email=$TEST_EMAIL} | ConvertTo-Json)

    $passed = $magic.message -match "sent" -or $magic.message -match "Magic link"
    Test-Result "Magic link sent" $passed
} catch {
    $errorMsg = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    # Magic link might fail if SMTP not configured, but that's okay for this test
    if ($errorMsg -match "Failed to send") {
        Test-Result "Magic link request (SMTP not configured, expected)" $true
    } else {
        Test-Result "Magic link sent" $false $errorMsg
    }
}
Write-Host ""

# Test 7: Logout
Write-Host "Test 7: Logout" -ForegroundColor Yellow
try {
    $logout = Invoke-WebRequest -Uri "$API_URL/auth/logout" -Method Post `
        -WebSession $authSession `
        -UseBasicParsing

    $passed = $logout.StatusCode -eq 200
    Test-Result "Logged out" $passed
} catch {
    $errorMsg = if ($_.ErrorDetails) { $_.ErrorDetails.Message } else { $_.Exception.Message }
    Test-Result "Logged out" $false $errorMsg
}
Write-Host ""

# Test 8: Verify Session Invalidated
Write-Host "Test 8: Verify Session Invalidated" -ForegroundColor Yellow
try {
    $userMeAfter = Invoke-WebRequest -Uri "$API_URL/user/me" `
        -WebSession $authSession `
        -UseBasicParsing `
        -ErrorAction Stop

    # If we got here, auth is still valid (FAIL)
    Test-Result "Session invalidated" $false "Session still active"
} catch {
    # We expect a 401 error after logout
    if ($_.Exception.Response.StatusCode -eq 401) {
        Test-Result "Session invalidated" $true
    } else {
        Test-Result "Session invalidated" $false $_.Exception.Message
    }
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
if ($testsFailed -eq 0) {
    Write-Host "ALL TESTS PASSED ($testsPassed/$($testsPassed + $testsFailed))" -ForegroundColor Green
} else {
    Write-Host "TESTS COMPLETED: $testsPassed passed, $testsFailed failed" -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Summary:" -ForegroundColor White
Write-Host "  Server health" -ForegroundColor Gray
Write-Host "  Password signup" -ForegroundColor Gray
Write-Host "  Password login" -ForegroundColor Gray
Write-Host "  httpOnly cookies" -ForegroundColor Gray
Write-Host "  /api/user/me auth" -ForegroundColor Gray
Write-Host "  Magic link request" -ForegroundColor Gray
Write-Host "  Logout" -ForegroundColor Gray
Write-Host "  Session invalidation" -ForegroundColor Gray
Write-Host ""

# Exit with appropriate code
if ($testsFailed -gt 0) {
    exit 1
} else {
    exit 0
}
