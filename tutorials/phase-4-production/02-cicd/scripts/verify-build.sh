#!/bin/bash
# Build verification script
# Validates build output before deployment

set -e

BUILD_DIR=${1:-dist}

echo "🔍 Verifying build in $BUILD_DIR..."

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
  echo "❌ Build directory not found: $BUILD_DIR"
  exit 1
fi

# Check for required files
REQUIRED_FILES=("index.html" "assets")
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -e "$BUILD_DIR/$file" ]; then
    echo "❌ Required file/folder missing: $BUILD_DIR/$file"
    exit 1
  fi
  echo "✅ Found: $BUILD_DIR/$file"
done

# Check for JavaScript bundle
JS_FILES=$(find "$BUILD_DIR/assets" -name "*.js" 2>/dev/null | wc -l)
if [ "$JS_FILES" -eq 0 ]; then
  echo "❌ No JavaScript files found in $BUILD_DIR/assets"
  exit 1
fi
echo "✅ Found $JS_FILES JavaScript bundle(s)"

# Check for CSS bundle
CSS_FILES=$(find "$BUILD_DIR/assets" -name "*.css" 2>/dev/null | wc -l)
if [ "$CSS_FILES" -eq 0 ]; then
  echo "⚠️  No CSS files found (may be inline)"
else
  echo "✅ Found $CSS_FILES CSS bundle(s)"
fi

# Check bundle sizes
echo ""
echo "📊 Bundle sizes:"
find "$BUILD_DIR/assets" -type f \( -name "*.js" -o -name "*.css" \) -exec ls -lh {} \; | awk '{print "  " $NF ": " $5}'

# Calculate total size
TOTAL_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
echo ""
echo "📦 Total build size: $TOTAL_SIZE"

# Check for source maps (should not be in production)
SOURCE_MAPS=$(find "$BUILD_DIR" -name "*.map" 2>/dev/null | wc -l)
if [ "$SOURCE_MAPS" -gt 0 ]; then
  echo "⚠️  Warning: Found $SOURCE_MAPS source map file(s) - consider removing for production"
fi

# Validate HTML
if command -v htmlhint &> /dev/null; then
  echo ""
  echo "🔧 Validating HTML..."
  htmlhint "$BUILD_DIR/index.html" || echo "⚠️  HTML validation warnings found"
fi

# Check for common security issues
echo ""
echo "🔐 Security checks:"

# Check for inline scripts (potential XSS)
INLINE_SCRIPTS=$(grep -c "<script>" "$BUILD_DIR/index.html" 2>/dev/null || echo "0")
if [ "$INLINE_SCRIPTS" -gt 0 ]; then
  echo "⚠️  Found $INLINE_SCRIPTS inline script tag(s)"
else
  echo "✅ No inline script tags"
fi

# Check for http:// URLs (should be https://)
HTTP_URLS=$(grep -r "http://" "$BUILD_DIR" 2>/dev/null | grep -v "localhost" | wc -l)
if [ "$HTTP_URLS" -gt 0 ]; then
  echo "⚠️  Found $HTTP_URLS non-HTTPS URL(s)"
else
  echo "✅ All external URLs use HTTPS"
fi

echo ""
echo "✅ Build verification complete!"
