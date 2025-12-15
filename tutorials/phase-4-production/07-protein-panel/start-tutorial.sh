#!/bin/bash

# Tutorial 4.7: Interactive Protein Panel
# Demonstrates TypeScript + D3.js component architecture

echo "📦 Starting Tutorial 4.7: Interactive Protein Panel"
echo "=================================================="

# Install dependencies if needed (use --prefix to avoid workspace issues)
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "Installing dependencies..."
    npm install --prefix .
fi

echo ""
echo "🚀 Starting development server on http://localhost:5181"
echo ""
echo "Features demonstrated:"
echo "  • TypeScript with D3.js"
echo "  • Component-based architecture"
echo "  • Protein domain visualization"
echo "  • Mutation lollipop plot"
echo "  • Interactive tooltips"
echo ""

npx vite --port 5181
