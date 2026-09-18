@echo off
rem Double-click to build dist\Deckfall Endless.exe (see build.ps1).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build.ps1" %*
if errorlevel 1 pause
