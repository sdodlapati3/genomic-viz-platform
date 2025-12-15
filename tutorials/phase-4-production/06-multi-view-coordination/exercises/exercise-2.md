# Exercise 2: Selection Persistence and URL State

## Overview

Implement robust selection persistence that allows users to:

- Share selections via URL
- Bookmark and restore visualization states
- Support deep linking to specific views
- Handle state versioning and migration

## Learning Objectives

- Implement URL-based state persistence
- Handle state compression for complex selections
- Create state versioning for backwards compatibility
- Build shareable visualization links

## Task

### Part 1: URL State Manager

Create a comprehensive URL state manager:

```javascript
class URLStateManager {
  constructor(options = {}) {
    this.version = options.version || 1;
    this.prefix = options.prefix || 'viz';
    this.migrations = options.migrations || {};
  }

  /**
   * Encode complex state to URL-safe string
   */
  encodeState(state) {
    const stateWithVersion = {
      v: this.version,
      ...state,
    };

    // TODO: Implement encoding
    // 1. JSON stringify
    // 2. Compress (optional for large states)
    // 3. Base64 encode
    // 4. URL encode

    return encoded;
  }

  /**
   * Decode URL parameter back to state object
   */
  decodeState(encoded) {
    // TODO: Implement decoding
    // 1. URL decode
    // 2. Base64 decode
    // 3. Decompress (if compressed)
    // 4. JSON parse
    // 5. Run migrations if version mismatch

    return state;
  }

  /**
   * Migrate old state formats to current version
   */
  migrate(state, fromVersion) {
    let currentState = state;

    for (let v = fromVersion; v < this.version; v++) {
      if (this.migrations[v]) {
        currentState = this.migrations[v](currentState);
      }
    }

    return currentState;
  }

  /**
   * Push state to URL without page reload
   */
  pushState(state) {
    const encoded = this.encodeState(state);
    const url = new URL(window.location);
    url.searchParams.set(this.prefix, encoded);

    window.history.pushState(state, '', url);
  }

  /**
   * Read current state from URL
   */
  readState() {
    const url = new URL(window.location);
    const encoded = url.searchParams.get(this.prefix);

    if (!encoded) return null;

    return this.decodeState(encoded);
  }
}
```

### Part 2: Selection Serialization

Handle different selection types in URL:

```javascript
class SelectionSerializer {
  /**
   * Serialize selections for URL storage
   * Handles: single, multi, range, brush selections
   */
  serialize(selections) {
    return {
      // Point selections: store IDs
      points: Array.from(selections.points || []),

      // Range selections: store bounds
      ranges: (selections.ranges || []).map((r) => ({
        field: r.field,
        min: r.min,
        max: r.max,
      })),

      // Brush selections: store coordinates
      brushes: (selections.brushes || []).map((b) => ({
        view: b.viewId,
        x: [b.x0, b.x1],
        y: [b.y0, b.y1],
      })),
    };
  }

  /**
   * Deserialize selections from URL
   */
  deserialize(serialized) {
    // TODO: Convert serialized format back to Selection objects
    // Validate IDs still exist in current data
    // Handle missing/stale selections gracefully
  }

  /**
   * Compress large selections
   * Use run-length encoding for consecutive IDs
   */
  compress(selections) {
    // TODO: If > 100 items, use compression
    // [1,2,3,4,5,10,11,12] -> "1-5,10-12"
  }

  decompress(compressed) {
    // TODO: Reverse the compression
    // "1-5,10-12" -> [1,2,3,4,5,10,11,12]
  }
}
```

### Part 3: Deep Linking

Support linking to specific view configurations:

```javascript
class DeepLinkManager {
  constructor(urlManager, viewRegistry) {
    this.urlManager = urlManager;
    this.viewRegistry = viewRegistry;
  }

  /**
   * Generate shareable link with current state
   */
  generateLink(options = {}) {
    const state = {
      // View configuration
      views: this.getViewStates(),

      // Current selections
      selections: this.getSelections(),

      // Active filters
      filters: this.getFilters(),

      // View-specific state (zoom, pan, etc.)
      viewState: options.includeViewState ? this.getDetailedViewState() : undefined,
    };

    // TODO: Generate full URL with encoded state
  }

  /**
   * Apply state from URL on page load
   */
  async applyDeepLink() {
    const state = this.urlManager.readState();
    if (!state) return;

    // TODO: Apply state in correct order
    // 1. Load data if needed
    // 2. Configure views
    // 3. Apply filters
    // 4. Restore selections
    // 5. Apply view state (zoom/pan)
  }

  /**
   * Watch for popstate (browser back/forward)
   */
  setupHistoryNavigation() {
    window.addEventListener('popstate', (event) => {
      // TODO: Restore state from history
    });
  }
}
```

### Part 4: State Versioning

Handle backwards compatibility:

```javascript
// Migration definitions
const migrations = {
  // v1 -> v2: selections changed from array to Set
  1: (state) => ({
    ...state,
    selections: {
      points: new Set(state.selections || []),
    },
  }),

  // v2 -> v3: filters restructured
  2: (state) => ({
    ...state,
    filters: {
      numeric: state.filters?.ranges || {},
      categorical: state.filters?.categories || {},
    },
  }),
};

// Example usage
const urlManager = new URLStateManager({
  version: 3,
  migrations,
});
```

## Expected Result

- Selections persist across page reloads
- Shareable URLs capture complete visualization state
- Browser back/forward restores previous states
- Old URLs still work via migration system
- Large selections compressed efficiently

## Hints

1. Use `LZ-String` library for compression of large states
2. Debounce URL updates during rapid selections
3. Validate restored selections against current data
4. Consider URL length limits (~2000 chars safe)

## Testing

```javascript
// Test state roundtrip
const original = {
  selections: ['sample1', 'sample2', 'sample3'],
  filters: { minExpression: 5 },
  zoom: { x: [0, 100], y: [0, 50] },
};

const encoded = urlManager.encodeState(original);
const decoded = urlManager.decodeState(encoded);

assert.deepEqual(original, decoded);

// Test migration
const v1State = { selections: [1, 2, 3] };
const migrated = urlManager.migrate(v1State, 1);
// Should be v3 format with Set
```

## Bonus Challenges

1. Add state diff/patch for efficient history
2. Implement server-side short URLs
3. Add QR code generation for mobile sharing
4. Create state export/import as JSON files
