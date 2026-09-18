#!/bin/bash
# Builds "Deckfall Endless.app" — a self-contained macOS app (needs only Xcode Command Line Tools to BUILD, nothing to RUN).
# Usage: ./mac/build.sh [output-folder]   (default: ./dist)
set -euo pipefail
cd "$(dirname "$0")/.."
APP="Deckfall Endless.app"
OUT="${1:-$PWD/dist}"
mkdir -p "$OUT"
rm -rf "$OUT/$APP"
mkdir -p "$OUT/$APP/Contents/MacOS" "$OUT/$APP/Contents/Resources/game"
cp mac/Info.plist "$OUT/$APP/Contents/Info.plist"
cp -R index.html css js "$OUT/$APP/Contents/Resources/game/"
[ -f mac/AppIcon.icns ] && cp mac/AppIcon.icns "$OUT/$APP/Contents/Resources/AppIcon.icns"
swiftc -O -framework Cocoa -framework WebKit mac/main.swift -o "$OUT/$APP/Contents/MacOS/DeckfallEndless"
codesign --force --sign - "$OUT/$APP" >/dev/null 2>&1 || true
echo "Built: $OUT/$APP"
