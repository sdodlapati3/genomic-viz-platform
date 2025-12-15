# Exercise 2: Multi-Caller Fusion Validation

## Objective

Build a visualization component that compares fusion calls across multiple detection tools and highlights concordance.

## Background

Gene fusion detection is prone to false positives. Running multiple callers (STAR-Fusion, Arriba, FusionCatcher) and comparing results increases confidence. Fusions called by 3+ tools are typically high confidence.

## Requirements

### Part 1: Venn Diagram Component

Create a `CallerVenn.js` component that:

1. Shows overlap between 2-3 fusion callers
2. Displays fusion counts in each region
3. Allows clicking a region to filter the main view

### Part 2: Concordance Score

Implement a concordance scoring system:

```javascript
function calculateConcordance(fusion) {
  const callers = fusion.callers || [];
  return {
    count: callers.length,
    score: callers.length >= 3 ? 'high' : callers.length === 2 ? 'medium' : 'low',
    callers: callers,
  };
}
```

### Part 3: Visual Integration

Add concordance indicators to the ArcDiagram:

- Single caller: Dashed arc
- Two callers: Solid arc
- Three+ callers: Thick solid arc with glow effect

## Starter Code

```javascript
// CallerVenn.js
export class CallerVenn {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: 300,
      height: 200,
      callers: ['STAR-Fusion', 'Arriba', 'FusionCatcher'],
      ...options,
    };

    this._init();
  }

  _init() {
    // Create SVG and circle groups
  }

  setData(fusions) {
    // Calculate overlaps
    const sets = this._calculateSets(fusions);
    this._render(sets);
  }

  _calculateSets(fusions) {
    // TODO: Calculate Venn diagram regions
    // Return object with counts for each region
  }

  _render(sets) {
    // TODO: Draw three overlapping circles
    // Add counts as text in each region
  }
}
```

## Data Structure

Input fusions have a `callers` array:

```javascript
{
  gene5: { name: 'BCR' },
  gene3: { name: 'ABL1' },
  callers: ['STAR-Fusion', 'Arriba', 'FusionCatcher'],
  // ...
}
```

## Expected Output

1. A Venn diagram showing caller overlap
2. Click interactions to filter fusions
3. Arc styling reflecting caller concordance

## Hints

1. For 3-circle Venn diagrams, position circles at 120° angles
2. Use set operations (intersection, difference) to calculate regions
3. D3 selections can be used to draw the circles and text

## Mathematical Formulas

For positioning 3 circles:

```javascript
const cx = (i) => centerX + radius * Math.cos((i * 2 * Math.PI) / 3 - Math.PI / 2);
const cy = (i) => centerY + radius * Math.sin((i * 2 * Math.PI) / 3 - Math.PI / 2);
```

## Bonus Challenge

- Add animated transitions when filtering
- Show fusion names on hover over each region
- Export the Venn diagram as SVG

## Validation

Your solution should:

1. [ ] Correctly calculate set intersections
2. [ ] Display accurate counts in each region
3. [ ] Support click-to-filter interaction
4. [ ] Update arc styling based on concordance
