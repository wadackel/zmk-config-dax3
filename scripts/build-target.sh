#!/bin/bash
set -e

TARGET="${1:-dax3_R}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

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

docker-compose run --rm zmk bash -c "
  set -e

  # Set Zephyr environment variables
  export ZEPHYR_BASE=/workspace/zephyr
  export ZEPHYR_TOOLCHAIN_VARIANT=zephyr
  export ZEPHYR_SDK_INSTALL_DIR=/opt/zephyr-sdk-0.16.9

  SNIPPET_FLAG=''
  if [ -n '$SNIPPET' ]; then
    SNIPPET_FLAG='-DSNIPPET=$SNIPPET'
  fi

  west build -s zmk/app -b seeeduino_xiao_ble -d build/$TARGET -- \
    -DBOARD_ROOT=/workspace \
    -DSHIELD='$SHIELD' \
    \$SNIPPET_FLAG \
    -DZMK_CONFIG=/workspace/config \
    -DCMAKE_PREFIX_PATH='/workspace/zephyr/share/zephyr-package/cmake;/opt/zephyr-sdk-0.16.9/cmake'

  # Copy UF2 to build root for easier access
  if [ -f build/$TARGET/zephyr/zmk.uf2 ]; then
    cp build/$TARGET/zephyr/zmk.uf2 build/$TARGET.uf2
    echo ''
    echo 'Build complete!'
    echo '  build/$TARGET/zephyr/zmk.uf2'
    echo '  build/$TARGET.uf2'
  else
    echo ''
    echo 'Build failed: UF2 file not found'
    exit 1
  fi
"
