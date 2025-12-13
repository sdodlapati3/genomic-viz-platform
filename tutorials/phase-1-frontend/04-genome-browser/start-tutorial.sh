#!/bin/bash
# Start Tutorial 1.4: Genome Browser
source "$(conda info --base)/etc/profile.d/conda.sh"
conda activate genomic-viz
cd "$(dirname "$0")"
echo "🧬 Starting Genome Browser Tutorial..."
echo "   Environment: genomic-viz"
echo "   Opening: http://localhost:5176"
echo ""
npx vite --port 5176 --open
