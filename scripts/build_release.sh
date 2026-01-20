#!/bin/bash
set -euo pipefail

OUT_DIR="${1:-release}"
NAME="${2:-llm-rally-mac}"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STAGING="$REPO_DIR/$OUT_DIR"
ZIP_PATH="$REPO_DIR/$NAME.zip"

rm -rf "$STAGING"
mkdir -p "$STAGING"

required=(
  "rally.mjs"
  "sites.json"
  "seed.txt"
  "start_gui.bat"
  "start_chrome.bat"
  "start_gui.command"
  "start_chrome.command"
  "install.bat"
  "install.command"
  "package.json"
  "README.md"
  "test-selectors.mjs"
  "gui/package.json"
  "gui/vite.config.js"
  "gui/tsconfig.json"
  "gui/tsconfig.electron.json"
  "gui/src"
  "gui/docs"
  "gui/tests"
)

for item in "${required[@]}"; do
  src="$REPO_DIR/$item"
  if [ ! -e "$src" ]; then
    echo "Missing: $item" >&2
    exit 1
  fi
  dest="$STAGING/$item"
  mkdir -p "$(dirname "$dest")"
  cp -R "$src" "$dest"
done

NODE_MODULES="$REPO_DIR/node_modules"
GUI_NODE_MODULES="$REPO_DIR/gui/node_modules"
PW_CACHE="$REPO_DIR/node_modules/.cache/ms-playwright"

if [ ! -d "$NODE_MODULES" ]; then
  echo "Missing node_modules. Run ./install.command first." >&2
  exit 1
fi
if [ ! -d "$GUI_NODE_MODULES" ]; then
  echo "Missing gui/node_modules. Run ./install.command first." >&2
  exit 1
fi
if [ ! -d "$PW_CACHE" ]; then
  echo "Missing Playwright browsers. Run ./install.command (PLAYWRIGHT_BROWSERS_PATH=0)." >&2
  exit 1
fi

cp -R "$NODE_MODULES" "$STAGING/node_modules"
cp -R "$GUI_NODE_MODULES" "$STAGING/gui/node_modules"
mkdir -p "$STAGING/node_modules/.cache"
cp -R "$PW_CACHE" "$STAGING/node_modules/.cache/ms-playwright"

rm -f "$ZIP_PATH"
(cd "$STAGING" && zip -r "$ZIP_PATH" .)

echo "Created: $ZIP_PATH"
