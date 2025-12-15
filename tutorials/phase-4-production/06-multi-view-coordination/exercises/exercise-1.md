# Exercise 1: Build Filter Coordination

## Overview

Extend the multi-view coordination system to support advanced filter coordination, including:

- Numeric range filters with histograms
- Categorical filters with search
- Filter presets (save/load)
- Cross-filter highlighting

## Learning Objectives

- Understand filter state propagation
- Implement filter histograms showing data distribution
- Create filter presets system
- Handle complex filter combinations

## Task

### Part 1: Filter Histogram

Add histograms to the range filters to show data distribution:

```javascript
// In FilterPanel.js - Add histogram to range filter
_createRangeFilterWithHistogram(parent, config) {
  const { label, id, data, accessor, range, bins = 20 } = config;

  // Calculate histogram data
  const histogram = d3.histogram()
    .domain(range)
    .thresholds(bins);

  const histData = histogram(data.map(accessor));

  // Create mini histogram SVG
  const width = 200;
  const height = 40;

  const x = d3.scaleLinear()
    .domain(range)
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(histData, d => d.length)])
    .range([height, 0]);

  // TODO: Render histogram bars
  // TODO: Update bar highlighting based on filter range
  // TODO: Add brush for filter interaction
}
```

### Part 2: Filter Presets

Implement save/load for filter configurations:

```javascript
// Filter preset manager
class FilterPresets {
  constructor() {
    this.presets = this._loadFromStorage();
  }

  save(name, filters) {
    // TODO: Save current filter state with name
    // Store in localStorage
  }

  load(name) {
    // TODO: Load and apply saved preset
    // Emit filter change events
  }

  delete(name) {
    // TODO: Remove saved preset
  }

  list() {
    // TODO: Return all saved presets
  }
}
```

### Part 3: Cross-Filter Highlighting

Implement cross-filter highlights to show how filters affect other dimensions:

```javascript
// Show filtered vs unfiltered distributions
function updateCrossFilterHighlights(activeFilters) {
  // For each filter dimension:
  // 1. Calculate distribution with current filters
  // 2. Calculate distribution without this specific filter
  // 3. Show overlay comparing the two

  // Example: Expression filter histogram
  const filteredData = applyAllFilters(data, activeFilters);
  const withoutExpFilter = applyAllFilters(data, {
    ...activeFilters,
    minExpression: undefined,
    maxExpression: undefined,
  });

  // Render both distributions with different opacity
}
```

### Part 4: Filter Pills/Tags

Create visual filter pills that show active filters and allow quick removal:

```javascript
// Filter pill component
function createFilterPills(container, activeFilters) {
  const pills = [];

  Object.entries(activeFilters).forEach(([key, value]) => {
    if (isActiveFilter(key, value)) {
      pills.push({
        label: formatFilterLabel(key, value),
        onRemove: () => clearFilter(key),
      });
    }
  });

  // TODO: Render pills with remove buttons
  // TODO: Add "Clear All" button when multiple filters active
}
```

## Expected Result

- Range filters show data distribution histogram
- Histogram updates as other filters change
- Filter presets can be saved with names
- Presets appear in dropdown for quick access
- Active filters shown as removable pills
- "Clear All" quickly resets to defaults

## Hints

1. Use D3's `histogram()` generator for binning
2. Store presets in localStorage with JSON serialization
3. Debounce histogram updates during rapid filter changes
4. Use CSS transitions for smooth histogram updates

## Testing

```javascript
// Test preset save/load
presets.save('High Expression', {
  minExpression: 8,
  maxExpression: 12,
  geneType: 'oncogene',
});

presets.load('High Expression');
// Should update all views with saved filters

// Test cross-filter
filters.set({ minExpression: 5 });
// Histogram for VAF should show how data changes
```

## Bonus Challenges

1. Add undo/redo for filter changes
2. Implement filter groups (AND/OR logic)
3. Add filter statistics (N items passing)
4. Create filter export/import for sharing
