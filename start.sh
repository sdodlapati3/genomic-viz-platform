#!/bin/bash
# Genomic Viz Platform - Tutorial Launcher
# Usage: ./start.sh [tutorial-number]
# Example: ./start.sh 1.1

# Activate conda environment
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate genomic-viz

TUTORIAL=${1:-"1.1"}

case $TUTORIAL in
  "1.1"|"svg-canvas")
    echo "🧬 Starting Tutorial 1.1: SVG & Canvas"
    cd tutorials/phase-1-frontend/01-svg-canvas
    npx vite --port 5173 --open
    ;;
  "1.2"|"d3-core")
    echo "🧬 Starting Tutorial 1.2: D3 Core"
    cd tutorials/phase-1-frontend/02-d3-core
    npx vite --port 5174 --open
    ;;
  "1.3"|"lollipop")
    echo "🧬 Starting Tutorial 1.3: Lollipop Plot"
    cd tutorials/phase-1-frontend/03-lollipop-plot
    npx vite --port 5175 --open
    ;;
  "1.4"|"genome-browser")
    echo "🧬 Starting Tutorial 1.4: Genome Browser"
    cd tutorials/phase-1-frontend/04-genome-browser
    npx vite --open
    ;;
  *)
    echo "Available tutorials:"
    echo "  1.1 / svg-canvas     - SVG & Canvas Fundamentals"
    echo "  1.2 / d3-core        - D3.js Core Concepts"
    echo "  1.3 / lollipop       - Mutation Lollipop Plot"
    echo "  1.4 / genome-browser - Genome Browser Track"
    echo ""
    echo "Usage: ./start.sh [tutorial]"
    ;;
esac
