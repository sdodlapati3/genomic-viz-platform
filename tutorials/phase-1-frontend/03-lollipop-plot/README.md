# Tutorial 1.3: Mutation Lollipop Plot ⭐

> Build ProteinPaint's signature visualization from scratch

## Learning Objectives

By the end of this tutorial, you will be able to:
- [ ] Understand protein structure visualization concepts
- [ ] Map genomic/protein coordinates to screen coordinates
- [ ] Render protein domains with annotations
- [ ] Draw mutation lollipops with frequency-based sizing
- [ ] Implement mutation clustering for overlapping positions
- [ ] Add interactive tooltips with mutation details
- [ ] Color-code mutations by type (missense, nonsense, etc.)

## Prerequisites

- Tutorial 1.1 (SVG & Canvas)
- Tutorial 1.2 (D3.js Core)
- Basic understanding of proteins and mutations

## Biological Background

### What is a Lollipop Plot?

A lollipop plot visualizes mutations along a protein sequence:
- **X-axis**: Amino acid position (1 to protein length)
- **Y-axis**: Mutation frequency or count
- **Lollipop stem**: Connects mutation to protein backbone
- **Lollipop head**: Circle sized by frequency, colored by type
- **Protein domains**: Annotated regions with known functions

### Mutation Types

| Type | Description | Example | Color |
|------|-------------|---------|-------|
| Missense | Amino acid change | R175H | Green |
| Nonsense | Premature stop | R158* | Red |
| Frameshift | Reading frame shift | T126fs | Purple |
| Splice | Affects splicing | splice125 | Orange |
| Silent | No protein change | (rare in viz) | Gray |

## Implementation Steps

### Step 1: Data Structure
```javascript
const mutationData = {
  gene: "TP53",
  proteinLength: 393,
  domains: [
    { name: "DNA-binding", start: 94, end: 292, color: "#4ECDC4" }
  ],
  mutations: [
    { position: 175, aaChange: "R175H", type: "missense", count: 1542 }
  ]
};
```

### Step 2: Scales
```javascript
// X scale: protein position → screen x
const xScale = d3.scaleLinear()
  .domain([1, proteinLength])
  .range([margin.left, width - margin.right]);

// Y scale: mutation count → stem height
const yScale = d3.scaleLinear()
  .domain([0, maxCount])
  .range([domainY, domainY - maxStemHeight]);

// Radius scale: count → circle radius
const radiusScale = d3.scaleSqrt()
  .domain([1, maxCount])
  .range([3, 15]);
```

### Step 3: Render Protein Backbone
```javascript
// Main backbone line
svg.append('rect')
  .attr('class', 'protein-backbone')
  .attr('x', xScale(1))
  .attr('y', domainY)
  .attr('width', xScale(proteinLength) - xScale(1))
  .attr('height', domainHeight)
  .attr('fill', '#ddd');
```

### Step 4: Render Domains
```javascript
svg.selectAll('.domain')
  .data(domains)
  .join('rect')
  .attr('class', 'domain')
  .attr('x', d => xScale(d.start))
  .attr('y', domainY)
  .attr('width', d => xScale(d.end) - xScale(d.start))
  .attr('height', domainHeight)
  .attr('fill', d => d.color);
```

### Step 5: Render Lollipops
```javascript
const lollipops = svg.selectAll('.lollipop')
  .data(mutations)
  .join('g')
  .attr('class', 'lollipop');

// Stems
lollipops.append('line')
  .attr('x1', d => xScale(d.position))
  .attr('y1', domainY)
  .attr('x2', d => xScale(d.position))
  .attr('y2', d => yScale(d.count))
  .attr('stroke', d => colorScale(d.type));

// Heads
lollipops.append('circle')
  .attr('cx', d => xScale(d.position))
  .attr('cy', d => yScale(d.count))
  .attr('r', d => radiusScale(d.count))
  .attr('fill', d => colorScale(d.type));
```

### Step 6: Tooltips
```javascript
lollipops
  .on('mouseenter', (event, d) => {
    tooltip
      .style('display', 'block')
      .html(`
        <strong>${d.aaChange}</strong><br>
        Type: ${d.type}<br>
        Count: ${d.count}
      `)
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);
  })
  .on('mouseleave', () => {
    tooltip.style('display', 'none');
  });
```

## Files

```
03-lollipop-plot/
├── README.md
├── package.json
├── src/
│   ├── index.js              # Main entry
│   ├── LollipopPlot.js       # Main component
│   ├── scales.js             # Scale definitions
│   ├── domains.js            # Domain rendering
│   ├── mutations.js          # Mutation rendering
│   ├── tooltip.js            # Tooltip component
│   ├── clustering.js         # Mutation clustering
│   └── styles.css            # Styling
├── data/
│   └── tp53.json             # Sample TP53 data
├── exercises/
│   ├── exercise-1.md         # Add EGFR gene
│   └── exercise-2.md         # Implement filtering
└── solutions/
    └── ...
```

## Getting Started

```bash
cd tutorials/phase-1-frontend/03-lollipop-plot
npm install
npm run dev
```

## Advanced Features

### Mutation Clustering
When multiple mutations are at the same or adjacent positions, cluster them to avoid overlap:

```javascript
function clusterMutations(mutations, threshold = 5) {
  // Group mutations within threshold distance
  // Return clustered groups with combined counts
}
```

### Zoom to Region
Allow users to zoom into specific protein regions:

```javascript
const zoom = d3.zoom()
  .scaleExtent([1, 10])
  .on('zoom', (event) => {
    const newXScale = event.transform.rescaleX(xScale);
    // Update all elements with newXScale
  });
```

## Sample Output

```
                    ●  ← R175H (1542 samples)
                   /|
                  / |
        ●       /  |     ●
       /|      /   |    /|
      / |     /    |   / |
─────┬──┬────┬─────┬──┬──┬────────────────
     │TAD│PRD│ DNA-binding │TET│REG│
─────┴──┴────┴─────────────┴───┴───┴──────
1    43  92  94           292 323 356  393
```

## Next Steps

After completing this tutorial, proceed to [Tutorial 1.4: Genome Browser Track](../04-genome-browser/).
