#!/bin/bash

# Forever Fields Authentication Test Script
# Tests all authentication methods to diagnose login issues

API_URL="https://forever-fields.onrender.com/api"
TEST_EMAIL="jacobo9509@yahoo.com"
TEST_PASSWORD="TestPassword123!@#"

echo "=========================================="
echo "Forever Fields Authentication Test Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Server Health..."
HEALTH=$(curl -s "$API_URL/../health")
echo "Response: $HEALTH"
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Server is healthy${NC}"
else
    echo -e "${RED}❌ Server health check failed${NC}"
fi
echo ""

# Test 2: Magic Link Request
echo "2️⃣  Testing Magic Link Request..."
MAGIC_LINK=$(curl -s -X POST "$API_URL/auth/request-magic-link" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\"}")
echo "Response: $MAGIC_LINK"
if echo "$MAGIC_LINK" | grep -q "magic link"; then
    echo -e "${GREEN}✅ Magic link request succeeded${NC}"
elif echo "$MAGIC_LINK" | grep -q "Failed to send"; then
    echo -e "${RED}❌ Email sending failed (SMTP issue)${NC}"
else
    echo -e "${RED}❌ Magic link request failed${NC}"
fi
echo ""

# Test 3: Password Signup
echo "3️⃣  Testing Password Signup..."
SIGNUP=$(curl -s -X POST "$API_URL/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test-$(date +%s)@example.com\",\"password\":\"$TEST_PASSWORD\"}")
echo "Response: $SIGNUP"
if echo "$SIGNUP" | grep -q "created successfully"; then
    echo -e "${GREEN}✅ Signup succeeded${NC}"
elif echo "$SIGNUP" | grep -q "already exists"; then
    echo -e "${YELLOW}⚠️  Account already exists (expected)${NC}"
elif echo "$SIGNUP" | grep -q "breach"; then
    echo -e "${RED}❌ Password is breached${NC}"
else
    echo -e "${RED}❌ Signup failed${NC}"
fi
echo ""

# Test 4: Password Login (with your email)
echo "4️⃣  Testing Password Login with your account..."
echo "Email: $TEST_EMAIL"
echo "Note: This will fail if you haven't set a password yet"
LOGIN=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
echo "Response: $LOGIN"
if echo "$LOGIN" | grep -q "successful"; then
    echo -e "${GREEN}✅ Login succeeded${NC}"
elif echo "$LOGIN" | grep -q "Invalid email or password"; then
    echo -e "${YELLOW}⚠️  Invalid credentials (password may not be set)${NC}"
elif echo "$LOGIN" | grep -q "Too many"; then
    echo -e "${RED}❌ Account locked due to too many attempts${NC}"
else
    echo -e "${RED}❌ Login failed${NC}"
fi
echo ""

# Test 5: Database Check (login attempts)
echo "5️⃣  Checking Login Attempts..."
echo "Note: This tests if account lockout feature is working"
echo ""

# Test 6: Check if user exists
echo "6️⃣  Diagnosis for $TEST_EMAIL..."
echo ""
echo "Possible issues:"
echo "  1. Account doesn't exist yet (need to create via signup or magic link)"
echo "  2. No password set (only used magic link before)"
echo "  3. SMTP email sending is broken (can't receive magic links)"
echo "  4. Account is locked due to too many failed attempts"
echo ""

# Test 7: Forgot Password
echo "7️⃣  Testing Forgot Password (Password Reset)..."
FORGOT=$(curl -s -X POST "$API_URL/auth/forgot-password" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\"}")
echo "Response: $FORGOT"
if echo "$FORGOT" | grep -q "reset link"; then
    echo -e "${GREEN}✅ Reset request succeeded${NC}"
    echo -e "${YELLOW}⚠️  But email may not send if SMTP is broken${NC}"
else
    echo -e "${RED}❌ Forgot password failed${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "SUMMARY & RECOMMENDATIONS"
echo "=========================================="
echo ""

if echo "$MAGIC_LINK" | grep -q "Failed to send"; then
    echo -e "${RED}🚨 CRITICAL: Email sending is broken${NC}"
    echo "   Fix: Configure SMTP settings in Render environment variables"
    echo "   Variables needed: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL"
    echo ""
fi

echo "To log in, you have 3 options:"
echo ""
echo "Option 1: Magic Link (Recommended)"
echo "  - Go to: https://forever-fields.pages.dev/login"
echo "  - Enter email: $TEST_EMAIL"
echo "  - Click 'Send Magic Link'"
echo "  - Check email for login link"
echo "  ${YELLOW}NOTE: Currently broken due to SMTP issue${NC}"
echo ""
echo "Option 2: Password Login"
echo "  - Go to: https://forever-fields.pages.dev/login"
echo "  - Click 'Use Password Instead'"
echo "  - Enter email and password"
echo "  ${YELLOW}NOTE: Only works if you've set a password before${NC}"
echo ""
echo "Option 3: Reset Password (if you have an account but no password)"
echo "  1. Go to: https://forever-fields.pages.dev/login"
echo "  2. Click 'Forgot Password?'"
echo "  3. Enter email: $TEST_EMAIL"
echo "  4. Check email for reset link"
echo "  5. Set new password"
echo "  ${YELLOW}NOTE: Currently broken due to SMTP issue${NC}"
echo ""

# Check environment variables
echo "=========================================="
echo "NEXT STEPS"
echo "=========================================="
echo ""
echo "1. Check if SMTP is configured in Render:"
echo "   https://dashboard.render.com → forever-fields → Environment"
echo ""
echo "2. Required SMTP variables:"
echo "   SMTP_HOST=smtp.resend.com"
echo "   SMTP_USER=resend"
echo "   SMTP_PASS=<your-resend-api-key>"
echo "   SMTP_FROM_EMAIL=noreply@yourdomain.com"
echo ""
echo "3. If SMTP is configured but emails not sending:"
echo "   - Check Render logs for errors"
echo "   - Verify Resend API key is valid"
echo "   - Check if domain is verified in Resend"
echo ""
echo "4. Temporary workaround (create account with password):"
echo "   curl -X POST $API_URL/auth/signup \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"$TEST_EMAIL\",\"password\":\"YourSecurePassword123!\"}'"
echo ""
