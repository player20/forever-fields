@echo off
REM Forever Fields Backend - Quick Setup Script (Windows)
REM Run with: scripts\setup.bat

echo ================================================================
echo   Forever Fields Backend - Quick Setup
echo   v0.0-secure-backend
echo ================================================================
echo.

REM Check Node.js version
echo Checking Node.js version...
node -v >nul 2>&1
if %errorlevel% neq 0 (
  echo Error: Node.js not found. Please install Node.js 20+
  exit /b 1
)
echo Node.js found
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
  echo Error: npm install failed
  exit /b 1
)
echo Dependencies installed
echo.

REM Check for .env file
if not exist .env (
  echo Warning: .env file not found
  echo Creating .env from .env.example...
  copy .env.example .env
  echo .env created - please edit with your credentials
  echo.
  echo Required steps:
  echo   1. Edit .env with your Supabase credentials
  echo   2. Edit .env with your Cloudinary credentials
  echo   3. Edit .env with your SMTP credentials
  echo   4. Generate JWT secret
  echo.
  pause
) else (
  echo .env file found
)
echo.

REM Generate Prisma client
echo Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
  echo Error: Prisma generate failed
  exit /b 1
)
echo Prisma client generated
echo.

REM Run migrations
echo Running database migrations...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
  echo Warning: Migration failed (check DATABASE_URL in .env)
  echo You can run migrations manually later with: npx prisma migrate dev
) else (
  echo Database migrations complete
)
echo.

REM Setup complete
echo ================================================================
echo   Setup Complete!
echo ================================================================
echo.
echo Next steps:
echo   1. Start development server: npm run dev
echo   2. Test API health: curl http://localhost:3000/health
echo   3. Run integration tests: npm test
echo.
echo Documentation:
echo   - README.md - Full documentation
echo   - DEPLOYMENT.md - Production deployment guide
echo   - .env.example - Environment variable reference
echo.
echo Happy coding!
pause
