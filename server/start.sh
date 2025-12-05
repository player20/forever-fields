#!/bin/bash
# Render Start Script for Forever Fields Backend

set -e  # Exit on any error

echo "🔄 Running database migrations..."
npm run prisma:migrate

echo "🚀 Starting server..."
npm start
