@echo off
title Meridian CRM Setup
color 0A
echo.
echo =============================================
echo   MERIDIAN CRM - Automatic Setup
echo =============================================
echo.

:: Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Please do this first:
    echo  1. Open your browser
    echo  2. Go to: https://nodejs.org
    echo  3. Click the big green LTS button to download
    echo  4. Install it ^(just keep clicking Next^)
    echo  5. Then double-click this file again
    echo.
    pause
    exit
)

echo  [OK] Node.js is installed!
echo.
echo  Setting up your project...
echo  ^(This will take about 1-2 minutes^)
echo.

:: Create project folder on Desktop
set DEST=%USERPROFILE%\Desktop\meridian-crm
if exist "%DEST%" (
    echo  Folder already exists, updating files...
) else (
    mkdir "%DEST%"
    mkdir "%DEST%\src"
)

:: Copy all project files
echo  Copying project files...
xcopy /Y /Q "%~dp0*" "%DEST%\" >nul 2>&1
xcopy /Y /Q /E "%~dp0src\*" "%DEST%\src\" >nul 2>&1

:: Go to project folder and install
cd /d "%DEST%"

echo  Installing packages ^(please wait...^)
call npm install --silent

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  Something went wrong during install.
    echo  Please contact support.
    pause
    exit
)

echo.
echo =============================================
echo   SUCCESS! Your CRM is ready!
echo =============================================
echo.
echo  Starting Meridian CRM...
echo  Your browser will open automatically.
echo.
echo  To start it again in future:
echo  Just double-click START.bat on your Desktop
echo.

:: Create a START shortcut on Desktop for future use
echo @echo off > "%USERPROFILE%\Desktop\START Meridian CRM.bat"
echo title Meridian CRM >> "%USERPROFILE%\Desktop\START Meridian CRM.bat"
echo cd /d "%DEST%" >> "%USERPROFILE%\Desktop\START Meridian CRM.bat"
echo echo Starting Meridian CRM... >> "%USERPROFILE%\Desktop\START Meridian CRM.bat"
echo echo Open your browser at: http://localhost:5173 >> "%USERPROFILE%\Desktop\START Meridian CRM.bat"
echo start http://localhost:5173 >> "%USERPROFILE%\Desktop\START Meridian CRM.bat"
echo npm run dev >> "%USERPROFILE%\Desktop\START Meridian CRM.bat"

:: Open browser and start dev server
timeout /t 2 >nul
start http://localhost:5173
npm run dev
