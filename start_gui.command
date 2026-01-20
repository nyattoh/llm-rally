#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/gui"
export PLAYWRIGHT_BROWSERS_PATH=0

echo "Starting LLM Rally GUI..."
npm run dev
