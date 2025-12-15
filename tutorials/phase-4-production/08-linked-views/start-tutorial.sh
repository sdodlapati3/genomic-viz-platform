#!/bin/bash

# Tutorial 4.8: Linked Views & Multi-Panel Coordination
# Demonstrates coordinated multi-view visualizations

echo "📦 Starting Tutorial 4.8: Linked Views"
echo "======================================"

# Install dependencies if needed (use --prefix to avoid workspace issues)
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "Installing dependencies..."
    npm install --prefix .
fi

echo ""
echo "🚀 Starting development server on http://localhost:5183"
echo ""
echo "Features demonstrated:"
echo "  • Event Bus architecture"
echo "  • Shared Selection Store"
echo "  • D3.js brush selection"
echo "  • Reactive panel updates"
echo "  • Coordinated views"
echo ""

npx vite --port 5183
