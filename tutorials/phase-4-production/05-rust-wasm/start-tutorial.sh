#!/bin/bash

# Start Tutorial: Rust/WebAssembly Performance
# This script sets up and starts the WASM tutorial

set -e

echo "🦀 Rust/WebAssembly Performance Tutorial"
echo "======================================="
echo ""

# Check for required tools
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        return 1
    fi
    echo "✓ $1 found"
    return 0
}

echo "Checking prerequisites..."

check_command node || exit 1
check_command npm || exit 1

# Check for Rust (optional but recommended)
if command -v rustc &> /dev/null; then
    echo "✓ Rust found ($(rustc --version))"
    if command -v wasm-pack &> /dev/null; then
        echo "✓ wasm-pack found"
    else
        echo "⚠ wasm-pack not found. Install with: cargo install wasm-pack"
    fi
else
    echo "⚠ Rust not found. For building WASM from source, install from https://rustup.rs"
    echo "  The tutorial includes pre-built WASM files for demonstration."
fi

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "Building WASM module (if Rust is available)..."
if command -v wasm-pack &> /dev/null; then
    npm run wasm:build || echo "Note: WASM build requires Rust toolchain setup"
else
    echo "Skipping WASM build (wasm-pack not available)"
fi

echo ""
echo "Starting development server..."
echo ""
echo "📖 Tutorial: http://localhost:5177"
echo "📁 Working directory: $(pwd)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
