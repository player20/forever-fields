#!/bin/bash

# Forever Fields Authentication Test Script
# Tests all authentication flows: Signup, Login, SSO, Password Reset
# Usage: ./tests/auth-test.sh [API_URL]

API_URL="${1:-http://localhost:3000}"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="Test123!@#Strong"

echo "🧪 Forever Fields Authentication Tests"
echo "========================================"
echo "API URL: $API_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to print test results
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

echo "1️⃣  Testing Signup (Email/Password)"
echo "-----------------------------------"

SIGNUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

HTTP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n1)
BODY=$(echo "$SIGNUP_RESPONSE" | sed '$ d')

if [ "$HTTP_CODE" == "201" ]; then
    test_result 0 "Signup returned 201 Created"
    ACCESS_TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$ACCESS_TOKEN" ]; then
        test_result 0 "Access token received"
    else
        test_result 1 "Access token missing"
    fi
else
    test_result 1 "Signup failed (HTTP $HTTP_CODE)"
    echo "$BODY"
fi

echo ""
echo "2️⃣  Testing Login (Email/Password)"
echo "-----------------------------------"

LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"remember\":true}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$ d')

if [ "$HTTP_CODE" == "200" ]; then
    test_result 0 "Login successful (HTTP 200)"
    REFRESH_TOKEN=$(echo "$BODY" | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$REFRESH_TOKEN" ]; then
        test_result 0 "Refresh token received"
    else
        test_result 1 "Refresh token missing"
    fi
else
    test_result 1 "Login failed (HTTP $HTTP_CODE)"
    echo "$BODY"
fi

echo ""
echo "3️⃣  Testing Invalid Login (Wrong Password)"
echo "-------------------------------------------"

INVALID_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"WrongPassword123!\"}")

HTTP_CODE=$(echo "$INVALID_LOGIN" | tail -n1)

if [ "$HTTP_CODE" == "401" ]; then
    test_result 0 "Invalid login correctly rejected (HTTP 401)"
else
    test_result 1 "Invalid login should return 401, got $HTTP_CODE"
fi

echo ""
echo "4️⃣  Testing Duplicate Signup"
echo "-----------------------------"

DUPLICATE_SIGNUP=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

HTTP_CODE=$(echo "$DUPLICATE_SIGNUP" | tail -n1)

if [ "$HTTP_CODE" == "409" ]; then
    test_result 0 "Duplicate signup correctly rejected (HTTP 409)"
else
    test_result 1 "Duplicate signup should return 409, got $HTTP_CODE"
fi

echo ""
echo "5️⃣  Testing Weak Password Rejection"
echo "------------------------------------"

WEAK_PASSWORD=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"weak-test@example.com\",\"password\":\"weak\"}")

HTTP_CODE=$(echo "$WEAK_PASSWORD" | tail -n1)

if [ "$HTTP_CODE" == "400" ]; then
    test_result 0 "Weak password correctly rejected (HTTP 400)"
else
    test_result 1 "Weak password should be rejected, got HTTP $HTTP_CODE"
fi

echo ""
echo "6️⃣  Testing Token Refresh"
echo "-------------------------"

if [ -n "$REFRESH_TOKEN" ]; then
    REFRESH_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/refresh" \
      -H "Content-Type: application/json" \
      -d "{\"refresh_token\":\"$REFRESH_TOKEN\"}")

    HTTP_CODE=$(echo "$REFRESH_RESPONSE" | tail -n1)
    BODY=$(echo "$REFRESH_RESPONSE" | sed '$ d')

    if [ "$HTTP_CODE" == "200" ]; then
        test_result 0 "Token refresh successful (HTTP 200)"
        NEW_ACCESS_TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        if [ -n "$NEW_ACCESS_TOKEN" ]; then
            test_result 0 "New access token received"
        else
            test_result 1 "New access token missing"
        fi
    else
        test_result 1 "Token refresh failed (HTTP $HTTP_CODE)"
    fi
else
    test_result 1 "No refresh token available for testing"
fi

echo ""
echo "7️⃣  Testing Forgot Password"
echo "---------------------------"

FORGOT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

HTTP_CODE=$(echo "$FORGOT_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" == "200" ]; then
    test_result 0 "Forgot password request accepted (HTTP 200)"
else
    test_result 1 "Forgot password failed (HTTP $HTTP_CODE)"
fi

echo ""
echo "8️⃣  Testing Logout"
echo "------------------"

if [ -n "$ACCESS_TOKEN" ]; then
    LOGOUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/logout" \
      -H "Authorization: Bearer $ACCESS_TOKEN")

    HTTP_CODE=$(echo "$LOGOUT_RESPONSE" | tail -n1)

    if [ "$HTTP_CODE" == "200" ]; then
        test_result 0 "Logout successful (HTTP 200)"
    else
        test_result 1 "Logout failed (HTTP $HTTP_CODE)"
    fi
else
    test_result 1 "No access token available for logout test"
fi

echo ""
echo "9️⃣  Testing Rate Limiting"
echo "-------------------------"

echo "Sending 6 rapid login attempts (limit is 5/15min)..."
for i in {1..6}; do
    RATE_TEST=$(curl -s -w "%{http_code}" -X POST "$API_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"rate-test@example.com\",\"password\":\"Test123!\"}" \
      -o /dev/null)

    if [ $i -eq 6 ] && [ "$RATE_TEST" == "429" ]; then
        test_result 0 "Rate limiting working (6th request blocked with HTTP 429)"
        break
    elif [ $i -eq 6 ]; then
        test_result 1 "Rate limiting not working (6th request got HTTP $RATE_TEST)"
    fi
done

echo ""
echo "🔟 Testing SSO Endpoints"
echo "------------------------"

# Test Google SSO redirect
GOOGLE_SSO=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/auth/sso/google" -o /dev/null)
if [ "$GOOGLE_SSO" == "302" ]; then
    test_result 0 "Google SSO redirect working (HTTP 302)"
else
    test_result 1 "Google SSO should redirect (302), got $GOOGLE_SSO"
fi

# Test Apple SSO redirect
APPLE_SSO=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/auth/sso/apple" -o /dev/null)
if [ "$APPLE_SSO" == "302" ]; then
    test_result 0 "Apple SSO redirect working (HTTP 302)"
else
    test_result 1 "Apple SSO should redirect (302), got $APPLE_SSO"
fi

# Test invalid SSO provider
INVALID_SSO=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/api/auth/sso/invalid" -o /dev/null)
if [ "$INVALID_SSO" == "400" ]; then
    test_result 0 "Invalid SSO provider correctly rejected (HTTP 400)"
else
    test_result 1 "Invalid SSO provider should return 400, got $INVALID_SSO"
fi

echo ""
echo "========================================"
echo "📊 Test Results"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo "Total: $TOTAL"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed${NC}"
    exit 1
fi
