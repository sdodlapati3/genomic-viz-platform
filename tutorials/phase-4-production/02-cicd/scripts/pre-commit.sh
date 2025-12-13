#!/bin/bash
# Pre-commit hook script
# Runs linting, formatting, and tests before allowing commit

set -e

echo "🔍 Running pre-commit checks..."

# Check for staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts|json)$' || true)

if [ -z "$STAGED_FILES" ]; then
  echo "✅ No JS/TS files to check"
  exit 0
fi

echo "📝 Checking files:"
echo "$STAGED_FILES"

# Run ESLint on staged files
echo ""
echo "🔧 Running ESLint..."
npx eslint $STAGED_FILES --fix
git add $STAGED_FILES

# Run Prettier on staged files  
echo ""
echo "✨ Running Prettier..."
npx prettier --write $STAGED_FILES
git add $STAGED_FILES

# Run tests related to changed files
echo ""
echo "🧪 Running related tests..."
npx vitest related $STAGED_FILES --run

echo ""
echo "✅ All pre-commit checks passed!"
