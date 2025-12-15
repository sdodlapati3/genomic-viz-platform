[← Back to Tutorials Index](../../README.md)

---

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

| Type       | Description         | Example       | Color  |
| ---------- | ------------------- | ------------- | ------ |
| Missense   | Amino acid change   | R175H         | Green  |
| Nonsense   | Premature stop      | R158\*        | Red    |
| Frameshift | Reading frame shift | T126fs        | Purple |
| Splice     | Affects splicing    | splice125     | Orange |
| Silent     | No protein change   | (rare in viz) | Gray   |

## Implementation Steps

### Step 1: Data Structure

```javascript
const mutationData = {
  gene: 'TP53',
  proteinLength: 393,
  domains: [{ name: 'DNA-binding', start: 94, end: 292, color: '#4ECDC4' }],
  mutations: [{ position: 175, aaChange: 'R175H', type: 'missense', count: 1542 }],
};
```

### Step 2: Scales

```javascript
// X scale: protein position → screen x
const xScale = d3
  .scaleLinear()
  .domain([1, proteinLength])
  .range([margin.left, width - margin.right]);

// Y scale: mutation count → stem height
const yScale = d3
  .scaleLinear()
  .domain([0, maxCount])
  .range([domainY, domainY - maxStemHeight]);

// Radius scale: count → circle radius
const radiusScale = d3.scaleSqrt().domain([1, maxCount]).range([3, 15]);
```

### Step 3: Render Protein Backbone

```javascript
// Main backbone line
svg
  .append('rect')
  .attr('class', 'protein-backbone')
  .attr('x', xScale(1))
  .attr('y', domainY)
  .attr('width', xScale(proteinLength) - xScale(1))
  .attr('height', domainHeight)
  .attr('fill', '#ddd');
```

### Step 4: Render Domains

```javascript
svg
  .selectAll('.domain')
  .data(domains)
  .join('rect')
  .attr('class', 'domain')
  .attr('x', (d) => xScale(d.start))
  .attr('y', domainY)
  .attr('width', (d) => xScale(d.end) - xScale(d.start))
  .attr('height', domainHeight)
  .attr('fill', (d) => d.color);
```

### Step 5: Render Lollipops

```javascript
const lollipops = svg.selectAll('.lollipop').data(mutations).join('g').attr('class', 'lollipop');

// Stems
lollipops
  .append('line')
  .attr('x1', (d) => xScale(d.position))
  .attr('y1', domainY)
  .attr('x2', (d) => xScale(d.position))
  .attr('y2', (d) => yScale(d.count))
  .attr('stroke', (d) => colorScale(d.type));

// Heads
lollipops
  .append('circle')
  .attr('cx', (d) => xScale(d.position))
  .attr('cy', (d) => yScale(d.count))
  .attr('r', (d) => radiusScale(d.count))
  .attr('fill', (d) => colorScale(d.type));
```

### Step 6: Tooltips

