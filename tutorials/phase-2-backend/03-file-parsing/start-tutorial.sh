#!/bin/bash

# Tutorial 2.3: Parsing Genomic File Formats
# Start script for the file parsing tutorial

echo "🧬 Starting Tutorial 2.3: Parsing Genomic File Formats"
echo "======================================================="

# Navigate to tutorial directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "📁 Project Structure:"
echo "---------------------"
echo "data/           - Sample genomic files (VCF, GFF3, BED)"
echo "src/parsers/    - File format parsers"
echo "src/routes/     - API routes for parsing"
echo "src/examples/   - Example parser scripts"
echo ""

echo "🧪 Running Example Parsers..."
echo ""

echo "1️⃣  Parsing VCF (Variant Call Format):"
echo "----------------------------------------"
npm run parse:vcf
echo ""

echo "2️⃣  Parsing GFF3 (Gene Annotations):"
echo "-------------------------------------"
npm run parse:gff
echo ""

echo "3️⃣  Parsing BED (Genomic Intervals):"
echo "-------------------------------------"
npm run parse:bed
echo ""

echo "🚀 Starting API Server..."
echo "========================="
echo "Server will run at: http://localhost:3003"
echo ""
echo "API Endpoints:"
echo "  GET  /api/parse/sample/vcf  - Parse sample VCF"
echo "  GET  /api/parse/sample/gff  - Parse sample GFF3"
echo "  GET  /api/parse/sample/bed  - Parse sample BED"
echo "  POST /api/parse/vcf         - Upload and parse VCF"
echo "  POST /api/parse/gff         - Upload and parse GFF3"
echo "  POST /api/parse/bed         - Upload and parse BED"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node src/server.js
