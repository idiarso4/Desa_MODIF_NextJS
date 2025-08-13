#!/bin/bash

# OpenSID Development Setup Script
# This script sets up the development environment for OpenSID Next.js

set -e

echo "🚀 Setting up OpenSID development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
  else
    echo "📝 Creating .env.local with default values..."
    cat > .env.local <<'EOF'
APP_NAME=OpenSID
APP_VERSION=2.0.0
APP_DESCRIPTION=Sistem Informasi Desa
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=please-set-a-strong-random-secret
DATABASE_URL=postgresql://opensid:opensid123@localhost:5432/opensid?schema=public
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
NODE_ENV=development
EOF
  fi
  echo "⚠️  Please review .env.local and update secrets as needed"
fi

# Start Docker services
echo "🐳 Starting Docker services..."
npm run docker:dev

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:push

# Seed the database
echo "🌱 Seeding database with initial data..."
npm run db:seed

# Run type check
echo "🔍 Running type check..."
npm run type-check

# Run tests
echo "🧪 Running tests..."
npm test

echo "✅ Development environment setup complete!"
echo ""
echo "🎉 You can now start developing:"
echo "   npm run dev          - Start development server"
echo "   npm run db:studio    - Open Prisma Studio"
echo "   npm run test:watch   - Run tests in watch mode"
echo "   npm run docker:down  - Stop Docker services"
echo ""
echo "📖 Visit http://localhost:3000 to see your application"
echo "🗄️  Visit http://localhost:5555 to access Prisma Studio"
echo "🐘 Visit http://localhost:8080 to access Adminer (DB admin)"