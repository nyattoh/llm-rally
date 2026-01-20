param(
  [string]$OutDir = "release",
  [string]$Name = "llm-rally-win"
)

$ErrorActionPreference = "Stop"
$repo = Resolve-Path (Join-Path $PSScriptRoot "..")
$staging = Join-Path $repo $OutDir
$zipPath = Join-Path $repo ("{0}.zip" -f $Name)

if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
New-Item -ItemType Directory -Path $staging | Out-Null

$required = @(
  "rally.mjs",
  "sites.json",
  "seed.txt",
  "start_gui.bat",
  "start_chrome.bat",
  "start_gui.command",
  "start_chrome.command",
  "install.bat",
  "install.command",
  "package.json",
  "README.md",
  "test-selectors.mjs",
  "gui\package.json",
  "gui\vite.config.js",
  "gui\tsconfig.json",
  "gui\tsconfig.electron.json",
  "gui\src",
  "gui\docs",
  "gui\tests"
)

foreach ($item in $required) {
  $src = Join-Path $repo $item
  if (!(Test-Path $src)) { throw "Missing: $item" }
  $dest = Join-Path $staging $item
  $destDir = Split-Path $dest -Parent
  if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  if (Test-Path $src -PathType Container) {
    Copy-Item $src -Destination $dest -Recurse -Force
  } else {
    Copy-Item $src -Destination $dest -Force
  }
}

$nodeModules = Join-Path $repo "node_modules"
$guiNodeModules = Join-Path $repo "gui\node_modules"
$pwCache = Join-Path $repo "node_modules\.cache\ms-playwright"

if (!(Test-Path $nodeModules)) { throw "Missing node_modules. Run install.bat first." }
if (!(Test-Path $guiNodeModules)) { throw "Missing gui/node_modules. Run install.bat first." }
if (!(Test-Path $pwCache)) { throw "Missing Playwright browsers. Run install.bat (with PLAYWRIGHT_BROWSERS_PATH=0)." }

Copy-Item $nodeModules -Destination (Join-Path $staging "node_modules") -Recurse -Force
Copy-Item $guiNodeModules -Destination (Join-Path $staging "gui\node_modules") -Recurse -Force

$stagedPwCache = Join-Path $staging "node_modules\.cache"
New-Item -ItemType Directory -Path $stagedPwCache -Force | Out-Null
Copy-Item $pwCache -Destination (Join-Path $stagedPwCache "ms-playwright") -Recurse -Force

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $staging "*") -DestinationPath $zipPath
Write-Host "Created: $zipPath"
