@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up OpenSID development environment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ and try again.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm and try again.
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

REM Create environment file if it doesn't exist
if not exist .env.local (
    if exist .env.example (
        echo 📝 Creating .env.local from .env.example...
        copy .env.example .env.local >nul
    ) else (
        echo 📝 Creating .env.local with default values...
        (
            echo APP_NAME=OpenSID
            echo APP_VERSION=2.0.0
            echo APP_DESCRIPTION=Sistem Informasi Desa
            echo NEXTAUTH_URL=http://localhost:3000
            echo NEXTAUTH_SECRET=please-set-a-strong-random-secret
            echo DATABASE_URL=postgresql://opensid:opensid123@localhost:5432/opensid?schema=public
            echo REDIS_URL=redis://localhost:6379
            echo UPLOAD_DIR=./uploads
            echo MAX_FILE_SIZE=10485760
            echo SMTP_HOST=
            echo SMTP_PORT=587
            echo SMTP_USER=
            echo SMTP_PASS=
            echo NODE_ENV=development
        ) > .env.local
    )
    echo ⚠️  Please review .env.local and update secrets as needed
)

REM Start Docker services
echo 🐳 Starting Docker services...
npm run docker:dev
if errorlevel 1 (
    echo ❌ Failed to start Docker services
    exit /b 1
)

REM Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npm run db:generate
if errorlevel 1 (
    echo ❌ Failed to generate Prisma client
    exit /b 1
)

REM Run database migrations
echo 🗄️  Running database migrations...
npm run db:push
if errorlevel 1 (
    echo ❌ Failed to run database migrations
    exit /b 1
)

REM Seed the database
echo 🌱 Seeding database with initial data...
npm run db:seed
if errorlevel 1 (
    echo ❌ Failed to seed database
    exit /b 1
)

REM Run type check
echo 🔍 Running type check...
npm run type-check
if errorlevel 1 (
    echo ❌ Type check failed
    exit /b 1
)

REM Run tests
echo 🧪 Running tests...
npm test
if errorlevel 1 (
    echo ❌ Tests failed
    exit /b 1
)

echo ✅ Development environment setup complete!
echo.
echo 🎉 You can now start developing:
echo    npm run dev          - Start development server
echo    npm run db:studio    - Open Prisma Studio
echo    npm run test:watch   - Run tests in watch mode
echo    npm run docker:down  - Stop Docker services
echo.
echo 📖 Visit http://localhost:3000 to see your application
echo 🗄️  Visit http://localhost:5555 to access Prisma Studio
echo 🐘 Visit http://localhost:8080 to access Adminer (DB admin)

pause