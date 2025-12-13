#!/bin/bash

# Tutorial 3.1: UMAP/t-SNE Scatter Plot
# Start script

echo "🧬 Starting Tutorial 3.1: UMAP/t-SNE Scatter Plot"
echo "=================================================="
echo ""

cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting development server on port 3005..."
echo ""
echo "Features:"
echo "  • WebGL-accelerated scatter plot rendering"
echo "  • UMAP visualization of single-cell data"
echo "  • Color by cell type or gene expression"
echo "  • Interactive zoom, pan, and hover"
echo "  • Cell type filtering"
echo ""
echo "Open http://localhost:3005 in your browser"
echo ""

npm run dev
