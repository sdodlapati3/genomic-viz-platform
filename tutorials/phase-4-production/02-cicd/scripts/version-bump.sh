#!/bin/bash
# Version bump script for releases
# Usage: ./version-bump.sh [major|minor|patch]

set -e

VERSION_TYPE=${1:-patch}

echo "🔖 Bumping $VERSION_TYPE version..."

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Split version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Bump version
case $VERSION_TYPE in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo "❌ Invalid version type: $VERSION_TYPE"
    echo "Usage: ./version-bump.sh [major|minor|patch]"
    exit 1
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "New version: $NEW_VERSION"

# Update package.json
npm version $NEW_VERSION --no-git-tag-version

# Generate changelog entry
echo ""
echo "📝 Generating changelog entry..."
DATE=$(date +%Y-%m-%d)
CHANGELOG_ENTRY="## [$NEW_VERSION] - $DATE"

echo ""
echo "$CHANGELOG_ENTRY"
echo ""
echo "Please add release notes to CHANGELOG.md"

# Create version file for build
echo "$NEW_VERSION" > VERSION
echo "{ \"version\": \"$NEW_VERSION\", \"buildDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\" }" > dist/version.json 2>/dev/null || true

echo ""
echo "✅ Version bumped to $NEW_VERSION"
echo ""
echo "Next steps:"
echo "1. Update CHANGELOG.md with release notes"
echo "2. Commit changes: git commit -am 'chore: bump version to $NEW_VERSION'"
echo "3. Create tag: git tag v$NEW_VERSION"
echo "4. Push: git push && git push --tags"
