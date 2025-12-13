# Tutorial 1.4: Genome Browser Track

> Create a mini genome browser with navigation and track visualization

## Learning Objectives

By the end of this tutorial, you will be able to:
- [ ] Understand genomic coordinate systems
- [ ] Parse and display genomic regions (chr:start-end)
- [ ] Implement pan and zoom navigation
- [ ] Render gene/transcript tracks
- [ ] Handle different track types (genes, variants, quantitative)
- [ ] Create a synchronized multi-track view

## Prerequisites

- Tutorials 1.1-1.3
- Understanding of gene structure (exons, introns, UTRs)

## Genomic Concepts

### Coordinate Systems

| Format | Description | Example |
|--------|-------------|---------|
| 0-based, half-open | BED, BAM | chr1:100-200 (includes 100, excludes 200) |
| 1-based, inclusive | VCF, GFF | chr1:100-200 (includes both 100 and 200) |

### Gene Structure

```
5' UTR    Exon 1    Intron 1    Exon 2    3' UTR
├─────────█████████──────────────████████─────────┤
          CDS start              CDS end
```

## Implementation

### Step 1: Region Parser
```javascript
function parseRegion(regionStr) {
  // "chr17:7668402-7687550" → { chr: "chr17", start: 7668402, end: 7687550 }
  const match = regionStr.match(/^(chr\w+):(\d+)-(\d+)$/);
  if (!match) throw new Error('Invalid region format');
  return {
    chromosome: match[1],
    start: parseInt(match[2]),
    end: parseInt(match[3])
  };
}
```

### Step 2: Coordinate Scale
```javascript
const xScale = d3.scaleLinear()
  .domain([region.start, region.end])
  .range([0, width]);

// Invert for click position → genomic coordinate
const genomicPos = xScale.invert(mouseX);
```

### Step 3: Gene Track Rendering
```javascript
function renderGeneTrack(genes, region, xScale) {
  genes.forEach(gene => {
    // Gene body (thin line for introns)
    svg.append('line')
      .attr('x1', xScale(gene.start))
      .attr('x2', xScale(gene.end))
      .attr('y1', trackCenter)
      .attr('y2', trackCenter)
      .attr('stroke', '#333');
    
    // Exons (thick rectangles)
    gene.exons.forEach(exon => {
      svg.append('rect')
        .attr('x', xScale(exon.start))
        .attr('width', xScale(exon.end) - xScale(exon.start))
        .attr('y', trackCenter - exonHeight/2)
        .attr('height', exonHeight)
        .attr('fill', exon.isCoding ? '#4169E1' : '#87CEEB');
    });
  });
}
```

### Step 4: Navigation Controls
```javascript
// Zoom
function zoomIn() {
  const center = (region.start + region.end) / 2;
  const halfWidth = (region.end - region.start) / 4;
  setRegion({
    ...region,
    start: Math.round(center - halfWidth),
    end: Math.round(center + halfWidth)
  });
}

// Pan
function panLeft() {
  const shift = (region.end - region.start) * 0.25;
  setRegion({
    ...region,
    start: Math.round(region.start - shift),
    end: Math.round(region.end - shift)
  });
}

// Drag to pan
const drag = d3.drag()
  .on('drag', (event) => {
    const genomicShift = xScale.invert(0) - xScale.invert(event.dx);
    // Update region
  });
```

### Step 5: Ruler/Axis
```javascript
function renderRuler(xScale) {
  const axis = d3.axisTop(xScale)
    .ticks(10)
    .tickFormat(d => {
      if (d >= 1e6) return `${d/1e6}Mb`;
      if (d >= 1e3) return `${d/1e3}kb`;
      return d;
    });
  
  svg.append('g')
    .attr('class', 'ruler')
    .call(axis);
}
```

## Files

```
04-genome-browser/
├── README.md
├── package.json
├── src/
│   ├── index.js              # Main entry
│   ├── GenomeBrowser.js      # Main component
│   ├── RegionInput.js        # Region input/parsing
│   ├── NavigationControls.js # Zoom/pan buttons
│   ├── Ruler.js              # Coordinate axis
│   ├── GeneTrack.js          # Gene visualization
│   ├── VariantTrack.js       # Variant markers
│   └── styles.css
├── data/
│   ├── genes.json            # Gene annotations
│   └── variants.json         # Variant data
└── exercises/
    └── ...
```

## Getting Started

```bash
cd tutorials/phase-1-frontend/04-genome-browser
npm install
npm run dev
```

## Track Types

| Track Type | Visual Representation |
|------------|----------------------|
| Gene | Exon rectangles connected by lines |
| Variant | Vertical ticks or lollipops |
| Quantitative | Line chart or heatmap |
| Region | Colored rectangles |
| Read alignment | Stacked rectangles (BAM viz) |

## Sample Output

```
                    chr17:7,668,402-7,687,550
   ◀ ◀◀  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ▶▶ ▶   [- +]
   ├──────┼──────┼──────┼──────┼──────┼──────┤
   7.67Mb        7.675Mb       7.68Mb       7.685Mb

   TP53 ──────████──██████████──████████────────► 
              E1      E2-E9        E10-E11   
   
   Variants: ▼    ▼▼   ▼   ▼▼▼    ▼    ▼
```

## Next Steps

Congratulations! You've completed Phase 1. Proceed to [Phase 2: Backend & Data Processing](../../phase-2-backend/).
