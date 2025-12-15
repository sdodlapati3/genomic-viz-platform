# Implementation Plan: Gene Fusion Viewer (Phase 3.6)

> Visualize structural rearrangements and gene fusions common in cancer genomics

## Overview

Gene fusions are hallmarks of many cancers (BCR-ABL in CML, EML4-ALK in lung cancer, TMPRSS2-ERG in prostate cancer). ProteinPaint has sophisticated fusion visualization that we currently lack entirely. This tutorial fills that critical gap.

---

## Learning Objectives

By the end of this tutorial, students will be able to:

1. Understand gene fusion biology and data formats
2. Parse STAR-Fusion and Arriba output files
3. Create arc diagrams showing breakpoint connections
4. Build dual-gene coordinate visualizations
5. Implement interactive fusion explorers
6. Integrate with mutation (lollipop) views

---

## Tutorial Structure

```
06-gene-fusion/
├── README.md
├── package.json
├── index.html
├── vite.config.js
├── start-tutorial.sh
├── public/
│   └── data/
│       ├── fusions.json           # Sample fusion data
│       ├── star-fusion-sample.tsv # STAR-Fusion output
│       └── arriba-sample.tsv      # Arriba output
├── src/
│   ├── main.js
│   ├── styles.css
│   ├── parsers/
│   │   ├── starFusionParser.js
│   │   ├── arribaParser.js
│   │   └── fusionNormalizer.js
│   ├── components/
│   │   ├── FusionArc.js           # Arc diagram
│   │   ├── DualGeneView.js        # Side-by-side genes
│   │   ├── FusionTable.js         # Data table
│   │   ├── BreakpointDetail.js    # Detailed view
│   │   └── FusionExplorer.js      # Main explorer
│   ├── utils/
│   │   ├── coordinates.js
│   │   └── colors.js
│   └── 01-basics.js
│       02-arc-diagram.js
│       03-dual-gene.js
│       04-interactive.js
│       05-integration.js
└── exercises/
    ├── exercise-1.md
    ├── exercise-2.md
    └── solutions/
```

---

## Module 1: Gene Fusion Biology

### 1.1 What Are Gene Fusions?

```markdown
Gene fusions occur when two separate genes become joined:

Normal chromosomes:
Chr 9: ──────[ABL1]──────
Chr 22: ──────[BCR]──────

After translocation (Philadelphia chromosome):
Chr 22': ──────[BCR-ABL1]──────

This creates a chimeric protein with:

- N-terminus from BCR
- C-terminus from ABL1
- Constitutive kinase activity → Cancer

Common fusion types:
┌─────────────────┬────────────────────┬─────────────────┐
│ Fusion │ Cancer │ Frequency │
├─────────────────┼────────────────────┼─────────────────┤
│ BCR-ABL1 │ CML, ALL │ 95% CML │
│ EML4-ALK │ Lung (NSCLC) │ 3-7% NSCLC │
│ TMPRSS2-ERG │ Prostate │ 50% prostate │
│ PML-RARA │ APL │ 95% APL │
│ EWSR1-FLI1 │ Ewing sarcoma │ 85% │
│ MYB-NFIB │ Adenoid cystic │ 30-50% │
└─────────────────┴────────────────────┴─────────────────┘
```

### 1.2 Fusion Detection Methods

```javascript
/*
Fusion detection from RNA-seq:

1. Split reads: Single read spans breakpoint
   Read: ─────────────────────────────
         └──Gene A──┘     └──Gene B──┘

2. Discordant pairs: Mates map to different genes
   Read 1: ────────    Read 2: ────────
           [Gene A]            [Gene B]

3. Spanning reads: Reads fully in each gene but paired
*/

const fusionEvidence = {
  splitReads: 'Reads directly spanning breakpoint junction',
  spanningPairs: 'Read pairs with mates in different genes',
  junctionReads: 'Reads with split alignment at junction',
  supportingReads: 'Total reads supporting fusion',
};
```

---

## Module 2: Parsing Fusion Data

### 2.1 STAR-Fusion Parser

