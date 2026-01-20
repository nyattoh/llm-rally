#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Installing root dependencies..."
npm install

echo "Installing GUI dependencies..."
cd gui
npm install
cd ..

echo "Installing Playwright browsers..."
npx playwright install

echo "Install complete."
