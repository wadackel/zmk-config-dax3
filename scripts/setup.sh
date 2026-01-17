#!/bin/bash
set -e

echo "Setting up ZMK local build environment..."

docker-compose run --rm zmk bash -c "
  set -e

  # Initialize west workspace (skip if already initialized)
  if [ ! -f .west/config ]; then
    echo 'Initializing west workspace...'
    west init -l config/
  fi

  # Fetch external modules
  echo 'Fetching external modules...'
  west update

  # Install Python packages
  echo 'Installing Python packages...'
  west zephyr-export

  echo 'Setup complete!'
"
