# Tutorial 1.2: D3.js Core Concepts

> Master data-driven visualization with the D3.js library

## Learning Objectives

By the end of this tutorial, you will be able to:
- [ ] Use D3 selections to manipulate DOM elements
- [ ] Bind data to elements using the data join pattern
- [ ] Create scales for mapping data to visual properties
- [ ] Build and customize axes
- [ ] Implement enter/update/exit pattern for dynamic data
- [ ] Create smooth transitions and animations

## Prerequisites

- Tutorial 1.1 (SVG & Canvas Fundamentals)
- JavaScript ES6+ (arrow functions, array methods)

## Concepts Covered

### 1. Selections
```javascript
d3.select('#chart')        // Select single element
d3.selectAll('.bar')       // Select all matching elements
selection.append('rect')   // Add child element
selection.attr('x', 10)    // Set attribute
selection.style('fill', 'blue')  // Set CSS style
```

### 2. Data Binding
```javascript
const data = [10, 20, 30, 40];

// Modern join pattern
svg.selectAll('rect')
  .data(data)
  .join('rect')
  .attr('height', d => d);

// Traditional enter/update/exit
const bars = svg.selectAll('rect').data(data);
bars.enter().append('rect');   // New elements
bars.attr('height', d => d);   // Update existing
bars.exit().remove();          // Remove old
```

### 3. Scales
```javascript
// Linear scale (numbers → numbers)
const xScale = d3.scaleLinear()
  .domain([0, 100])      // Data range
  .range([0, 500]);      // Pixel range

// Band scale (categories → positions)
const xBand = d3.scaleBand()
  .domain(['A', 'B', 'C'])
  .range([0, 500])
  .padding(0.1);

// Color scales
const color = d3.scaleOrdinal(d3.schemeCategory10);
const sequential = d3.scaleSequential(d3.interpolateBlues);
```

### 4. Axes
```javascript
const xAxis = d3.axisBottom(xScale)
  .ticks(5)
  .tickFormat(d3.format('.1f'));

svg.append('g')
  .attr('transform', `translate(0, ${height})`)
  .call(xAxis);
```

### 5. Transitions
```javascript
selection
  .transition()
  .duration(750)
  .ease(d3.easeCubicInOut)
  .attr('height', d => yScale(d));
```

## Files

```
02-d3-core/
├── README.md
├── package.json
├── src/
│   ├── 01-selections.js       # DOM manipulation
│   ├── 02-data-binding.js     # Data join pattern
│   ├── 03-scales.js           # All scale types
│   ├── 04-axes.js             # Axis creation
│   ├── 05-transitions.js      # Animations
│   └── 06-bar-chart.js        # Complete example
├── exercises/
│   └── ...
└── solutions/
    └── ...
```

## Getting Started

```bash
cd tutorials/phase-1-frontend/02-d3-core
npm install
npm run dev
```

## Key D3 Modules

| Module | Purpose |
|--------|---------|
| d3-selection | DOM manipulation |
| d3-scale | Data → Visual mapping |
| d3-axis | Axis generators |
| d3-shape | Line, area, arc generators |
| d3-transition | Animations |
| d3-format | Number formatting |
| d3-time-format | Date formatting |

## Next Steps

After completing this tutorial, proceed to [Tutorial 1.3: Mutation Lollipop Plot](../03-lollipop-plot/).
