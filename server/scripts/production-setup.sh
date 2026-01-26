#!/bin/bash

# Production Environment Setup Script
# Run this after deploying to Render to verify everything is configured

set -e

echo "🔧 Forever Fields Production Setup Verification"
echo "==============================================="
echo ""

# Check required environment variables
REQUIRED_VARS=(
    "NODE_ENV"
    "DATABASE_URL"
    "DIRECT_URL"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "CLOUDINARY_CLOUD_NAME"
    "SMTP_PASS"
    "JWT_SECRET"
)

echo "Checking required environment variables..."
missing_vars=0

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Missing: $var"
        missing_vars=$((missing_vars + 1))
    else
        echo "✅ Found: $var"
    fi
done

if [ $missing_vars -gt 0 ]; then
    echo ""
    echo "❌ $missing_vars required environment variable(s) missing"
    echo "Please set them in the Render dashboard"
    exit 1
fi

echo ""
echo "✅ All required environment variables are set"
echo ""

# Test database connection
echo "Testing database connection..."
npx prisma db pull --force || {
    echo "❌ Database connection failed"
    echo "Check DATABASE_URL and DIRECT_URL"
    exit 1
}

echo "✅ Database connection successful"
echo ""

# Verify Prisma client is generated
echo "Verifying Prisma client..."
if [ -d "node_modules/@prisma/client" ]; then
    echo "✅ Prisma client is generated"
else
    echo "❌ Prisma client not found. Run: npx prisma generate"
    exit 1
fi

echo ""
echo "================================"
echo "✅ Production Setup Complete!"
echo "================================"
echo ""
echo "Your application is ready to serve requests"