```javascript
// src/parsers/starFusionParser.js

/*
STAR-Fusion output format (TSV):
#FusionName    JunctionReadCount  SpanningFragCount  ...
BCR--ABL1      45                 23                 ...
*/

export function parseStarFusion(tsvContent) {
  const lines = tsvContent.trim().split('\n');
  const header = lines[0].replace('#', '').split('\t');

  return lines.slice(1).map((line) => {
    const values = line.split('\t');
    const row = {};
    header.forEach((col, i) => (row[col] = values[i]));

    // Parse fusion name
    const [geneA, geneB] = row.FusionName.split('--');

    // Parse breakpoints: chr9:133729451:+
    const [chrA, posA, strandA] = row.LeftBreakpoint.split(':');
    const [chrB, posB, strandB] = row.RightBreakpoint.split(':');

    return {
      id: row.FusionName,
      geneA: {
        name: geneA,
        chromosome: chrA,
        breakpoint: parseInt(posA),
        strand: strandA,
      },
      geneB: {
        name: geneB,
        chromosome: chrB,
        breakpoint: parseInt(posB),
        strand: strandB,
      },
      evidence: {
        junctionReads: parseInt(row.JunctionReadCount),
        spanningFragments: parseInt(row.SpanningFragCount),
        largeAnchorSupport: row.LargeAnchorSupport,
        ffpm: parseFloat(row.FFPM), // Fusion fragments per million
      },
      annotations: {
        spliceType: row.SpliceType,
        fusionType: classifyFusion(row),
      },
      raw: row,
    };
  });
}

function classifyFusion(row) {
  // Classify fusion type based on annotations
  const annot = row.annots || '';

  if (annot.includes('INTERCHROMOSOMAL')) return 'interchromosomal';
  if (annot.includes('INTRACHROMOSOMAL')) return 'intrachromosomal';
  if (annot.includes('NEIGHBORS')) return 'read-through';

  return 'unknown';
}
```

### 2.2 Arriba Parser

```javascript
// src/parsers/arribaParser.js

/*
Arriba output columns:
gene1, gene2, strand1, strand2, breakpoint1, breakpoint2,
site1, site2, type, direction1, direction2, split_reads1,
split_reads2, discordant_mates, coverage1, coverage2, confidence
*/

export function parseArriba(tsvContent) {
  const lines = tsvContent.trim().split('\n');
  const header = lines[0].split('\t');

  return lines.slice(1).map((line) => {
    const values = line.split('\t');
    const row = {};
    header.forEach((col, i) => (row[col] = values[i]));

    // Parse breakpoint: chr9:133729451
    const bp1 = parseBreakpoint(row.breakpoint1);
    const bp2 = parseBreakpoint(row.breakpoint2);

    return {
      id: `${row.gene1}--${row.gene2}`,
      geneA: {
        name: row['#gene1'] || row.gene1,
        chromosome: bp1.chr,
        breakpoint: bp1.pos,
        strand: row.strand1.replace(/\(.*\)/, ''),
        site: row.site1, // e.g., 'CDS', '5\'UTR', 'intron'
      },
      geneB: {
        name: row.gene2,
        chromosome: bp2.chr,
        breakpoint: bp2.pos,
        strand: row.strand2.replace(/\(.*\)/, ''),
        site: row.site2,
      },
      evidence: {
        splitReads1: parseInt(row.split_reads1),
        splitReads2: parseInt(row.split_reads2),
        discordantMates: parseInt(row.discordant_mates),
        coverage1: parseInt(row.coverage1),
        coverage2: parseInt(row.coverage2),
      },
      annotations: {
        fusionType: row.type,
        confidence: row.confidence, // high, medium, low
        direction1: row.direction1,
        direction2: row.direction2,
      },
      raw: row,
    };
  });
}

function parseBreakpoint(bp) {
  const match = bp.match(/^(chr[\dXYM]+):(\d+)$/);
  return {
    chr: match ? match[1] : null,
    pos: match ? parseInt(match[2]) : null,
  };
}
```

### 2.3 Normalized Fusion Format

