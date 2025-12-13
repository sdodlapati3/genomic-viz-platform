#!/bin/bash
# Start Tutorial 1.1: SVG & Canvas dev server
# Usage: ./start-tutorial.sh

# Activate conda environment
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate genomic-viz

# Navigate to tutorial directory and start Vite
cd "$(dirname "$0")"
echo "🧬 Starting SVG & Canvas Tutorial..."
echo "   Environment: genomic-viz"
echo "   Opening: http://localhost:5173"
echo ""
npx vite --open
