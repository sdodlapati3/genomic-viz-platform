[← Back to Tutorials Index](../../README.md)

---

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

| Format             | Description | Example                                   |
| ------------------ | ----------- | ----------------------------------------- |
| 0-based, half-open | BED, BAM    | chr1:100-200 (includes 100, excludes 200) |
| 1-based, inclusive | VCF, GFF    | chr1:100-200 (includes both 100 and 200)  |

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
    end: parseInt(match[3]),
  };
}
```

### Step 2: Coordinate Scale

```javascript
const xScale = d3.scaleLinear().domain([region.start, region.end]).range([0, width]);

// Invert for click position → genomic coordinate
const genomicPos = xScale.invert(mouseX);
```

### Step 3: Gene Track Rendering

```javascript
function renderGeneTrack(genes, region, xScale) {
  genes.forEach((gene) => {
    // Gene body (thin line for introns)
    svg
      .append('line')
      .attr('x1', xScale(gene.start))
      .attr('x2', xScale(gene.end))
      .attr('y1', trackCenter)
      .attr('y2', trackCenter)
      .attr('stroke', '#333');

    // Exons (thick rectangles)
    gene.exons.forEach((exon) => {
      svg
        .append('rect')
        .attr('x', xScale(exon.start))
        .attr('width', xScale(exon.end) - xScale(exon.start))
        .attr('y', trackCenter - exonHeight / 2)
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
    end: Math.round(center + halfWidth),
  });
}

// Pan
function panLeft() {
  const shift = (region.end - region.start) * 0.25;
  setRegion({
    ...region,
    start: Math.round(region.start - shift),
    end: Math.round(region.end - shift),
  });
}

// Drag to pan
const drag = d3.drag().on('drag', (event) => {
  const genomicShift = xScale.invert(0) - xScale.invert(event.dx);
  // Update region
});
```

### Step 5: Ruler/Axis

```javascript
function renderRuler(xScale) {
  const axis = d3
    .axisTop(xScale)
    .ticks(10)
    .tickFormat((d) => {
      if (d >= 1e6) return `${d / 1e6}Mb`;
      if (d >= 1e3) return `${d / 1e3}kb`;
      return d;
    });

  svg.append('g').attr('class', 'ruler').call(axis);
}
```

## Files

```
04-genome-browser/
├── README.md
├── package.json
├── index.html
├── src/
│   ├── main.js               # Entry point, tab navigation
│   ├── 01-coordinates.js     # Region parsing, scales, ruler
│   ├── 02-tracks.js          # Gene track rendering
│   ├── 03-navigation.js      # Pan/zoom controls
│   ├── 04-features.js        # Additional track features
│   ├── 05-complete.js        # Full genome browser
│   └── styles.css            # Styling
└── exercises/
    └── ...
```

## Code Walkthrough

### File: `src/01-coordinates.js` - Region Parsing & Scales

This module handles genomic coordinate parsing and scale creation:

```javascript
// Parse region string: "chr17:7668402-7687550"
export function parseRegion(regionStr) {
  const match = regionStr.match(/^(chr\w+):(\d+)-(\d+)$/i);
  return { chromosome, start, end, length };
}

// Format positions: 7668402 → "7.67Mb"
export function formatPosition(pos) {
  if (pos >= 1e6) return `${(pos / 1e6).toFixed(2)}Mb`;
  // ...
}

// Create D3 scale mapping genomic → screen coordinates
export function createCoordinateScale(region, width) {
  return d3.scaleLinear().domain([region.start, region.end]).range([0, width]);
}
```

**Key Concepts:**

- Region string validation with regex
- Coordinate systems (0-based vs 1-based)
- Scale inversion for click-to-position

### File: `src/02-tracks.js` - Gene Track Rendering ⭐

Renders gene structures with exons, introns, and strand direction:

```javascript
function renderGene(g, gene, xScale, y) {
  // Intron line (thin backbone)
  g.append('line').attr('x1', xScale(gene.start))...

  // Exons (rectangles)
  gene.exons.forEach((exon) => {
    const height = exon.type === 'coding' ? 20 : 12;
    g.append('rect')
      .attr('class', `exon ${exon.type}`)
      .attr('x', xScale(exon.start))
      .attr('width', xScale(exon.end) - xScale(exon.start))...
  });

  // Strand arrow
  g.append('text').text(gene.strand === '+' ? '►' : '◄');
}
```

**Key Concepts:**

- UTR vs CDS exon heights
- Gene strand direction arrows
- Tooltip on hover

### File: `src/03-navigation.js` - Pan/Zoom Controls

Implements navigation controls for genome browsing:

```javascript
// Zoom: shrink the region window
function zoomIn(region) {
  const center = (region.start + region.end) / 2;
  const halfWidth = (region.end - region.start) / 4;
  return { start: center - halfWidth, end: center + halfWidth };
}

// Pan: shift the region window
function panLeft(region) {
  const shift = (region.end - region.start) * 0.25;
  return { start: region.start - shift, end: region.end - shift };
}

// D3 drag behavior for mouse panning
const drag = d3.drag().on('drag', (event) => {
  const shift = xScale.invert(0) - xScale.invert(event.dx);
  updateRegion(shift);
});
```

**Key Concepts:**

- Zoom factor calculations
- Drag-to-pan implementation
- D3 zoom behavior integration

### File: `src/04-features.js` - Track Features

Adds variant tracks and additional features:

- Variant markers (lollipops or ticks)
- Coverage tracks (quantitative data)
- Multi-track synchronization

### File: `src/05-complete.js` - Full Genome Browser ⭐

Production-ready browser with all features combined:

```javascript
// Gene data for multiple regions (TP53, KRAS, EGFR)
const geneData = {
  'chr17:7668402-7687550': { name: 'TP53', exons: [...], variants: [...] },
  'chr12:25205246-25250936': { name: 'KRAS', ... },
  'chr7:55019017-55211628': { name: 'EGFR', ... }
};

// Full browser with region input, navigation, gene track, variant track
function renderBrowser(regionStr) {
  const region = parseRegion(regionStr);
  const xScale = createCoordinateScale(region, width);

  renderRuler(svg, xScale);
  renderGeneTrack(svg, geneData[regionStr], xScale);
  renderVariantTrack(svg, geneData[regionStr].variants, xScale);
}
```

**Key Features:**

- Region dropdown for gene selection
- Navigation controls (zoom in/out, pan left/right)
- Gene track with exon visualization
- Variant track with mutation markers
- Coordinated tooltips

## Getting Started

```bash
cd tutorials/phase-1-frontend/04-genome-browser
npm install
npm run dev
```

## Track Types

| Track Type     | Visual Representation              |
| -------------- | ---------------------------------- |
| Gene           | Exon rectangles connected by lines |
| Variant        | Vertical ticks or lollipops        |
| Quantitative   | Line chart or heatmap              |
| Region         | Colored rectangles                 |
| Read alignment | Stacked rectangles (BAM viz)       |

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

## 🎯 ProteinPaint Connection

This tutorial directly implements patterns used in ProteinPaint's genome browser:

| Tutorial Concept            | ProteinPaint Equivalent                    |
| --------------------------- | ------------------------------------------ |
| Region parsing              | `client/src/coord.ts` - coordinate parsing |
| `xScale` (genomic → screen) | `block.exonsf` - the core scale            |
| Gene track rendering        | `client/src/block.tk.gene.ts`              |
| Exon/intron visualization   | `client/src/block.tk.gene.render.ts`       |
| Variant track               | `client/src/block.tk.vcf.ts`               |
| Pan/zoom navigation         | `client/src/block.pan.ts`, `block.zoom.ts` |
| Ruler/axis                  | `client/src/block.ruler.ts`                |

### Key ProteinPaint Architecture

```
┌─────────────────────────────────────────┐
│  Block (Main Container)                 │
│  ├── Ruler (coordinate axis)            │
│  ├── Track: Gene                        │
│  │   ├── Exons (filled rectangles)      │
│  │   ├── Introns (lines)                │
│  │   └── Labels                         │
│  ├── Track: VCF (variants)              │
│  ├── Track: BigWig (coverage)           │
│  └── Navigation controls                │
└─────────────────────────────────────────┘
```

### The Block Pattern

ProteinPaint's `block` is a genome browser instance:

```javascript
// ProteinPaint pattern
const block = {
  startidx: 0, // Start position
  stopidx: 19118, // End position
  exonsf: d3
    .scaleLinear() // The scale!
    .domain([start, stop])
    .range([0, width]),

  // Convert genomic → screen
  genomic2screen(pos) {
    return this.exonsf(pos);
  },
};
```

## Exercises

### Exercise 1: Add a Custom Track Type

Create a new "highlight region" track:

**Requirements:**

- Accept an array of regions: `[{ start, end, color, label }]`
- Render colored rectangles spanning each region
- Add labels centered in each region
- Handle regions that extend beyond view

### Exercise 2: Implement Smooth Zooming

Add animated zoom transitions:

**Requirements:**

- Zoom should animate over 300ms
- Scale should interpolate smoothly
- Track content should transition with zoom
- Use `d3.transition()` for animation

**Hint:**

```javascript
const t = d3.transition().duration(300);
xScale.domain([newStart, newEnd]);
svg
  .selectAll('.gene')
  .transition(t)
  .attr('x', (d) => xScale(d.start));
```

### Exercise 3: Multi-Gene Browser

Extend to show multiple genes in the same view:

**Requirements:**

- Load genes overlapping current region
- Stack overlapping genes on different rows
- Add gene name labels
- Color-code by strand (+ = blue, - = red)

### Exercise 4: Coordinate Bookmarks

Add bookmark functionality:

**Requirements:**

- "Save bookmark" button stores current region
- Dropdown shows saved bookmarks
- Click bookmark to navigate
- Store in localStorage

## Next Steps

Congratulations! You've completed Phase 1. Proceed to [Phase 2: Backend & Data Processing](../../phase-2-backend/README.md).

---

## 🎯 Interview Preparation Q&A

### Q1: Explain the difference between 0-based and 1-based genomic coordinate systems.

**Answer:**
| System | Format | Files | Example chr1:100-200 |
|--------|--------|-------|---------------------|
| **0-based, half-open** | [start, end) | BED, BAM | Includes positions 100-199 |
| **1-based, inclusive** | [start, end] | VCF, GFF | Includes positions 100-200 |

**Why it matters:**

- Off-by-one errors are common source of bugs
- Must convert when combining data from different sources
- ProteinPaint internally uses 0-based coordinates

**Conversion:**

```javascript
// 1-based to 0-based
const zeroBased = { start: oneBased.start - 1, end: oneBased.end };

// 0-based to 1-based
const oneBased = { start: zeroBased.start + 1, end: zeroBased.end };
```

---

### Q2: How would you implement efficient region-based queries for a genome browser?

**Answer:** Multiple strategies depending on scale:

1. **Binary search with sorted data:**

```javascript
function getGenesInRegion(genes, start, end) {
  // genes sorted by start position
  const startIdx = binarySearchLeft(genes, start);
  const endIdx = binarySearchRight(genes, end);
  return genes.slice(startIdx, endIdx).filter((g) => g.end > start && g.start < end);
}
```

2. **Interval tree (R-tree):**

- O(log n + k) query time for k results
- Best for overlapping intervals (genes, features)

3. **Tabix indexing:**

- For file-based access (VCF, BED)
- Chromosome + position index
- Used by ProteinPaint for large datasets

4. **Binning schemes:**

- UCSC hierarchical binning
- Pre-compute bins for fast lookup

---

### Q3: Describe how you would render gene structures (exons, introns, UTRs).

**Answer:**

```javascript
function renderGene(gene, xScale, y) {
  const g = svg.append('g').attr('class', 'gene');

  // 1. Gene body line (thin, represents introns)
  g.append('line')
    .attr('x1', xScale(gene.start))
    .attr('x2', xScale(gene.end))
    .attr('y1', y)
    .attr('y2', y)
    .attr('stroke', '#333');

  // 2. Exons (rectangles)
  gene.exons.forEach((exon) => {
    const height = exon.isCoding ? 20 : 10; // UTR thinner
    g.append('rect')
      .attr('x', xScale(exon.start))
      .attr('width', xScale(exon.end) - xScale(exon.start))
      .attr('y', y - height / 2)
      .attr('height', height)
      .attr('fill', exon.isCoding ? '#2196F3' : '#90CAF9');
  });

  // 3. Strand arrow
  g.append('text')
    .attr('x', xScale(gene.start) - 15)
    .attr('y', y + 5)
    .text(gene.strand === '+' ? '→' : '←');
}
```

**Visual hierarchy:** CDS (thick) > UTR (thin) > intron (line) > intergenic (empty)

---

### Q4: How does the ProteinPaint "block" pattern work?

**Answer:** ProteinPaint's `block` is the core genome browser container:

```javascript
const block = {
  // Genomic region
  startidx: 7668402, // Start coordinate
  stopidx: 7687550, // End coordinate

  // Core scale: genomic → screen
  exonsf: d3.scaleLinear().domain([startidx, stopidx]).range([0, width]),

  // Convert coordinates
  genomic2screen(pos) {
    return this.exonsf(pos);
  },

  // Tracks rendered in this block
  tklst: [],

  // Navigation methods
  zoomIn() {
    /* reduce domain range */
  },
  pan(dx) {
    /* shift domain */
  },
};
```

**Key insight:** All tracks share the same `exonsf` scale, ensuring synchronized rendering and navigation.

---

### Q5: What performance optimizations would you use for a genome browser rendering millions of features?

**Answer:**

1. **Level of detail (LOD):**
   - Zoomed out: aggregate features (coverage track)
   - Zoomed in: individual features

2. **Viewport culling:**

   ```javascript
   const visible = features.filter((f) => f.end > region.start && f.start < region.end);
   ```

3. **Binned data requests:**
   - Request data at appropriate resolution
   - 1bp resolution only when fully zoomed

4. **Canvas for dense tracks:**
   - SVG for genes (interactive)
   - Canvas for coverage (performance)

5. **Progressive rendering:**
   - Render visible region first
   - Load adjacent regions in background

6. **Data structures:**
   - Interval trees for overlap queries
   - Indexed files (tabix, bigwig)

7. **Caching:**
   - Cache parsed data by region
   - Invalidate on zoom beyond cached resolution

---

[← Back to Tutorials Index](../../README.md)
