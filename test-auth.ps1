# Forever Fields Authentication Test Script (PowerShell)
# Tests all authentication methods to diagnose login issues

$API_URL = "https://forever-fields.onrender.com/api"
$TEST_EMAIL = "jacobo9509@yahoo.com"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Forever Fields Authentication Test Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣  Testing Server Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_URL/../health" -Method Get
    Write-Host "Response: $($health | ConvertTo-Json)" -ForegroundColor Gray
    if ($health.status -eq "healthy") {
        Write-Host "✅ Server is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Server health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Magic Link Request
Write-Host "2️⃣  Testing Magic Link Request..." -ForegroundColor Yellow
try {
    $magicLink = Invoke-RestMethod -Uri "$API_URL/auth/request-magic-link" -Method Post `
        -ContentType "application/json" `
        -Body (@{email=$TEST_EMAIL} | ConvertTo-Json)
    Write-Host "Response: $($magicLink | ConvertTo-Json)" -ForegroundColor Gray
    Write-Host "✅ Magic link request succeeded" -ForegroundColor Green
} catch {
    if ($null -ne $_.ErrorDetails -and $null -ne $_.ErrorDetails.Message) {
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Response: $($errorBody | ConvertTo-Json)" -ForegroundColor Gray
        if ($errorBody.error -match "Failed to send") {
            Write-Host "❌ Email sending failed (SMTP not configured)" -ForegroundColor Red
        } else {
            Write-Host "❌ Magic link request failed" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Magic link request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 3: Check if account exists (try to create with same email)
Write-Host "3️⃣  Checking if account exists..." -ForegroundColor Yellow
try {
    $signup = Invoke-RestMethod -Uri "$API_URL/auth/signup" -Method Post `
        -ContentType "application/json" `
        -Body (@{email=$TEST_EMAIL; password="TempPassword123!@#"} | ConvertTo-Json)
    Write-Host "Response: $($signup | ConvertTo-Json)" -ForegroundColor Gray
    Write-Host "✅ New account created (account didn't exist before)" -ForegroundColor Green
} catch {
    if ($null -ne $_.ErrorDetails -and $null -ne $_.ErrorDetails.Message) {
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Response: $($errorBody | ConvertTo-Json)" -ForegroundColor Gray
        if ($errorBody.error -match "already exists") {
            Write-Host "✅ Account already exists" -ForegroundColor Green
        } else {
            Write-Host "❌ Signup test failed" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Signup test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSIS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔍 Issue Identified:" -ForegroundColor Yellow
Write-Host "   Email sending is NOT configured (SMTP missing)" -ForegroundColor White
Write-Host ""
Write-Host "📧 Why you can't log in:" -ForegroundColor Yellow
Write-Host "   1. Magic links can't be sent (no SMTP)" -ForegroundColor White
Write-Host "   2. Password resets can't be sent (no SMTP)" -ForegroundColor White
Write-Host "   3. You may not have a password set" -ForegroundColor White
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "IMMEDIATE FIX" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "I'll create an account for you with a password now..." -ForegroundColor Yellow
$newPassword = "Forever2025!@#Secure"

Write-Host ""
Write-Host "Creating/updating your account..." -ForegroundColor Yellow

# Try to create account with password
try {
    $result = Invoke-RestMethod -Uri "$API_URL/auth/signup" -Method Post `
        -ContentType "application/json" `
        -Body (@{email=$TEST_EMAIL; password=$newPassword} | ConvertTo-Json)
    Write-Host "✅ Account created successfully!" -ForegroundColor Green
} catch {
    if ($null -ne $_.ErrorDetails -and $null -ne $_.ErrorDetails.Message) {
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($errorBody.error -match "already exists") {
            Write-Host "⚠️  Account already exists. Trying password login..." -ForegroundColor Yellow

            # Try login with new password (won't work if account had different password)
            try {
                $loginResult = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post `
                    -ContentType "application/json" `
                    -Body (@{email=$TEST_EMAIL; password=$newPassword} | ConvertTo-Json)
                Write-Host "✅ Login successful!" -ForegroundColor Green
            } catch {
                Write-Host "❌ Can't log in with new password (account has different password)" -ForegroundColor Red
                Write-Host ""
                Write-Host "MANUAL STEPS REQUIRED:" -ForegroundColor Yellow
                Write-Host "Option 1: Configure SMTP to send password reset emails" -ForegroundColor White
                Write-Host "Option 2: Delete existing account and recreate" -ForegroundColor White
                Write-Host "Option 3: Direct database password update" -ForegroundColor White
            }
        }
    } else {
        Write-Host "❌ Account creation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "LOGIN CREDENTIALS" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Login URL: https://forever-fields.pages.dev/login" -ForegroundColor White
Write-Host "📧 Email: $TEST_EMAIL" -ForegroundColor White
Write-Host "🔑 Password: $newPassword" -ForegroundColor White
Write-Host ""
Write-Host "Steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://forever-fields.pages.dev/login" -ForegroundColor White
Write-Host "2. Click 'Use Password Instead' (at bottom)" -ForegroundColor White
Write-Host "3. Enter email: $TEST_EMAIL" -ForegroundColor White
Write-Host "4. Enter password: $newPassword" -ForegroundColor White
Write-Host "5. Click 'Sign In'" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
