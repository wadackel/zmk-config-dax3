#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

docker-compose run --rm zmk bash -c "
  set -e

  # Set Zephyr environment variables
  export ZEPHYR_BASE=/workspace/zephyr
  export ZEPHYR_TOOLCHAIN_VARIANT=zephyr
  export ZEPHYR_SDK_INSTALL_DIR=/opt/zephyr-sdk-0.16.9

  # Target 1: dax3_R (right hand + trackball + ZMK Studio)
  echo 'Building: dax3_R'
  west build -s zmk/app -b xiao_ble -d build/dax3_R -- \
    -DBOARD_ROOT=/workspace \
    -DSHIELD='dax3_R;rgbled_adapter' \
    -DSNIPPET=studio-rpc-usb-uart \
    -DZMK_CONFIG=/workspace/config \
    -DCMAKE_PREFIX_PATH='/workspace/zephyr/share/zephyr-package/cmake;/opt/zephyr-sdk-0.16.9/cmake' \
    -DCMAKE_BUILD_PARALLEL_LEVEL=4

  # Target 2: dax3_L (left hand)
  echo 'Building: dax3_L'
  west build -s zmk/app -b xiao_ble -d build/dax3_L -- \
    -DBOARD_ROOT=/workspace \
    -DSHIELD='dax3_L;rgbled_adapter' \
    -DZMK_CONFIG=/workspace/config \
    -DCMAKE_PREFIX_PATH='/workspace/zephyr/share/zephyr-package/cmake;/opt/zephyr-sdk-0.16.9/cmake' \
    -DCMAKE_BUILD_PARALLEL_LEVEL=4

  # Target 3: settings_reset
  echo 'Building: settings_reset'
  west build -s zmk/app -b xiao_ble -d build/settings_reset -- \
    -DBOARD_ROOT=/workspace \
    -DSHIELD=settings_reset \
    -DZMK_CONFIG=/workspace/config \
    -DCMAKE_PREFIX_PATH='/workspace/zephyr/share/zephyr-package/cmake;/opt/zephyr-sdk-0.16.9/cmake' \
    -DCMAKE_BUILD_PARALLEL_LEVEL=4

  # Copy UF2 files to build root for easier access
  cp build/dax3_R/zephyr/zmk.uf2 build/dax3_R.uf2
  cp build/dax3_L/zephyr/zmk.uf2 build/dax3_L.uf2
  cp build/settings_reset/zephyr/zmk.uf2 build/settings_reset.uf2

  echo ''
  echo 'All builds completed successfully!'
  echo 'Build artifacts:'
  echo '  build/dax3_R.uf2'
  echo '  build/dax3_L.uf2'
  echo '  build/settings_reset.uf2'
"
