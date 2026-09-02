#!/bin/sh
set -eu
root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
for size in 72 96 128 144 152 180 192 384 512; do
  sips -s format png -z "$size" "$size" "$root/public/logo-placeholder.svg" --out "$root/public/icons/icon-${size}.png" >/dev/null
done
cp "$root/public/icons/icon-192.png" "$root/public/icons/icon-maskable-192.png"
cp "$root/public/icons/icon-512.png" "$root/public/icons/icon-maskable-512.png"
cp "$root/public/icons/icon-512.png" "$root/public/icons/icon-mono-512.png"
