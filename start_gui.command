#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/gui"
echo "Starting LLM Rally GUI..."
npm run dev