```javascript
// src/parsers/fusionNormalizer.js

export function normalizeFusions(fusions, source) {
  return fusions.map((f) => ({
    id: f.id,
    source,

    // Partner genes
    geneA: {
      symbol: f.geneA.name,
      chr: f.geneA.chromosome,
      breakpoint: f.geneA.breakpoint,
      strand: f.geneA.strand,
      exon: f.geneA.exon || null,
      domain: f.geneA.domain || null,
    },
    geneB: {
      symbol: f.geneB.name,
      chr: f.geneB.chromosome,
      breakpoint: f.geneB.breakpoint,
      strand: f.geneB.strand,
      exon: f.geneB.exon || null,
      domain: f.geneB.domain || null,
    },

    // Computed properties
    isInterchromosomal: f.geneA.chromosome !== f.geneB.chromosome,
    totalSupport: computeTotalSupport(f),

    // Evidence (normalized)
    evidence: {
      total: computeTotalSupport(f),
      junctionReads:
        f.evidence.junctionReads || (f.evidence.splitReads1 + f.evidence.splitReads2) / 2,
      spanningReads: f.evidence.spanningFragments || f.evidence.discordantMates,
      confidence: f.annotations?.confidence || 'unknown',
    },

    // For display
    displayName: `${f.geneA.name}::${f.geneB.name}`,
    color: getFusionColor(f),
  }));
}

function computeTotalSupport(f) {
  if (f.evidence.junctionReads !== undefined) {
    return f.evidence.junctionReads + f.evidence.spanningFragments;
  }
  return f.evidence.splitReads1 + f.evidence.splitReads2 + f.evidence.discordantMates;
}

function getFusionColor(f) {
  const confidence = f.annotations?.confidence || 'unknown';
  return {
    high: '#e41a1c',
    medium: '#ff7f00',
    low: '#999999',
    unknown: '#377eb8',
  }[confidence];
}
```

---

## Module 3: Arc Diagram Visualization

### 3.1 Genome-Wide Arc View

