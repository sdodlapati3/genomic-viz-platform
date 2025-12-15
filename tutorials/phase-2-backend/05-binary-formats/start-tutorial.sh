#!/bin/bash

# Start Binary Formats Tutorial Server
# Tutorial 2.5: Binary Genomic File Formats

echo "🧬 Starting Binary Formats Tutorial Server..."
echo "=============================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check for sample data
if [ ! -f "data/sample.bam" ]; then
    echo "⚠️  Sample data not found."
    echo "   Running: npm run download-samples"
    echo "   (or use the small test files included)"
    echo ""
fi

echo "🚀 Starting development server on http://localhost:3005"
echo ""
echo "Available endpoints:"
echo "  GET /api/bam/header          - BAM file header"
echo "  GET /api/bam/reads/:chr/:start/:end"
echo "  GET /api/bam/coverage/:chr/:start/:end"
echo "  GET /api/bigwig/chromosomes  - BigWig chromosome list"
echo "  GET /api/bigwig/signal/:chr/:start/:end"
echo ""

npm run dev
