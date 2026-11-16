$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
function Assert-InWorkspace([string]$candidate) {
  $full = [System.IO.Path]::GetFullPath($candidate)
  if (!$full.StartsWith($projectRoot + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path outside workspace: $full"
  }
  return $full
}

$pkg = Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$version = [string]$pkg.version
if ($version -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid package version.' }
$dist = Assert-InWorkspace (Join-Path $projectRoot 'dist')
$stage = Assert-InWorkspace (Join-Path $dist '.share-stage')
$output = Assert-InWorkspace (Join-Path $dist "VuonPixel-$version-Windows")
$zip = Assert-InWorkspace (Join-Path $dist "VuonPixel-$version-Windows.zip")
$hashFile = Assert-InWorkspace (Join-Path $dist "VuonPixel-$version-Windows.sha256")
$asarCli = Join-Path $projectRoot 'node_modules\@electron\asar\bin\asar.js'
if (!(Test-Path -LiteralPath $asarCli)) { throw 'Run npm install before building.' }

$runtime = @(
  (Join-Path $dist 'win-unpacked'),
  (Join-Path $projectRoot 'node_modules\electron\dist')
) | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'electron.exe') } | Select-Object -First 1
if (!$runtime) { throw 'Electron runtime missing. Run npm install or npm run dist first.' }

New-Item -ItemType Directory -Path $dist -Force | Out-Null
if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
if (Test-Path -LiteralPath $output) { Remove-Item -LiteralPath $output -Recurse -Force }
New-Item -ItemType Directory -Path $stage, $output -Force | Out-Null
try {
  Get-ChildItem -LiteralPath $runtime -Force | Where-Object { $_.Name -notin @('Vuon Pixel.exe', 'VuonPixel.exe') } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $output -Recurse -Force
  }
  $electronExe = Join-Path $output 'electron.exe'
  if (!(Test-Path -LiteralPath $electronExe)) { throw 'Electron runtime copy failed.' }
  Rename-Item -LiteralPath $electronExe -NewName 'VuonPixel.exe'

  Copy-Item -LiteralPath (Join-Path $projectRoot 'src') -Destination $stage -Recurse
  New-Item -ItemType Directory -Path (Join-Path $stage 'assets') -Force | Out-Null
  Copy-Item -LiteralPath (Join-Path $projectRoot 'assets\icon.png') -Destination (Join-Path $stage 'assets')
  Copy-Item -LiteralPath (Join-Path $projectRoot 'assets\icon-alert.png') -Destination (Join-Path $stage 'assets')
  Copy-Item -LiteralPath (Join-Path $projectRoot 'package.json') -Destination $stage
  $resources = Join-Path $output 'resources'
  New-Item -ItemType Directory -Path $resources -Force | Out-Null
  & node $asarCli pack $stage (Join-Path $resources 'app.asar')
  if ($LASTEXITCODE -ne 0) { throw 'ASAR packaging failed.' }

  $launcher = @'
@echo off
cd /d "%~dp0"
start "" "%~dp0VuonPixel.exe"
'@
  Set-Content -LiteralPath (Join-Path $output 'Choi-Vuon-Pixel.cmd') -Value $launcher -Encoding ASCII
  $instructions = @'
VUON PIXEL - WINDOWS

1. Extract the entire ZIP file.
2. Double-click Choi-Vuon-Pixel.cmd to start the game.
3. Keep all files in this folder together. Do not run from inside the ZIP.
4. LAN play is off by default. Only share invitation codes privately.
5. To close the game completely, use the tray icon's Exit command.

The game stores your save in your own Windows app-data folder.
'@
  Set-Content -LiteralPath (Join-Path $output 'DOC-TRUOC-KHI-CHOI.txt') -Value $instructions -Encoding ASCII

  if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
  Compress-Archive -Path (Join-Path $output '*') -DestinationPath $zip -CompressionLevel Optimal
  $hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash.ToLowerInvariant()
  Set-Content -LiteralPath $hashFile -Value "$hash  $(Split-Path -Leaf $zip)" -Encoding ASCII
  Write-Output "ZIP: $zip"
  Write-Output "SHA256: $hash"
} finally {
  if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
}
