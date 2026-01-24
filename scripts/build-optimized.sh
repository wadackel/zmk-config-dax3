#!/bin/bash
set -e

# Nix環境チェック
if [ -z "$IN_NIX_SHELL" ]; then
  echo "ERROR: Must run inside nix develop environment"
  echo "Run: nix develop"
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# build-nix.shを実行（sourceではなくbash実行で副作用を防ぐ）
bash scripts/build-nix.sh
