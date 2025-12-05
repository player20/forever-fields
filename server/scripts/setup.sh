#!/bin/bash

# Forever Fields Backend - Quick Setup Script
# Run with: bash scripts/setup.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Forever Fields Backend - Quick Setup                      ║"
echo "║  v0.0-secure-backend                                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Error: Node.js 20+ required (you have $(node -v))"
  exit 1
fi
echo "✅ Node.js version OK: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "❌ Error: npm install failed"
  exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
  echo "⚠️  Warning: .env file not found"
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo "✅ .env created - please edit with your credentials"
  echo ""
  echo "Required steps:"
  echo "  1. Edit .env with your Supabase credentials"
  echo "  2. Edit .env with your Cloudinary credentials"
  echo "  3. Edit .env with your SMTP credentials"
  echo "  4. Generate JWT secret: openssl rand -base64 32"
  echo ""
  read -p "Press Enter after you've configured .env..."
else
  echo "✅ .env file found"
fi
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
  echo "❌ Error: Prisma generate failed"
  exit 1
fi
echo "✅ Prisma client generated"
echo ""

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init
if [ $? -ne 0 ]; then
  echo "⚠️  Warning: Migration failed (check DATABASE_URL in .env)"
  echo "You can run migrations manually later with: npx prisma migrate dev"
else
  echo "✅ Database migrations complete"
fi
echo ""

# Setup complete
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Setup Complete! 🎉                                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Start development server: npm run dev"
echo "  2. Test API health: curl http://localhost:3000/health"
echo "  3. Run integration tests: npm test"
echo ""
echo "Documentation:"
echo "  - README.md - Full documentation"
echo "  - DEPLOYMENT.md - Production deployment guide"
echo "  - .env.example - Environment variable reference"
echo ""
echo "Happy coding! 🚀"
