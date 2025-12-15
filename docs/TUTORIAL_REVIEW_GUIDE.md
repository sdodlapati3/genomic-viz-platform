# Tutorial Review Guide

Quick reference for running and understanding each tutorial.

---

## 🚀 Quick Start Commands

```bash
# Navigate to any tutorial and run:
cd tutorials/phase-X-xxx/XX-tutorial-name
npm install
npm run dev
# Open http://localhost:5173 (or shown port)
```

---

## Phase 1: Frontend Fundamentals

### 1.1 SVG & Canvas Basics
```bash
cd tutorials/phase-1-frontend/01-svg-canvas
npm install && npm run dev
```
**Key Files:**
- `src/01-svg-basics.js` - SVG elements, shapes, attributes
- `src/02-svg-paths.js` - Path commands (M, L, Q, C, A)
- `src/03-canvas-basics.js` - Canvas 2D context drawing
- `src/04-interactivity.js` - Mouse events, hover, click
- `src/05-comparison.js` - SVG vs Canvas trade-offs

**What to Look For:**
- [ ] How SVG elements are created/styled
- [ ] Path command syntax (d attribute)
- [ ] Canvas immediate-mode vs SVG retained-mode
- [ ] Event handling differences

---

### 1.2 D3 Core Concepts
```bash
cd tutorials/phase-1-frontend/02-d3-core
npm install && npm run dev
```
**Key Files:**
- `src/01-selections.js` - select(), selectAll(), append()
- `src/02-data-binding.js` - data(), enter(), exit(), join()
- `src/03-scales.js` - scaleLinear, scaleOrdinal, scaleBand
- `src/04-transitions.js` - transition(), duration(), ease()
- `src/05-genomic-chart.js` - Putting it all together

**What to Look For:**
- [ ] D3 selection chaining pattern
- [ ] Enter-update-exit pattern
- [ ] Scale domain/range mapping
- [ ] Transition interpolation

---

### 1.3 Lollipop Plot
```bash
cd tutorials/phase-1-frontend/03-lollipop-plot
npm install && npm run dev
```
**Key Files:**
- `src/01-basics.js` - Basic lollipop structure
- `src/02-domains.js` - Protein domain rendering
- `src/03-mutations.js` - Mutation markers
- `src/04-interactive.js` - Tooltips, zoom, brush
- `src/05-complete.js` - Full implementation

**What to Look For:**
- [ ] Vertical lines + circles pattern
- [ ] Domain rectangles with labels
- [ ] Color coding by mutation type
- [ ] Zoom/pan interactions

---

### 1.4 Genome Browser
```bash
cd tutorials/phase-1-frontend/04-genome-browser
npm install && npm run dev
```
**Key Files:**
- `src/01-coordinate-system.js` - Genomic coordinates
- `src/02-tracks.js` - Track container pattern
- `src/03-gene-track.js` - Gene/exon rendering
- `src/04-navigation.js` - Pan, zoom, coordinate input
- `src/05-complete.js` - Multi-track browser

**What to Look For:**
- [ ] Coordinate transformation (bp → pixels)
- [ ] Track stacking layout
- [ ] Gene structure (exons, introns, UTRs)
- [ ] Navigation controls

---

## Phase 2: Backend Development

### 2.1 REST API
```bash
cd tutorials/phase-2-backend/01-rest-api
npm install && npm run dev
```
**Key Files:**
- `src/server.js` - Express setup, routes
- `src/routes/` - API endpoints
- `src/middleware/` - Error handling, validation

**What to Look For:**
- [ ] Express route patterns
- [ ] Request/response handling
- [ ] Error middleware
- [ ] API documentation

---

### 2.2 PostgreSQL
```bash
cd tutorials/phase-2-backend/02-postgresql
# Requires PostgreSQL running
npm install && npm run dev
```
**Key Files:**
- `src/db.js` - Connection pool setup
- `src/models/` - Data models
- `src/queries/` - SQL queries

**What to Look For:**
- [ ] Connection pooling
- [ ] Parameterized queries
- [ ] Genomic data schema

---

