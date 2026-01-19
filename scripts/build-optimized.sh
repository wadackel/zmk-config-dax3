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

  # Detect CPU count and calculate optimal parallel level
  CPU_COUNT=\$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo '4')
  PARALLEL_LEVEL=\$((CPU_COUNT - 1))
  # Ensure minimum parallel level of 2
  PARALLEL_LEVEL=\$((PARALLEL_LEVEL < 2 ? 2 : PARALLEL_LEVEL))

  echo '=================================='
  echo 'Build Configuration'
  echo '=================================='
  echo \"CPU count: \$CPU_COUNT\"
  echo \"Parallel level: \$PARALLEL_LEVEL\"
  echo ''

  # Display ccache statistics before build
  echo '=================================='
  echo 'ccache Statistics (Before Build)'
  echo '=================================='
  ccache -s || echo 'ccache not available or not initialized yet'
  echo ''

  # Target 1: dax3_R (right hand + trackball + ZMK Studio)
  echo '=================================='
  echo 'Building: dax3_R'
  echo '=================================='
  west build -s zmk/app -b xiao_ble -d build/dax3_R -- \
    -DBOARD_ROOT=/workspace \
    -DSHIELD='dax3_R;rgbled_adapter' \
    -DSNIPPET=studio-rpc-usb-uart \
    -DZMK_CONFIG=/workspace/config \
    -DCMAKE_PREFIX_PATH='/workspace/zephyr/share/zephyr-package/cmake;/opt/zephyr-sdk-0.16.9/cmake' \
    -DCMAKE_BUILD_PARALLEL_LEVEL=\$PARALLEL_LEVEL \
    -DCMAKE_C_COMPILER_LAUNCHER=ccache \
    -DCMAKE_CXX_COMPILER_LAUNCHER=ccache
  echo 'dax3_R build completed'
  echo ''

  # Target 2: dax3_L (left hand)
  echo '=================================='
  echo 'Building: dax3_L'
  echo '=================================='
  west build -s zmk/app -b xiao_ble -d build/dax3_L -- \
    -DBOARD_ROOT=/workspace \
    -DSHIELD='dax3_L;rgbled_adapter' \
    -DZMK_CONFIG=/workspace/config \
    -DCMAKE_PREFIX_PATH='/workspace/zephyr/share/zephyr-package/cmake;/opt/zephyr-sdk-0.16.9/cmake' \
    -DCMAKE_BUILD_PARALLEL_LEVEL=\$PARALLEL_LEVEL \
    -DCMAKE_C_COMPILER_LAUNCHER=ccache \
    -DCMAKE_CXX_COMPILER_LAUNCHER=ccache
  echo 'dax3_L build completed'
  echo ''

  # Target 3: settings_reset
  echo '=================================='
  echo 'Building: settings_reset'
  echo '=================================='
  west build -s zmk/app -b xiao_ble -d build/settings_reset -- \
    -DBOARD_ROOT=/workspace \
    -DSHIELD=settings_reset \
    -DZMK_CONFIG=/workspace/config \
    -DCMAKE_PREFIX_PATH='/workspace/zephyr/share/zephyr-package/cmake;/opt/zephyr-sdk-0.16.9/cmake' \
    -DCMAKE_BUILD_PARALLEL_LEVEL=\$PARALLEL_LEVEL \
    -DCMAKE_C_COMPILER_LAUNCHER=ccache \
    -DCMAKE_CXX_COMPILER_LAUNCHER=ccache
  echo 'settings_reset build completed'
  echo ''

  # Copy UF2 files to build root for easier access
  cp build/dax3_R/zephyr/zmk.uf2 build/dax3_R.uf2
  cp build/dax3_L/zephyr/zmk.uf2 build/dax3_L.uf2
  cp build/settings_reset/zephyr/zmk.uf2 build/settings_reset.uf2

  # Display ccache statistics after build
  echo '=================================='
  echo 'ccache Statistics (After Build)'
  echo '=================================='
  ccache -s || echo 'ccache not available'
  echo ''

  echo '=================================='
  echo 'All Builds Completed Successfully!'
  echo '=================================='
  echo 'Build artifacts:'
  echo '  build/dax3_R.uf2'
  echo '  build/dax3_L.uf2'
  echo '  build/settings_reset.uf2'
  echo ''
  echo 'Build configuration:'
  echo \"  CPU count: \$CPU_COUNT\"
  echo \"  Parallel level: \$PARALLEL_LEVEL\"
"