```javascript
// src/components/FusionArc.js

export class FusionArcDiagram {
  constructor(container, options = {}) {
    this.container = container;
    this.width = options.width || 1000;
    this.height = options.height || 400;
    this.margin = { top: 20, right: 20, bottom: 100, left: 20 };

    this.chromosomes = this.initChromosomes();
    this.setup();
  }

  initChromosomes() {
    // Human chromosome sizes (GRCh38)
    return [
      { name: 'chr1', size: 248956422 },
      { name: 'chr2', size: 242193529 },
      { name: 'chr3', size: 198295559 },
      // ... all chromosomes
      { name: 'chr22', size: 50818468 },
      { name: 'chrX', size: 156040895 },
      { name: 'chrY', size: 57227415 },
    ];
  }

  setup() {
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    // Calculate genome-wide scale
    this.totalGenomeSize = this.chromosomes.reduce((sum, c) => sum + c.size, 0);

    // Linear scale mapping genome position to x coordinate
    this.xScale = d3
      .scaleLinear()
      .domain([0, this.totalGenomeSize])
      .range([this.margin.left, this.width - this.margin.right]);

    // Chromosome start positions
    let cumulative = 0;
    this.chromosomes.forEach((chr) => {
      chr.start = cumulative;
      chr.end = cumulative + chr.size;
      cumulative += chr.size;
    });

    this.renderChromosomes();
  }

  renderChromosomes() {
    const chromHeight = 20;
    const chromY = this.height - this.margin.bottom;

    // Chromosome rectangles
    this.svg
      .selectAll('.chromosome')
      .data(this.chromosomes)
      .join('rect')
      .attr('class', 'chromosome')
      .attr('x', (d) => this.xScale(d.start))
      .attr('y', chromY)
      .attr('width', (d) => this.xScale(d.end) - this.xScale(d.start))
      .attr('height', chromHeight)
      .attr('fill', (d, i) => (i % 2 === 0 ? '#4169E1' : '#87CEEB'))
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5);

    // Chromosome labels
    this.svg
      .selectAll('.chrom-label')
      .data(this.chromosomes)
      .join('text')
      .attr('class', 'chrom-label')
      .attr('x', (d) => this.xScale(d.start + d.size / 2))
      .attr('y', chromY + chromHeight + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .text((d) => d.name.replace('chr', ''));
  }

  render(fusions) {
    const chromY = this.height - this.margin.bottom;

    // Draw fusion arcs
    const arcs = this.svg
      .selectAll('.fusion-arc')
      .data(fusions)
      .join('path')
      .attr('class', 'fusion-arc')
      .attr('d', (d) => this.generateArc(d, chromY))
      .attr('fill', 'none')
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', (d) => Math.log2(d.evidence.total + 1))
      .attr('stroke-opacity', 0.6)
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip())
      .on('click', (event, d) => this.selectFusion(d));

    // Breakpoint markers
    const breakpoints = fusions.flatMap((f) => [
      { fusion: f, gene: f.geneA, type: 'A' },
      { fusion: f, gene: f.geneB, type: 'B' },
    ]);

    this.svg
      .selectAll('.breakpoint')
      .data(breakpoints)
      .join('circle')
      .attr('class', 'breakpoint')
      .attr('cx', (d) => this.getGenomeX(d.gene.chr, d.gene.breakpoint))
      .attr('cy', chromY)
      .attr('r', 4)
      .attr('fill', (d) => d.fusion.color)
      .attr('stroke', '#333')
      .attr('stroke-width', 1);
  }

  generateArc(fusion, chromY) {
    const x1 = this.getGenomeX(fusion.geneA.chr, fusion.geneA.breakpoint);
    const x2 = this.getGenomeX(fusion.geneB.chr, fusion.geneB.breakpoint);

    // Arc height based on distance
    const distance = Math.abs(x2 - x1);
    const arcHeight = Math.min(300, distance * 0.3);

    // SVG arc path
    const midX = (x1 + x2) / 2;
    const midY = chromY - arcHeight;

    return `M ${x1},${chromY} Q ${midX},${midY} ${x2},${chromY}`;
  }

  getGenomeX(chr, position) {
    const chrom = this.chromosomes.find((c) => c.name === chr);
    if (!chrom) return 0;
    return this.xScale(chrom.start + position);
  }

  showTooltip(event, fusion) {
    const tooltip = d3
      .select('#tooltip')
      .style('display', 'block')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);

    tooltip.html(`
      <strong>${fusion.displayName}</strong><br>
      ${fusion.geneA.chr}:${fusion.geneA.breakpoint.toLocaleString()}<br>
      ${fusion.geneB.chr}:${fusion.geneB.breakpoint.toLocaleString()}<br>
      Support: ${fusion.evidence.total} reads<br>
      Confidence: ${fusion.evidence.confidence}
    `);
  }

  hideTooltip() {
    d3.select('#tooltip').style('display', 'none');
  }

  selectFusion(fusion) {
    this.selectedFusion = fusion;
    this.container.dispatchEvent(
      new CustomEvent('fusionSelected', {
        detail: fusion,
      })
    );
  }
}
```

### 3.2 Circos-Style View

