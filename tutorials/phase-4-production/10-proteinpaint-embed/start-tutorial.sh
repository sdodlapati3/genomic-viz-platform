#!/bin/bash

# Tutorial 4.10: ProteinPaint Embed API
# Start both the demo server and check ProteinPaint status

echo "🧬 Tutorial 4.10: ProteinPaint Embed API"
echo "========================================"
echo ""

# Check if ProteinPaint is running
echo "Checking ProteinPaint server status..."
if curl -s http://localhost:3000/genomes > /dev/null 2>&1; then
    echo "✅ ProteinPaint is running at http://localhost:3000"
else
    echo "⚠️  ProteinPaint is NOT running at http://localhost:3000"
    echo ""
    echo "To start ProteinPaint with Docker:"
    echo "  docker start ppdev"
    echo ""
    echo "Or if container doesn't exist:"
    echo "  cd /path/to/proteinpaint"
    echo "  docker run -d --name ppdev -p 3000:3000 -v \$(pwd):/home/root/pp ghcr.io/stjude/devcontainer:latest"
    echo ""
fi

echo ""
echo "Starting demo server on port 5185..."
echo "Open http://localhost:5185 in your browser"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npx serve -l 5185 .
