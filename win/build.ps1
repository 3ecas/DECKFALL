# Builds "Deckfall Endless.exe" — a self-contained Windows launcher with the whole game embedded.
# Needs nothing to BUILD beyond Windows itself (the C# compiler ships with .NET Framework 4, part of Windows 10/11),
# and nothing to RUN beyond Microsoft Edge or Chrome, which the exe opens in app mode with its own profile.
# Usage: powershell -ExecutionPolicy Bypass -File win\build.ps1 [-Out <folder>]   (default: .\dist), or double-click win\build.cmd
param([string]$Out = '')
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not $Out) { $Out = Join-Path $root 'dist' }

$csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (-not (Test-Path $csc)) { $csc = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\csc.exe' }
if (-not (Test-Path $csc)) { throw 'C# compiler not found. It comes with .NET Framework 4 (part of Windows 10/11).' }

$ico = Join-Path $root 'win\AppIcon.ico'
if (-not (Test-Path $ico)) { & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root 'win\makeicon.ps1') | Out-Null }

# Every game file becomes an embedded resource named game/<path>, which the launcher unpacks on start.
$files = @(Get-Item (Join-Path $root 'index.html')) + @(Get-ChildItem -Path (Join-Path $root 'css'), (Join-Path $root 'js') -Recurse -File)
$resources = foreach ($f in $files) { $rel = $f.FullName.Substring($root.Length + 1) -replace '\\', '/'; "/resource:`"$($f.FullName)`",game/$rel" }

New-Item -ItemType Directory -Force $Out | Out-Null
$exe = Join-Path $Out 'Deckfall Endless.exe'
$rsp = Join-Path $env:TEMP 'deckfall-csc.rsp'
@(
  '/nologo', '/target:winexe', '/optimize+', '/platform:anycpu', '/nowarn:1591'
  "/win32icon:`"$ico`""
  "/out:`"$exe`""
  '/r:System.dll', '/r:System.Windows.Forms.dll'
  $resources
  "`"$(Join-Path $root 'win\Program.cs')`""
) | Set-Content -Path $rsp -Encoding ASCII
& $csc "@$rsp"
if ($LASTEXITCODE -ne 0) { throw "csc failed with exit code $LASTEXITCODE" }
Remove-Item $rsp -ErrorAction SilentlyContinue
"Built: $exe ($([math]::Round((Get-Item $exe).Length / 1KB)) KB, $($files.Count) game files embedded)"
