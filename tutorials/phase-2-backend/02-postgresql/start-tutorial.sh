#!/bin/bash

# Tutorial 2.2: PostgreSQL Database - Start Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     Tutorial 2.2: PostgreSQL Database for Genomic Data       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check PostgreSQL connection
echo "🔍 Checking PostgreSQL connection..."
if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
        echo "   ✅ PostgreSQL is running"
    else
        echo "   ⚠️  PostgreSQL is not running"
        echo "   Start it with: brew services start postgresql"
        echo ""
    fi
else
    echo "   ℹ️  pg_isready not found, skipping check"
fi

echo ""
echo "📋 Setup commands (if not done):"
echo "   createdb genomic_viz"
echo "   npm run db:init"
echo "   npm run db:seed"
echo ""
echo "🚀 Starting PostgreSQL API server..."
echo "   Server will be available at: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop the server"
echo "─────────────────────────────────────────────────────────────────"
echo ""

node src/server.js
