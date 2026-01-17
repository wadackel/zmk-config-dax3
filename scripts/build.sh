#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Environment variables for Zephyr
export ZEPHYR_ENV="
  export ZEPHYR_BASE=/workspace/zephyr
  export ZEPHYR_TOOLCHAIN_VARIANT=zephyr
  export ZEPHYR_SDK_INSTALL_DIR=/opt/zephyr-sdk-0.16.9
"

# Build dax3_R in parallel
echo "Starting parallel build for dax3_R..."
docker-compose run --rm zmk bash -c "
  set -e
  $ZEPHYR_ENV
  echo 'Building: dax3_R'
  west build -s zmk/app -b seeeduino_xiao_ble -d build/dax3_R -- \
    -DBOARD_ROOT=/workspace \
    -DSHIELD='dax3_R;rgbled_adapter' \
    -DSNIPPET=studio-rpc-usb-uart \
    -DZMK_CONFIG=/workspace/config \
    -DCMAKE_PREFIX_PATH='/workspace/zephyr/share/zephyr-package/cmake;/opt/zephyr-sdk-0.16.9/cmake' \
    -DCMAKE_BUILD_PARALLEL_LEVEL=2
" > /tmp/build-dax3_R.log 2>&1 &
PID_R=$!

# Build dax3_L in parallel
echo "Starting parallel build for dax3_L..."
docker-compose run --rm zmk bash -c "
  set -e
  $ZEPHYR_ENV
  echo 'Building: dax3_L'
  west build -s zmk/app -b seeeduino_xiao_ble -d build/dax3_L -- \
    -DBOARD_ROOT=/workspace \
    -DSHIELD='dax3_L;rgbled_adapter' \
    -DZMK_CONFIG=/workspace/config \
    -DCMAKE_PREFIX_PATH='/workspace/zephyr/share/zephyr-package/cmake;/opt/zephyr-sdk-0.16.9/cmake' \
    -DCMAKE_BUILD_PARALLEL_LEVEL=2
" > /tmp/build-dax3_L.log 2>&1 &
PID_L=$!

# Build settings_reset in parallel
echo "Starting parallel build for settings_reset..."
docker-compose run --rm zmk bash -c "
  set -e
  $ZEPHYR_ENV
  echo 'Building: settings_reset'
  west build -s zmk/app -b seeeduino_xiao_ble -d build/settings_reset -- \
    -DBOARD_ROOT=/workspace \
    -DSHIELD=settings_reset \
    -DZMK_CONFIG=/workspace/config \
    -DCMAKE_PREFIX_PATH='/workspace/zephyr/share/zephyr-package/cmake;/opt/zephyr-sdk-0.16.9/cmake' \
    -DCMAKE_BUILD_PARALLEL_LEVEL=2
" > /tmp/build-settings_reset.log 2>&1 &
PID_RESET=$!

echo ""
echo "All builds started. Waiting for completion..."
echo "  - dax3_R (PID: $PID_R)"
echo "  - dax3_L (PID: $PID_L)"
echo "  - settings_reset (PID: $PID_RESET)"
echo ""

# Wait for all builds to complete
EXIT_CODE=0
wait $PID_R || EXIT_CODE=$?
wait $PID_L || EXIT_CODE=$?
wait $PID_RESET || EXIT_CODE=$?

# Check if any build failed
if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "ERROR: One or more builds failed. Check logs:"
  echo "  - /tmp/build-dax3_R.log"
  echo "  - /tmp/build-dax3_L.log"
  echo "  - /tmp/build-settings_reset.log"
  exit $EXIT_CODE
fi

echo ""
echo "All builds completed successfully!"

# Copy UF2 files to build root for easier access
echo "Copying UF2 files..."
cp build/dax3_R/zephyr/zmk.uf2 build/dax3_R.uf2
cp build/dax3_L/zephyr/zmk.uf2 build/dax3_L.uf2
cp build/settings_reset/zephyr/zmk.uf2 build/settings_reset.uf2

echo ""
echo "Build artifacts:"
echo "  build/dax3_R.uf2"
echo "  build/dax3_L.uf2"
echo "  build/settings_reset.uf2"
