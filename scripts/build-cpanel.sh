#!/usr/bin/env bash
# Pravi self-contained paket za cPanel (Linux x64): deploy/instrukcije-cpanel.zip
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
OUT="$ROOT/deploy"
mkdir -p "$OUT"
echo "→ kopiranje projekta u $WORK"
rsync -a --exclude node_modules --exclude .next --exclude data --exclude deploy --exclude .env.local --exclude .git --exclude .models --exclude .venv "$ROOT/" "$WORK/src/"
cd "$WORK/src"
echo "→ instalacija zavisnosti"
npm ci --no-audit --no-fund
echo "→ build"
npm run build
B="$WORK/bundle"; mkdir -p "$B"
cp -R .next/standalone/. "$B/"
mkdir -p "$B/.next"
cp -R .next/static "$B/.next/static"
mkdir -p "$B/public"
cp -R public/. "$B/public/"   # spajanje (standalone već može imati public)
cp "$ROOT/scripts/cpanel-app.js" "$B/app.js"
if [ -f "$OUT/config.env" ]; then cp "$OUT/config.env" "$B/config.env"; else echo "! deploy/config.env ne postoji; napravite ga (vidi docs/CPANEL.md)"; fi
echo "→ Linux binarni paketi za sharp (cPanel je Linux x64)"
SHARP_VER="$(node -p "require('./node_modules/sharp/package.json').version")"
mkdir -p "$WORK/linux" && cd "$WORK/linux" && npm init -y >/dev/null
npm install --no-audit --no-fund --os=linux --cpu=x64 --libc=glibc "sharp@$SHARP_VER" >/dev/null
rm -rf "$B/node_modules/@img"
mkdir -p "$B/node_modules/@img"
cp -R "$WORK/linux/node_modules/@img/." "$B/node_modules/@img/"
cd "$WORK/src"
rm -f "$OUT/instrukcije-cpanel.zip"
(cd "$B" && zip -qr "$OUT/instrukcije-cpanel.zip" . -x "*.DS_Store")
echo "✔ gotovo: $OUT/instrukcije-cpanel.zip ($(du -h "$OUT/instrukcije-cpanel.zip" | cut -f1))"