```javascript
lollipops
  .on('mouseenter', (event, d) => {
    tooltip
      .style('display', 'block')
      .html(
        `
        <strong>${d.aaChange}</strong><br>
        Type: ${d.type}<br>
        Count: ${d.count}
      `
      )
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
const zoom = d3
  .zoom()
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

## 🎯 ProteinPaint Connection

This tutorial directly maps to ProteinPaint's core visualization:

| Tutorial Concept             | ProteinPaint Equivalent     |
| ---------------------------- | --------------------------- |
| `xScale` (position → pixels) | `block.genomic2screen()`    |
| Domain rectangles            | `mds3/skewer/domains.ts`    |
| Lollipop stems/heads         | `mds3/skewer/skewer.ts`     |
| Mutation clustering          | `mds3/skewer/clustering.ts` |
| Color by type                | `shared/mclass.ts`          |
| Tooltips                     | `mds3/tip.ts`               |

### Key Patterns Used in ProteinPaint

1. **Data-driven rendering**: Config object → D3 binds → SVG elements
2. **Scale encapsulation**: Scales live in a reusable module
3. **Event delegation**: Parent group handles all child events
4. **State management**: Track zoom/pan state for reproducibility

## Code Walkthrough

### File: `src/01-basics.js` - Foundation

- Creates SVG container with margins
- Draws protein backbone rectangle
- Basic coordinate system

### File: `src/02-domains.js` - Domain Rendering

- `renderDomains(svg, domains, xScale)` - Main render function
- Uses `.join()` for enter/update/exit
- Adds domain labels centered in each rectangle

### File: `src/03-mutations.js` - Lollipop Rendering ⭐

- `renderMutations(svg, mutations, xScale, yScale)` - Core visualization
- Creates `<g>` groups for each lollipop
- Line for stem, circle for head
- Color scale maps mutation type → color

### File: `src/04-interactive.js` - Interactivity

- Tooltip positioning on hover
- Click to select/deselect mutations
- Brush for region selection

### File: `src/05-complete.js` - Full Implementation

- Combines all modules
- Adds zoom/pan behavior
- Export functionality

## Common Issues & Solutions

| Issue                    | Solution                           |
| ------------------------ | ---------------------------------- |
| Lollipops overlapping    | Implement clustering or jitter     |
| Domain labels cut off    | Check text-anchor and truncate     |
| Slow with many mutations | Use Canvas for >500 points         |
| Colors not visible       | Check color-blind friendly palette |

## Next Steps

After completing this tutorial, proceed to [Tutorial 1.4: Genome Browser Track](../04-genome-browser/README.md).

---

## 🎯 Interview Preparation Q&A

### Q1: Why is the lollipop plot the signature visualization for mutation data?

**Answer:** Lollipop plots effectively communicate three dimensions simultaneously:

1. **X-axis (position):** Where mutation occurs on protein
2. **Y-axis (stem height):** Frequency/recurrence across samples
3. **Circle properties:** Mutation type (color), sample count (size)

**Advantages over alternatives:**

- Shows hotspots clearly (tall stems cluster at recurrent positions)
- Protein domain context visible on backbone
- Handles overlapping positions via clustering
- Intuitive: taller = more significant finding

**Clinical relevance:** Pathogenic mutations like TP53 R175H, R248Q cluster in DNA-binding domain, visible immediately in lollipop plot.

---

### Q2: How would you handle overlapping mutations at the same or adjacent positions?

**Answer:** Several strategies:

1. **Clustering:** Group mutations within threshold distance

```javascript
function clusterMutations(mutations, threshold = 5) {
  // Combine mutations within 5 amino acids
  return clustered.map((group) => ({
    position: d3.mean(group, (d) => d.position),
    count: d3.sum(group, (d) => d.count),
    mutations: group,
  }));
}
```

2. **Jittering:** Offset overlapping circles horizontally
3. **Stacking:** Stack circles vertically at same position
4. **Force simulation:** D3 force layout to prevent overlap
5. **Aggregation:** Single larger circle representing multiple

**ProteinPaint approach:** Intelligent clustering with expandable groups - click to see individual mutations.

---

### Q3: Explain how you'd implement zoom and pan on a lollipop plot.

**Answer:**

```javascript
const zoom = d3
  .zoom()
  .scaleExtent([1, 20]) // 1x to 20x zoom
  .on('zoom', (event) => {
    // Update x-scale domain based on transform
    const newXScale = event.transform.rescaleX(xScale);

    // Re-render with new scale
    renderDomains(newXScale);
    renderLollipops(newXScale);
    updateAxis(newXScale);
  });

svg.call(zoom);

// Programmatic zoom to region
function zoomToRegion(start, end) {
  const [[x0, x1]] = [xScale(start), xScale(end)];
  svg.transition().call(zoom.transform, d3.zoomIdentity.scale(width / (x1 - x0)).translate(-x0, 0));
}
```

**Key considerations:**

- Maintain minimum visible domain (don't zoom past single amino acid)
- Update axis tick format based on zoom level
- Debounce render updates for performance

---

### Q4: What color scheme would you use for mutation consequence types?

**Answer:** Use established conventions for clinical interpretation:

| Consequence    | Color      | Rationale                                     |
| -------------- | ---------- | --------------------------------------------- |
| Missense       | Green/Teal | Common, variable pathogenicity                |
| Nonsense       | Red        | Typically pathogenic (stop codon)             |
| Frameshift     | Purple     | Usually pathogenic (reading frame disruption) |
| Splice         | Orange     | Affects splicing, often pathogenic            |
| Silent         | Gray       | Usually benign                                |
| In-frame indel | Blue       | Variable pathogenicity                        |

**Best practices:**

- Use colorblind-safe palette (avoid red-green only distinction)
- Match ClinVar/COSMIC conventions when possible
- Provide legend with clear labels
- Allow filtering by consequence type

---

### Q5: How does ProteinPaint handle the relationship between genomic and protein coordinates?

**Answer:** ProteinPaint manages coordinate transformation:

1. **Genomic coordinates:** chr17:7668402-7687550 (VCF positions)
2. **Transcript coordinates:** Position within mRNA
3. **Protein coordinates:** Amino acid position (1-393 for TP53)

**Transformation pipeline:**

```
Genomic position
    ↓ (Transcript mapping via gene model)
Exon/intron annotation
    ↓ (CDS extraction)
Coding position (codon)
    ↓ (÷3, handle phase)
Amino acid position
    ↓ (Scale mapping)
Screen X coordinate
```

**Key challenges:**

- Multiple transcripts per gene (canonical selection)
- Splice variants affecting protein length
- UTRs vs coding regions
- Reverse strand genes (TP53 is minus strand)

**ProteinPaint solution:** `block.exonsf` scale handles genomic↔screen mapping, with protein coordinates layered on top.

---

[← Back to Tutorials Index](../../README.md)
