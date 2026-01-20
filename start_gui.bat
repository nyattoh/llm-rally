@echo off
cd /d "%~dp0gui"
set PLAYWRIGHT_BROWSERS_PATH=0

echo Starting LLM Rally GUI...
npm run dev
