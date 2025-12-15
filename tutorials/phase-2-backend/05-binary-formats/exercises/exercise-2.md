# Exercise 2: Build a Coverage Track Visualization

## Objective

Create a complete workflow from BAM/BigWig data to a D3.js coverage track visualization.

## Background

Coverage tracks show how many reads (or signal intensity) cover each position in the genome. They're essential for:

- Quality control (checking sequencing depth)
- Visualizing ChIP-seq peaks
- Identifying copy number variations

## Tasks

### Task 1: Fetch and Process Coverage Data

Create an API endpoint that returns visualization-ready coverage data.

**Requirements:**

- Accept chromosome, start, end, and numBins parameters
- Return binned coverage with appropriate scale
- Handle both BAM and BigWig sources

```javascript
// API endpoint
app.get('/api/coverage/:source/:chr/:start/:end', async (req, res) => {
  const { source, chr, start, end } = req.params;
  const numBins = parseInt(req.query.bins) || 500;

  // Your code here:
  // 1. Select parser based on source (bam/bigwig)
  // 2. Fetch coverage data
  // 3. Bin to requested resolution
  // 4. Return with min/max for scale
});
```

### Task 2: Create D3.js Coverage Track

Build a reusable coverage track component.

**Requirements:**

- Area chart showing coverage
- Responsive width
- Y-axis with coverage values
- X-axis with genomic coordinates
- Hover tooltips showing exact values

```javascript
// D3 component structure
function CoverageTrack(container, options = {}) {
  const {
    width = 800,
    height = 100,
    margin = { top: 10, right: 30, bottom: 30, left: 50 },
  } = options;

  // Your code here:
  // 1. Create SVG container
  // 2. Set up scales
  // 3. Create area generator
  // 4. Add axes
  // 5. Implement update() method

  return {
    update: (data) => {
      /* update visualization */
    },
    setRegion: (chr, start, end) => {
      /* fetch and display */
    },
  };
}
```

### Task 3: Add Interactive Features

Enhance the track with interactivity.

**Requirements:**

- Brush for region selection
- Zoom on brush (drill down)
- Click to show read details (for BAM)
- Export view as PNG

## Expected Result

A working coverage track that:

1. Fetches data from the API
2. Displays smooth coverage curve
3. Updates on region change
4. Supports zoom/pan

```
┌─────────────────────────────────────────────────────────────┐
│ chr17:7,668,402-7,687,550                    Coverage Track │
├─────────────────────────────────────────────────────────────┤
│ 120 ┤                                                       │
│     │        ▄▄▄▄▄▄                                         │
│  80 ┤    ▄▄▄█████████▄▄                                    │
│     │  ▄█████████████████▄▄▄                               │
│  40 ┤▄████████████████████████▄▄▄▄▄▄                       │
│     │██████████████████████████████████▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄   │
│   0 ┼───────────────────────────────────────────────────────│
│     7.66M          7.67M          7.68M          7.69M      │
└─────────────────────────────────────────────────────────────┘
```

## Hints

1. Use `d3.area()` for the coverage shape
2. `d3.scaleLinear()` for both axes
3. `d3.axisBottom()` and `d3.axisLeft()` for axes
4. `d3.brushX()` for region selection
5. Consider using Canvas for large datasets (>10k points)

## Files to Create

```
src/
├── routes/
│   └── coverage.js     # API route
└── client/
    ├── coverage-track.js  # D3 component
    └── coverage-demo.html # Demo page
```

## API Response Format

```json
{
  "success": true,
  "region": {
    "chromosome": "chr17",
    "start": 7668402,
    "end": 7687550
  },
  "coverage": {
    "bins": [
      {"pos": 7668402, "value": 45},
      {"pos": 7668440, "value": 52},
      ...
    ],
    "stats": {
      "min": 12,
      "max": 120,
      "mean": 67.5
    }
  }
}
```

## Bonus Challenges

1. **Multi-track view**: Stack multiple coverage tracks (e.g., tumor vs normal)
2. **Log scale option**: Support log scale for high-dynamic-range data
3. **Color by value**: Color coverage by threshold (red for low coverage regions)
4. **Streaming updates**: Use SSE to progressively render large regions

## Solution

See `solutions/exercise-2-solution/` for complete solution including HTML demo.
