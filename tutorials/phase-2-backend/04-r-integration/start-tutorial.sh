#!/bin/bash

# Tutorial 2.4: R Integration for Statistical Analysis
# Start script for the R integration tutorial

echo "🧬 Starting Tutorial 2.4: R Integration for Statistical Analysis"
echo "================================================================="

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
echo "data/           - Sample datasets (survival, expression, mutation)"
echo "src/services/   - R service and JS statistics fallback"
echo "src/routes/     - API endpoints for analyses"
echo "src/r-scripts/  - R statistical scripts"
echo "src/examples/   - Example analysis scripts"
echo ""

# Check R availability
echo "🔍 Checking R availability..."
if command -v Rscript &> /dev/null; then
    R_VERSION=$(Rscript --version 2>&1 | head -1)
    echo "✓ R is available: $R_VERSION"
else
    echo "⚠ R is not installed"
    echo "  The API will use JavaScript fallback for statistics"
    echo "  To install R:"
    echo "    macOS: brew install r"
    echo "    Ubuntu: sudo apt-get install r-base"
fi
echo ""

echo "🧪 Running Example Analyses..."
echo ""

echo "1️⃣  Survival Analysis Example:"
echo "--------------------------------"
npm run example:survival
echo ""

echo "2️⃣  Expression Analysis Example:"
echo "---------------------------------"
npm run example:expression
echo ""

echo "3️⃣  Mutation Analysis Example:"
echo "-------------------------------"
npm run example:mutation
echo ""

echo "🚀 Starting API Server..."
echo "========================="
echo "Server will run at: http://localhost:3004"
echo ""
echo "API Endpoints:"
echo "  GET /api/analysis/status"
echo "  GET /api/analysis/survival/kaplan-meier"
echo "  GET /api/analysis/survival/cox"
echo "  GET /api/analysis/expression/differential"
echo "  GET /api/analysis/expression/volcano"
echo "  GET /api/analysis/expression/correlation"
echo "  GET /api/analysis/mutation/enrichment"
echo "  GET /api/analysis/mutation/exclusivity"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node src/server.js
