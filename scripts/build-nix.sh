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

# プロジェクトルート検出して移動
if [ -d .git ]; then
  PROJECT_ROOT="$PWD"
else
  PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

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

echo "Building with Nix"
echo "Project: $PROJECT_ROOT"
echo "Parallel: $PARALLEL_LEVEL"
echo "SDK: $ZEPHYR_SDK_INSTALL_DIR"

build_target() {
  local target=$1
  local shield=$2
  local snippet=$3

  echo "Building: $target"

  west build -s zmk/app -b seeeduino_xiao_ble -d "build/$target" -- \
    -DBOARD_ROOT="$PROJECT_ROOT" \
    -DSHIELD="$shield" \
    ${snippet:+-DSNIPPET="$snippet"} \
    -DZMK_CONFIG="$PROJECT_ROOT/config" \
    -DCMAKE_BUILD_PARALLEL_LEVEL=$PARALLEL_LEVEL \
    -DCMAKE_C_COMPILER_LAUNCHER=ccache \
    -DCMAKE_CXX_COMPILER_LAUNCHER=ccache

  if [ -f "build/$target/zephyr/zmk.uf2" ]; then
    cp "build/$target/zephyr/zmk.uf2" "build/$target.uf2"
    echo "$target build completed"
  else
    echo "ERROR: Build failed for $target - UF2 file not found"
    exit 1
  fi
}

ccache -s 2>/dev/null || echo 'ccache initializing...'

build_target "dax3_R" "dax3_R;rgbled_adapter" "studio-rpc-usb-uart"
build_target "dax3_L" "dax3_L;rgbled_adapter" ""
build_target "settings_reset" "settings_reset" ""

echo "All builds completed!"
ccache -s
