#!/bin/bash

# Tutorial 1.3: Lollipop Plot - Start Script
# Runs on port 5175

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source conda
source /opt/anaconda3/etc/profile.d/conda.sh
conda activate genomic-viz

cd "$SCRIPT_DIR"

echo "🧬 Starting Tutorial 1.3: Lollipop Plot..."
echo "📍 Directory: $SCRIPT_DIR"
echo "🌐 URL: http://localhost:5175"
echo ""

npm run dev -- --port 5175
