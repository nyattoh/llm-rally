@echo off
setlocal
cd /d "%~dp0"
set PLAYWRIGHT_BROWSERS_PATH=0

echo Installing root dependencies...
call npm install
if errorlevel 1 exit /b 1

echo Installing GUI dependencies...
pushd gui
call npm install
if errorlevel 1 exit /b 1
popd

echo Installing Playwright browsers...
call npx playwright install
if errorlevel 1 exit /b 1

echo.
echo Install complete.
endlocal
