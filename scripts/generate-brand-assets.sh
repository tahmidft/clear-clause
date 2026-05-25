#!/usr/bin/env bash
# Regenerate raster brand assets from frontend/public SVGs (requires rsvg-convert + ImageMagick).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/frontend/public"

if ! command -v rsvg-convert >/dev/null 2>&1; then
  echo "rsvg-convert not found; skipping raster generation." >&2
  exit 0
fi

CONVERT="${CONVERT:-}"
if command -v magick >/dev/null 2>&1; then
  CONVERT="magick"
elif command -v convert >/dev/null 2>&1; then
  CONVERT="convert"
else
  echo "ImageMagick not found; skipping favicon.ico / og-image." >&2
  CONVERT=""
fi

echo "Generating favicon PNGs…"
rsvg-convert -w 32 -h 32 "$PUBLIC/favicon.svg" -o "$PUBLIC/favicon-32.png"
rsvg-convert -w 180 -h 180 "$PUBLIC/brand-mark.svg" -o "$PUBLIC/apple-touch-icon.png"

if [[ -n "$CONVERT" ]]; then
  echo "Generating favicon.ico…"
  $CONVERT "$PUBLIC/favicon-32.png" -define icon:auto-resize=64,48,32,16 "$PUBLIC/favicon.ico"

  echo "Generating og-image.png…"
  rsvg-convert -w 220 -h 220 "$PUBLIC/brand-mark.svg" -o "$PUBLIC/.og-mark.png"
  $CONVERT -size 1200x630 gradient:'#f2f2f7-#e5eaf2' "$PUBLIC/.og-mark.png" -gravity center -composite \
    "$PUBLIC/og-image.png"
  rm -f "$PUBLIC/.og-mark.png"
fi

echo "Brand assets updated in $PUBLIC"
