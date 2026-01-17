#!/bin/bash
set -e

TARGET="${1:-dax3_R}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Prefer flat UF2 file in build root, fall back to nested path
if [ -f "$PROJECT_ROOT/build/$TARGET.uf2" ]; then
  UF2_FILE="$PROJECT_ROOT/build/$TARGET.uf2"
elif [ -f "$PROJECT_ROOT/build/$TARGET/zephyr/zmk.uf2" ]; then
  UF2_FILE="$PROJECT_ROOT/build/$TARGET/zephyr/zmk.uf2"
else
  echo "Error: Build artifact not found"
  echo "Expected: build/$TARGET.uf2 or build/$TARGET/zephyr/zmk.uf2"
  echo "Please run 'just build-target $TARGET' or 'just build' first"
  exit 1
fi

# Detect mass storage device on macOS
MOUNT_POINT="/Volumes/XIAO-SENSE"

if [ ! -d "$MOUNT_POINT" ]; then
  echo "Warning: Bootloader mode device not found"
  echo ""
  echo "To enter bootloader mode:"
  echo "  1. Double-tap the RST button on Seeeduino XIAO BLE quickly"
  echo "  2. Wait for '$MOUNT_POINT' to be mounted"
  echo "  3. Run this script again"
  exit 1
fi

echo "Ready to flash"
echo "  Target: $TARGET"
echo "  File: $UF2_FILE"
echo "  Mount: $MOUNT_POINT"
echo ""
read -p "Start flashing? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled"
  exit 0
fi

echo "Flashing..."
cp "$UF2_FILE" "$MOUNT_POINT/"

echo "Flash complete!"
echo "Device will restart automatically"
