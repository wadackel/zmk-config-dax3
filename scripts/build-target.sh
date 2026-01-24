#!/bin/bash
set -e

# Nix環境チェック
if [ -z "$IN_NIX_SHELL" ]; then
  echo "ERROR: Must run inside nix develop environment"
  echo "Run: nix develop"
  exit 1
fi

if [ -z "$ZEPHYR_SDK_INSTALL_DIR" ]; then
  echo "ERROR: ZEPHYR_SDK_INSTALL_DIR is not set"
  echo "Please check your Nix environment configuration"
  exit 1
fi

TARGET="${1:-dax3_R}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# west workspace初期化チェック
if [ ! -f .west/config ]; then
  echo "ERROR: West workspace not initialized"
  echo "Run: just setup"
  exit 1
fi

CPU_COUNT=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo '4')
PARALLEL_LEVEL=$((CPU_COUNT - 1))
PARALLEL_LEVEL=$((PARALLEL_LEVEL < 2 ? 2 : PARALLEL_LEVEL))

case "$TARGET" in
  dax3_R)
    SHIELD="dax3_R;rgbled_adapter"
    SNIPPET="studio-rpc-usb-uart"
    ;;
  dax3_L)
    SHIELD="dax3_L;rgbled_adapter"
    SNIPPET=""
    ;;
  settings_reset)
    SHIELD="settings_reset"
    SNIPPET=""
    ;;
  *)
    echo "Error: Unknown target '$TARGET'"
    echo "Usage: $0 [dax3_R|dax3_L|settings_reset]"
    exit 1
    ;;
esac

echo "Building: $TARGET"
echo "Parallel: $PARALLEL_LEVEL"

west build -s zmk/app -b xiao_ble -d "build/$TARGET" -- \
  -DBOARD_ROOT="$PROJECT_ROOT" \
  -DSHIELD="$SHIELD" \
  ${SNIPPET:+-DSNIPPET="$SNIPPET"} \
  -DZMK_CONFIG="$PROJECT_ROOT/config" \
  -DCMAKE_BUILD_PARALLEL_LEVEL=$PARALLEL_LEVEL \
  -DCMAKE_C_COMPILER_LAUNCHER=ccache \
  -DCMAKE_CXX_COMPILER_LAUNCHER=ccache

if [ -f "build/$TARGET/zephyr/zmk.uf2" ]; then
  cp "build/$TARGET/zephyr/zmk.uf2" "build/$TARGET.uf2"
  echo ""
  echo "Build complete!"
  echo "  build/$TARGET/zephyr/zmk.uf2"
  echo "  build/$TARGET.uf2"
else
  echo ""
  echo "Build failed: UF2 file not found"
  exit 1
fi
