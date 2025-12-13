#!/bin/bash

# Tutorial 2.1: REST API - Start Script
# This script starts the Express.js development server

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Tutorial 2.1: Node.js REST API for Genomics              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🚀 Starting REST API server..."
echo "   Server will be available at: http://localhost:3001"
echo "   API Documentation at:        http://localhost:3001/api"
echo ""
echo "📋 Quick test commands:"
echo "   curl http://localhost:3001/api/health"
echo "   curl http://localhost:3001/api/genes"
echo "   curl http://localhost:3001/api/variants?gene=TP53"
echo ""
echo "Press Ctrl+C to stop the server"
echo "─────────────────────────────────────────────────────────────────"
echo ""

npm run dev