```javascript
// src/components/FusionCircos.js

export class FusionCircos {
  constructor(container, options = {}) {
    this.container = container;
    this.size = options.size || 600;
    this.innerRadius = this.size * 0.35;
    this.outerRadius = this.size * 0.4;

    this.chromosomes = this.initChromosomes();
    this.setup();
  }

  setup() {
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.size)
      .attr('height', this.size);

    this.g = this.svg
      .append('g')
      .attr('transform', `translate(${this.size / 2}, ${this.size / 2})`);

    // Calculate angles for each chromosome
    this.totalGenomeSize = this.chromosomes.reduce((sum, c) => sum + c.size, 0);

    let cumAngle = 0;
    const gap = 0.01; // Gap between chromosomes

    this.chromosomes.forEach((chr) => {
      chr.startAngle = cumAngle;
      chr.endAngle = cumAngle + (chr.size / this.totalGenomeSize) * (2 * Math.PI - gap * 24);
      cumAngle = chr.endAngle + gap;
    });

    this.renderChromosomeRing();
  }

  renderChromosomeRing() {
    const arc = d3.arc().innerRadius(this.innerRadius).outerRadius(this.outerRadius);

    this.g
      .selectAll('.chromosome-arc')
      .data(this.chromosomes)
      .join('path')
      .attr('class', 'chromosome-arc')
      .attr('d', (d) =>
        arc({
          startAngle: d.startAngle,
          endAngle: d.endAngle,
        })
      )
      .attr('fill', (d, i) => d3.schemeCategory10[i % 10])
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5);

    // Labels
    this.g
      .selectAll('.chrom-label')
      .data(this.chromosomes)
      .join('text')
      .attr('class', 'chrom-label')
      .attr('transform', (d) => {
        const angle = (d.startAngle + d.endAngle) / 2 - Math.PI / 2;
        const r = this.outerRadius + 15;
        return `translate(${r * Math.cos(angle)}, ${r * Math.sin(angle)})`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .text((d) => d.name.replace('chr', ''));
  }

  render(fusions) {
    // Draw fusion ribbons
    const ribbon = d3.ribbon().radius(this.innerRadius - 5);

    this.g
      .selectAll('.fusion-ribbon')
      .data(fusions)
      .join('path')
      .attr('class', 'fusion-ribbon')
      .attr('d', (d) => {
        const source = this.getChordPosition(d.geneA);
        const target = this.getChordPosition(d.geneB);

        return ribbon({
          source: { startAngle: source.start, endAngle: source.end },
          target: { startAngle: target.start, endAngle: target.end },
        });
      })
      .attr('fill', (d) => d.color)
      .attr('fill-opacity', 0.6)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 1)
      .on('mouseover', (event, d) => this.highlight(d))
      .on('mouseout', () => this.unhighlight());
  }

  getChordPosition(gene) {
    const chr = this.chromosomes.find((c) => c.name === gene.chr);
    if (!chr) return { start: 0, end: 0 };

    const fraction = gene.breakpoint / chr.size;
    const center = chr.startAngle + (chr.endAngle - chr.startAngle) * fraction;
    const width = 0.01; // Ribbon width

    return {
      start: center - width / 2,
      end: center + width / 2,
    };
  }
}
```

---

## Module 4: Dual-Gene View

### 4.1 Side-by-Side Gene Visualization