### 2.3 File Parsing
```bash
cd tutorials/phase-2-backend/03-file-parsing
npm install && npm run dev
```
**Key Files:**
- `src/parsers/vcf.js` - VCF file parsing
- `src/parsers/bed.js` - BED file parsing
- `src/parsers/maf.js` - MAF file parsing

**What to Look For:**
- [ ] Streaming file reads
- [ ] Format-specific parsing logic
- [ ] Error handling for malformed files

---

### 2.4 R Integration
```bash
cd tutorials/phase-2-backend/04-r-integration
# Requires R installed
npm install && npm run dev
```
**Key Files:**
- `src/r-bridge.js` - Node.js ↔ R communication
- `src/analysis/` - R scripts for statistics

**What to Look For:**
- [ ] Child process spawning
- [ ] Data serialization
- [ ] Statistical computations

---

## Phase 3: Advanced Visualizations

### 3.1 Scatter Plot
```bash
cd tutorials/phase-3-advanced-viz/01-scatter-plot
npm install && npm run dev
```
**Key Files:**
- `src/scatter.js` or `src/main.js` - Main implementation
- Look for: scales, axes, points, brush selection

**What to Look For:**
- [ ] X/Y scale setup
- [ ] Point rendering with data binding
- [ ] Brush selection for filtering
- [ ] Axis labels and ticks

---

### 3.2 Heatmap
```bash
cd tutorials/phase-3-advanced-viz/02-heatmap
npm install && npm run dev
```
**Key Files:**
- `src/heatmap.js` - Matrix rendering
- Color scales, clustering, dendrograms

**What to Look For:**
- [ ] Matrix cell rendering
- [ ] Color scale (diverging/sequential)
- [ ] Row/column labels
- [ ] Optional: clustering dendrograms

---

### 3.3 Survival Curves
```bash
cd tutorials/phase-3-advanced-viz/03-survival-curves
npm install && npm run dev
```
**Key Files:**
- `src/survival.js` - Kaplan-Meier implementation
- Step function rendering, confidence intervals

**What to Look For:**
- [ ] Step function (stairs) rendering
- [ ] Confidence interval bands
- [ ] Censoring marks
- [ ] Log-rank test statistics
- [ ] At-risk table

---

### 3.4 Volcano Plot
```bash
cd tutorials/phase-3-advanced-viz/04-volcano-plot
npm install && npm run dev
```
**Key Files:**
- `src/volcano.js` - Differential expression viz
- Threshold lines, point coloring

**What to Look For:**
- [ ] Log2 fold change (x) vs -log10 p-value (y)
- [ ] Significance threshold lines
- [ ] Color coding (up/down/not significant)
- [ ] Gene labels for top hits

---

### 3.5 OncoPrint
```bash
cd tutorials/phase-3-advanced-viz/05-oncoprint
npm install && npm run dev
```
**Key Files:**
- `src/oncoprint.js` - Mutation matrix
- Gene × Sample grid with mutation glyphs

**What to Look For:**
- [ ] Gene rows × Sample columns
- [ ] Mutation type glyphs (colors/shapes)
- [ ] Sorting by mutation frequency
- [ ] Track annotations

---

## 📋 Review Checklist Template

For each tutorial, check:

```
□ Code compiles without errors
□ Visualization renders in browser
□ Understand data flow (data → scales → elements)
□ Identify D3 patterns used
□ Note any genomics-specific logic
□ Test interactivity (if any)
```

---

## 🎯 Recommended Review Order

**Quick Overview (1-2 hours):**
1. 01-svg-canvas → See SVG/Canvas basics
2. 02-d3-core → Understand D3 patterns
3. 03-lollipop-plot → Core ProteinPaint viz
4. 02-heatmap → Matrix visualization
5. 03-survival-curves → Statistical viz

**Deep Dive (add more time per tutorial):**
- Focus on the `src/` files
- Read the README.md for each
- Modify parameters and see effects
- Add console.log to trace data flow

---

## 💡 Tips for Efficient Review

1. **Use Browser DevTools**: Inspect SVG elements, see computed styles
2. **Add Console Logs**: Trace data transformations
3. **Modify Constants**: Change colors, sizes, see immediate effects
4. **Check Network Tab**: See data loading (if external)
5. **Use VS Code Split View**: Code on left, browser on right
