#!/bin/bash
set -e

echo "Setting up ZMK local build environment..."

# Nix環境チェック
if [ -z "$IN_NIX_SHELL" ]; then
  echo "ERROR: Must run inside nix develop environment"
  echo "Run: nix develop"
  exit 1
fi

# プロジェクトルート検出
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f .west/config ]; then
  echo 'Initializing west workspace...'
  west init -l config/
fi

echo 'Fetching external modules...'
west update

echo 'Installing Python packages...'
west zephyr-export

echo 'Setup complete!'
