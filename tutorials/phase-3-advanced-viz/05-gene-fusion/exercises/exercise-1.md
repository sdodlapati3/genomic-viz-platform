# Exercise 1: Custom Arc Styling

## Objective

Customize the arc diagram to highlight clinical fusions with different colors based on their oncogenic status.

## Background

Not all gene fusions are clinically significant. Some are well-characterized oncogenic drivers with targeted therapies available, while others have uncertain significance. Visual distinction helps researchers prioritize fusion analysis.

## Requirements

### Part 1: Color Scale Implementation

Create a color scale that maps clinical significance to arc colors:

- **Level 1** (FDA-approved therapy): Red (#e74c3c)
- **Level 2A** (Standard care): Orange (#f39c12)
- **Level 2B/3** (Clinical evidence): Yellow (#f1c40f)
- **Unknown/VUS**: Gray (#95a5a6)

### Part 2: Modify ArcDiagram Component

Update the `ArcDiagram.js` component to:

1. Accept a `clinicalColorScale` option
2. Apply colors based on fusion clinical data
3. Add a legend showing the color mapping

### Part 3: Add Visual Indicators

For Level 1 fusions (with targeted therapy):

- Add a thicker stroke
- Show a small drug icon (💊) next to the gene label

## Starter Code

```javascript
// In ArcDiagram.js, add to constructor options:
this.options = {
  // ... existing options
  clinicalColors: {
    level1: '#e74c3c',
    level2a: '#f39c12',
    level2b: '#f1c40f',
    level3: '#95a5a6',
    unknown: '#bdc3c7'
  },
  showClinicalIndicators: true
};

// Add a method to get clinical color:
_getClinicalColor(fusion) {
  const level = fusion.clinical?.level?.toLowerCase();
  // TODO: Return appropriate color based on level
}
```

## Expected Output

- Arc colors should reflect clinical significance
- A legend appears in the corner of the visualization
- Level 1 fusions should be visually prominent

## Hints

1. Use D3's scaleOrdinal for the color mapping
2. The legend can be created with SVG rect and text elements
3. Consider adding a filter toggle to show only clinically significant fusions

## Bonus Challenge

- Add tooltip information showing available therapies
- Implement click-to-filter by clinical level
- Add animation when filtering

## Validation

Your solution should:

1. [ ] Correctly map clinical levels to colors
2. [ ] Display a readable legend
3. [ ] Highlight Level 1 fusions prominently
4. [ ] Maintain interactivity (hover, click)
