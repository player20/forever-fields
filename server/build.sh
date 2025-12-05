#!/bin/bash
# Render Build Script for Forever Fields Backend

set -e  # Exit on any error

echo "🔧 Installing dependencies..."
npm install

echo "📦 Generating Prisma Client..."
npm run prisma:generate

echo "🏗️ Building TypeScript..."
npm run build

echo "✅ Build complete!"
ls -la dist/
