@echo off
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%~dp0pw-profile" --new-window https://chatgpt.com https://claude.ai https://grok.com
