#!/bin/bash

# Tutorial 4.9: Config Schema & Validation System
# Demonstrates production configuration management with Zod

echo "📦 Starting Tutorial 4.9: Config System"
echo "========================================"

# Install dependencies if needed (use --prefix to avoid workspace issues)
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "Installing dependencies..."
    npm install --prefix .
fi

echo ""
echo "🚀 Starting development server on http://localhost:5184"
echo ""
echo "Features demonstrated:"
echo "  • Zod schema validation"
echo "  • Configuration migrations"
echo "  • URL state persistence"
echo "  • Reactive config store"
echo "  • Config editor UI"
echo ""

npx vite --port 5184