```javascript
// src/components/DualGeneView.js

export class DualGeneView {
  constructor(container, options = {}) {
    this.container = container;
    this.width = options.width || 1000;
    this.height = options.height || 300;
    this.margin = { top: 40, right: 50, bottom: 60, left: 50 };

    this.setup();
  }

  setup() {
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    // Two panels
    const panelWidth = (this.width - this.margin.left - this.margin.right - 50) / 2;

    this.geneAPanel = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.geneBPanel = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin.left + panelWidth + 50}, ${this.margin.top})`);

    this.panelWidth = panelWidth;
    this.panelHeight = this.height - this.margin.top - this.margin.bottom;
  }

  async render(fusion, geneDataA, geneDataB) {
    this.fusion = fusion;

    // Clear previous
    this.geneAPanel.selectAll('*').remove();
    this.geneBPanel.selectAll('*').remove();

    // Render both genes
    this.renderGene(this.geneAPanel, geneDataA, fusion.geneA, 'A');
    this.renderGene(this.geneBPanel, geneDataB, fusion.geneB, 'B');

    // Draw fusion junction connector
    this.renderJunctionConnector();
  }

  renderGene(panel, geneData, fusionGene, label) {
    const { start, end, exons, strand, symbol } = geneData;

    // Scale for this gene
    const xScale = d3
      .scaleLinear()
      .domain([start, end])
      .range(strand === '+' ? [0, this.panelWidth] : [this.panelWidth, 0]);

    // Title
    panel
      .append('text')
      .attr('x', this.panelWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .text(`${symbol} (Gene ${label})`);

    // Gene body line
    const geneY = this.panelHeight / 2;

    panel
      .append('line')
      .attr('x1', 0)
      .attr('y1', geneY)
      .attr('x2', this.panelWidth)
      .attr('y2', geneY)
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    // Exons
    const exonHeight = 30;

    panel
      .selectAll('.exon')
      .data(exons)
      .join('rect')
      .attr('class', 'exon')
      .attr('x', (d) => Math.min(xScale(d.start), xScale(d.end)))
      .attr('y', geneY - exonHeight / 2)
      .attr('width', (d) => Math.abs(xScale(d.end) - xScale(d.start)))
      .attr('height', exonHeight)
      .attr('fill', (d) => (d.isCoding ? '#4169E1' : '#87CEEB'))
      .attr('stroke', '#333');

    // Breakpoint marker
    const bpX = xScale(fusionGene.breakpoint);

    panel
      .append('line')
      .attr('class', 'breakpoint-line')
      .attr('x1', bpX)
      .attr('y1', 0)
      .attr('x2', bpX)
      .attr('y2', this.panelHeight)
      .attr('stroke', '#e41a1c')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3');

    panel
      .append('text')
      .attr('x', bpX)
      .attr('y', this.panelHeight + 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e41a1c')
      .attr('font-size', '12px')
      .text(`Breakpoint: ${fusionGene.breakpoint.toLocaleString()}`);

    // Axis
    const axis = d3
      .axisBottom(xScale)
      .ticks(5)
      .tickFormat((d) => `${(d / 1e6).toFixed(2)}Mb`);

    panel
      .append('g')
      .attr('transform', `translate(0, ${this.panelHeight + 30})`)
      .call(axis);

    // Highlight kept portion
    const keptRegion =
      label === 'A' ? [start, fusionGene.breakpoint] : [fusionGene.breakpoint, end];

    panel
      .append('rect')
      .attr('class', 'kept-region')
      .attr('x', xScale(keptRegion[0]))
      .attr('y', 0)
      .attr('width', Math.abs(xScale(keptRegion[1]) - xScale(keptRegion[0])))
      .attr('height', this.panelHeight)
      .attr('fill', 'rgba(144, 238, 144, 0.2)')
      .attr('stroke', 'green')
      .attr('stroke-dasharray', '3,3')
      .lower();
  }

  renderJunctionConnector() {
    const centerY = this.panelHeight / 2 + this.margin.top;
    const gap = 50;

    // Arrow showing fusion direction
    const leftX = this.margin.left + this.panelWidth;
    const rightX = this.margin.left + this.panelWidth + gap;

    this.svg
      .append('path')
      .attr('d', `M${leftX},${centerY} L${rightX},${centerY}`)
      .attr('stroke', '#e41a1c')
      .attr('stroke-width', 3)
      .attr('marker-end', 'url(#arrow)');

    // Arrow marker definition
    this.svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#e41a1c');

    // Fusion symbol
    this.svg
      .append('text')
      .attr('x', leftX + gap / 2)
      .attr('y', centerY - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('::');
  }
}
```

---

## Module 5: Interactive Fusion Explorer

### 5.1 Main Explorer Component

```javascript
// src/components/FusionExplorer.js

export class FusionExplorer {
  constructor(container, options = {}) {
    this.container = container;
    this.fusions = [];

    this.setup();
  }

  setup() {
    // Create layout
    this.container.innerHTML = `
      <div class="fusion-explorer">
        <div class="controls">
          <input type="text" id="search" placeholder="Search fusions...">
          <select id="confidence-filter">
            <option value="">All confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <label>
            <input type="checkbox" id="interchrom-only">
            Interchromosomal only
          </label>
        </div>
        
        <div class="main-content">
          <div class="arc-view" id="arc-container"></div>
          <div class="detail-panel">
            <div id="dual-gene-container"></div>
            <div id="fusion-table-container"></div>
          </div>
        </div>
      </div>
    `;

    // Initialize sub-components
    this.arcDiagram = new FusionArcDiagram(document.getElementById('arc-container'));

    this.dualGeneView = new DualGeneView(document.getElementById('dual-gene-container'));

    this.fusionTable = new FusionTable(document.getElementById('fusion-table-container'));

    // Event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Search
    document.getElementById('search').addEventListener('input', (e) => {
      this.filterFusions({ search: e.target.value });
    });

    // Confidence filter
    document.getElementById('confidence-filter').addEventListener('change', (e) => {
      this.filterFusions({ confidence: e.target.value });
    });

    // Interchromosomal checkbox
    document.getElementById('interchrom-only').addEventListener('change', (e) => {
      this.filterFusions({ interchromOnly: e.target.checked });
    });

    // Fusion selection
    document.getElementById('arc-container').addEventListener('fusionSelected', (e) => {
      this.selectFusion(e.detail);
    });

    this.fusionTable.on('select', (fusion) => {
      this.selectFusion(fusion);
    });
  }

  async loadData(source, data) {
    // Parse based on source
    let parsed;

    if (source === 'star-fusion') {
      parsed = parseStarFusion(data);
    } else if (source === 'arriba') {
      parsed = parseArriba(data);
    } else {
      parsed = data; // Already parsed
    }

    this.fusions = normalizeFusions(parsed, source);
    this.filteredFusions = [...this.fusions];

    this.render();
  }

  filterFusions(filters) {
    this.currentFilters = { ...this.currentFilters, ...filters };

    this.filteredFusions = this.fusions.filter((f) => {
      // Search filter
      if (this.currentFilters.search) {
        const search = this.currentFilters.search.toLowerCase();
        if (!f.displayName.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Confidence filter
      if (this.currentFilters.confidence) {
        if (f.evidence.confidence !== this.currentFilters.confidence) {
          return false;
        }
      }

      // Interchromosomal filter
      if (this.currentFilters.interchromOnly) {
        if (!f.isInterchromosomal) {
          return false;
        }
      }

      return true;
    });

    this.render();
  }

  render() {
    this.arcDiagram.render(this.filteredFusions);
    this.fusionTable.render(this.filteredFusions);
  }

  async selectFusion(fusion) {
    this.selectedFusion = fusion;

    // Fetch gene data
    const [geneDataA, geneDataB] = await Promise.all([
      this.fetchGeneData(fusion.geneA.symbol),
      this.fetchGeneData(fusion.geneB.symbol),
    ]);

    // Update dual gene view
    this.dualGeneView.render(fusion, geneDataA, geneDataB);

    // Highlight in arc diagram
    this.arcDiagram.highlightFusion(fusion);

    // Highlight in table
    this.fusionTable.highlightRow(fusion.id);
  }

  async fetchGeneData(symbol) {
    // Fetch from local API or Ensembl
    const response = await fetch(`/api/gene/${symbol}`);
    return response.json();
  }
}
```

---

## Sample Data Format

### Fusion JSON Schema

```javascript
// public/data/fusions.json
{
  "fusions": [
    {
      "id": "BCR--ABL1",
      "geneA": {
        "symbol": "BCR",
        "chr": "chr22",
        "breakpoint": 23179704,
        "strand": "+",
        "exon": 14
      },
      "geneB": {
        "symbol": "ABL1",
        "chr": "chr9",
        "breakpoint": 130854064,
        "strand": "+",
        "exon": 2
      },
      "evidence": {
        "total": 156,
        "junctionReads": 89,
        "spanningReads": 67,
        "confidence": "high"
      },
      "samples": ["SAMPLE001", "SAMPLE002"],
      "annotations": {
        "fusionType": "interchromosomal",
        "inFrame": true,
        "oncogenic": true,
        "drugTarget": "Imatinib"
      }
    }
  ]
}
```

---

## Exercises

### Exercise 1: Parse STAR-Fusion Output

Parse a provided STAR-Fusion file and display fusion count statistics.

### Exercise 2: Build an Arc Diagram

Create an arc diagram showing the top 10 fusions by read support.

### Exercise 3: Fusion Detail View

Implement a detailed view showing both genes with exon structure and breakpoint location.

---

## Success Criteria

- [ ] Parse STAR-Fusion and Arriba output formats
- [ ] Render genome-wide arc diagram
- [ ] Display dual-gene fusion detail view
- [ ] Filter fusions by confidence and type
- [ ] Interactive selection between views
- [ ] Export fusion report

---

_Implementation plan for Tutorial 3.6 - Gene Fusion Viewer_
