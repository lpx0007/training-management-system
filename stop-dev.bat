@echo off
echo ========================================
echo Stopping Development Server...
echo ========================================
echo.

echo Finding process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    set PID=%%a
    goto :found
)

echo [INFO] No server running on port 3000
echo.
goto :end

:found
echo Found PID: %PID%
echo.
echo Stopping server...
taskkill /F /PID %PID% >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Server stopped
) else (
    echo [ERROR] Failed to stop server
    echo Try running as administrator
)
echo.

:end
echo ========================================
pause
