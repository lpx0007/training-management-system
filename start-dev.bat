@echo off
echo ========================================
echo Starting Development Server...
echo ========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    pause
    exit /b 1
)

where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] pnpm not found
    echo Install: npm install -g pnpm
    pause
    exit /b 1
)

echo [OK] Environment ready
echo.
echo ========================================
echo Server starting...
echo ========================================
echo.
echo Local:   http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo.

pnpm run dev

pause
