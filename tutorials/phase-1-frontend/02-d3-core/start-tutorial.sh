#!/bin/bash
# Start Tutorial 1.2: D3.js Core Concepts
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate genomic-viz
cd "$(dirname "$0")"
echo "🧬 Starting D3.js Core Tutorial..."
echo "   Environment: genomic-viz"
echo "   Opening: http://localhost:5174"
echo ""
npx vite --port 5174 --open
