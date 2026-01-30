# List available recipes
default:
    @just --list

# Initial setup: Initialize west workspace and fetch modules
setup:
    @bash scripts/setup.sh

# Build all targets with Nix environment
build:
    @bash scripts/build-optimized.sh

# Build specific target (e.g., just build-target dax3_R)
build-target TARGET="dax3_R":
    @bash scripts/build-target.sh {{TARGET}}

# Clean build artifacts
clean:
    @echo "Cleaning build artifacts..."
    @rm -rf build/
    @echo "Build artifacts cleaned"

# Complete cleanup including west workspace (for recovery from broken states)
pristine:
    @echo "Performing complete cleanup..."
    @rm -rf build/ .west/ modules/ zephyr/ zmk/ bootloader/ .ccache/
    @echo "Complete cleanup done. Run 'just setup' to reinitialize."
