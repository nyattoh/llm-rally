#!/bin/bash
set -euo pipefail
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -x "$CHROME" ]; then
  echo "Google Chrome not found: $CHROME"
  exit 1
fi
"$CHROME" --remote-debugging-port=9222 --user-data-dir="$(dirname "$0")/pw-profile" --new-window https://chatgpt.com https://claude.ai https://grok.com
