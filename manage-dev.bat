@echo off
title Training Management System - Dev Server Manager
color 0A

:menu
cls
echo ========================================
echo   Dev Server Manager
echo ========================================
echo.

netstat -ano | findstr :3000 | findstr LISTENING >nul 2>nul
if %errorlevel% equ 0 (
    echo [Status] Server RUNNING
    echo [URL] http://localhost:3000
    set SERVER_RUNNING=1
) else (
    echo [Status] Server STOPPED
    set SERVER_RUNNING=0
)

echo.
echo ========================================
echo.
echo [1] Start/Restart Server
echo [2] Stop Server
echo [3] Check Status
echo [4] Open in Browser
echo [0] Exit
echo.
echo ========================================
echo.

set /p choice="Select (0-4): "

if "%choice%"=="1" goto start_server
if "%choice%"=="2" goto stop_server
if "%choice%"=="3" goto check_status
if "%choice%"=="4" goto open_browser
if "%choice%"=="0" goto exit
goto menu

:start_server
cls
echo ========================================
if %SERVER_RUNNING% equ 1 (
    echo Restarting server...
    call :do_stop_server
    timeout /t 2 /nobreak >nul
) else (
    echo Starting server...
)
echo ========================================
echo.
echo Server will start in new window
echo Close window or press Ctrl+C to stop
echo.
start "Training Dev Server" cmd /k "cd /d "%~dp0" && pnpm run dev"
echo.
echo [OK] Start command executed
timeout /t 3 /nobreak >nul
goto menu

:stop_server
cls
echo ========================================
echo Stopping server...
echo ========================================
echo.
call :do_stop_server
echo.
pause
goto menu

:do_stop_server
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>nul
    if !errorlevel! equ 0 (
        echo [OK] Server stopped (PID: %%a^)
    ) else (
        echo [ERROR] Cannot stop process (PID: %%a^)
    )
)
goto :eof

:check_status
cls
echo ========================================
echo Server Status Details
echo ========================================
echo.
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Server is running
    echo.
    echo Port info:
    netstat -ano | findstr :3000
    echo.
    echo Process details:
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
        echo PID: %%a
        tasklist | findstr %%a
    )
) else (
    echo [INFO] Server not running
)
echo.
pause
goto menu

:open_browser
cls
echo ========================================
echo Opening in browser...
echo ========================================
echo.
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Opening http://localhost:3000
    start http://localhost:3000
    timeout /t 2 /nobreak >nul
) else (
    echo [ERROR] Server not running
    echo Please start server first
    timeout /t 2 /nobreak >nul
)
goto menu

:exit
cls
echo.
echo Goodbye!
echo.
timeout /t 1 /nobreak >nul
exit
