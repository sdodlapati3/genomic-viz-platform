# GenomePaint: Comprehensive Tutorial

> **A deep dive into St. Jude's multi-sample genomic visualization platform for pediatric cancer research**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [GenomePaint vs ProteinPaint](#2-genomepaint-vs-proteinpaint)
3. [Architecture Overview](#3-architecture-overview)
4. [Key Scientific Features](#4-key-scientific-features)
5. [The Pediatric Cancer Dataset](#5-the-pediatric-cancer-dataset)
6. [Using GenomePaint Online](#6-using-genomepaint-online)
7. [Embed API Deep Dive](#7-embed-api-deep-dive)
8. [Running Locally with Docker](#8-running-locally-with-docker)
9. [Codebase Architecture](#9-codebase-architecture)
10. [Advanced Customization](#10-advanced-customization)
11. [Interview Preparation Notes](#11-interview-preparation-notes)

---

## 1. Introduction

### What is GenomePaint?

**GenomePaint** is a web-based visualization tool developed at St. Jude Children's Research Hospital that enables researchers to explore genomic alterations across thousands of pediatric cancer samples simultaneously. It was published in _Cancer Cell_ in 2021:

> **Citation**: Zhou X, Edmonson MN, Wilber K, et al. "Exploring genomic alteration in pediatric cancer using ProteinPaint." _Nat Genet._ 2016;48(1):4-6. Extended in _Cancer Cell_ 2021.

### Why GenomePaint Matters

Traditional genome browsers (UCSC, IGV) show one sample at a time. GenomePaint revolutionizes this by:

1. **Multi-sample visualization** - View mutations from 3,800+ samples simultaneously
2. **Phenotype integration** - Link genomic data with clinical outcomes
3. **Noncoding exploration** - Discover oncogene activation via enhancer hijacking
4. **Interactive analysis** - Perform survival analysis, mutual exclusivity tests on-the-fly

### Key Publications

| Year | Publication     | Focus                                               |
| ---- | --------------- | --------------------------------------------------- |
| 2016 | Nature Genetics | ProteinPaint - protein-level mutation visualization |
| 2021 | Cancer Cell     | GenomePaint - multi-sample genomic visualization    |
| 2023 | Ongoing         | Integration with St. Jude Cloud ecosystem           |

---

## 2. GenomePaint vs ProteinPaint

Understanding the relationship between these tools is crucial:

```
┌─────────────────────────────────────────────────────────────────┐
│                     ProteinPaint (Library)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Core Visualization Engine                                │   │
│  │  • D3.js-based rendering                                  │   │
│  │  • SVG + Canvas hybrid                                    │   │
│  │  • Reactive state management (rx)                         │   │
│  │  • Embed API (runproteinpaint)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │ Lollipop    │     │ GenomePaint │     │ OncoMatrix  │       │
│  │ Plot        │     │ Browser     │     │ (Oncoprint) │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              GenomePaint (Application at viz.stjude.cloud)       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ProteinPaint Library + Pediatric Cancer Dataset          │   │
│  │  • 3,800+ tumor samples                                   │   │
│  │  • Pre-configured tracks and annotations                  │   │
│  │  • Clinical data integration                              │   │
│  │  • Curated cancer type classifications                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Comparison Table

| Aspect         | ProteinPaint            | GenomePaint                        |
| -------------- | ----------------------- | ---------------------------------- |
| **Type**       | Visualization library   | Application                        |
| **URL**        | proteinpaint.stjude.org | viz.stjude.cloud/tools/genomepaint |
| **Data**       | Custom/any              | Pediatric cancer cohort            |
| **Use Case**   | Embed in your app       | Direct research exploration        |
| **GitHub**     | stjude/proteinpaint     | Same repository                    |
| **Deployment** | Self-hosted or npm      | St. Jude Cloud hosted              |

---

## 3. Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  JavaScript Application                                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│   │
│  │  │ rx/         │ │ plots/      │ │ dom/                ││   │
│  │  │ State Mgmt  │ │ Viz Types   │ │ UI Components       ││   │
│  │  │ (Bus.ts)    │ │ (matrix,    │ │ (controls,          ││   │
│  │  │             │ │  block,     │ │  tables,            ││   │
│  │  │             │ │  lollipop)  │ │  tooltips)          ││   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘│   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────────┐│   │
│  │  │  Rendering Layer                                    ││   │
│  │  │  • SVG for vectors (axes, labels, interactions)     ││   │
│  │  │  • Canvas for performance (thousands of mutations)  ││   │
│  │  │  • WebGL for scatter plots (UMAP with 100k+ cells)  ││   │
│  │  └─────────────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────┘
                                 │ HTTP/WebSocket
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Node.js Server                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Express.js API                                           │   │
│  │  • /genomes - Available genome builds                     │   │
│  │  • /termdb - Term database queries                        │   │
│  │  • /tkbigwig - BigWig track data                         │   │
│  │  • /tkbam - BAM file access                              │   │
│  │  • /mds3 - Multi-dimensional dataset queries              │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Data Access Layer                                        │   │
│  │  • tabix - Indexed genomic files                         │   │
│  │  • bcftools - VCF manipulation                           │   │
│  │  • samtools - BAM/SAM processing                         │   │
│  │  • HDF5 - High-dimensional data storage                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Rust Modules (via napi-rs)                               │   │
│  │  • VCF parsing - High-performance variant reading        │   │
│  │  • Interval trees - Fast genomic range queries           │   │
│  │  • MAF parsing - Mutation annotation format              │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Storage                                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ SQLite     │ │ Indexed    │ │ BigWig/    │ │ HDF5       │   │
│  │ (termdb)   │ │ Files      │ │ BigBed     │ │ (matrices) │   │
│  │            │ │ (tabix)    │ │            │ │            │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer             | Technology            | Purpose                              |
| ----------------- | --------------------- | ------------------------------------ |
| **Frontend**      | JavaScript/TypeScript | Core application logic               |
| **Visualization** | D3.js v7              | Data-driven DOM manipulation         |
| **Rendering**     | SVG + Canvas + WebGL  | Performance-optimized display        |
| **State**         | Custom rx system      | Reactive state management            |
| **Backend**       | Node.js + Express     | API server                           |
| **Performance**   | Rust (napi-rs)        | High-speed file parsing              |
| **Statistics**    | R integration         | Survival analysis, statistical tests |
| **Data**          | SQLite, tabix, HDF5   | Multi-format genomic data            |

---

## 4. Key Scientific Features

### 4.1 Multi-Sample Mutation Browser

The core GenomePaint view shows mutations aggregated across samples:

```
┌─────────────────────────────────────────────────────────────────┐
│  Genomic Coordinates (chr17:7,571,720-7,590,868)                │
├─────────────────────────────────────────────────────────────────┤
│  Gene Track: TP53 ━━━━━━▶━━━━━━━▶━━━━━━━▶━━━━━━━▶             │
│              Exon1   Exon2   Exon3   Exon4                      │
├─────────────────────────────────────────────────────────────────┤
│  Mutation Track:                                                 │
│     ●●●●●  ●●  ●●●●●●●●●●●●●●●●  ●●●●  ●                       │
│     R175H      R248Q R273H       R282W                          │
│     (89)       (67)  (124)       (34)                           │
├─────────────────────────────────────────────────────────────────┤
│  Sample Breakdown:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ TALL: ████████████████████████████░░░░░░░░ (62, 14%)    │   │
│  │ AML:  ████████████████░░░░░░░░░░░░░░░░░░░░ (35, 8%)     │   │
│  │ NBL:  ██████████░░░░░░░░░░░░░░░░░░░░░░░░░░ (22, 5%)     │   │
│  │ ...                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Structural Variant Visualization

GenomePaint excels at showing complex rearrangements:

```
┌─────────────────────────────────────────────────────────────────┐
│  Chromosome 11 (TAL1 locus)                                      │
│  ────────────●═══════════════════●────────────                  │
│              │                   │                               │
│              │   Deletion        │                               │
│              │   (removes        │                               │
│              │    insulator)     │                               │
│              │                   │                               │
│  ────────────●═══════════════════●────────────                  │
│  Enhancer                        TAL1 Gene                       │
│                                                                  │
│  Result: Enhancer hijacking → TAL1 activation in T-ALL          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Survival Analysis (Kaplan-Meier)

Interactive survival curves integrated with mutation data:

```javascript
// GenomePaint generates survival analysis from selected samples
{
  "analysis": "survival",
  "samples": ["sample1", "sample2", ...],
  "stratifyBy": "TP53_mutation_status",
  "endpoint": "overall_survival",
  "output": {
    "groups": [
      { "name": "TP53 mutant", "n": 156, "events": 89 },
      { "name": "TP53 wildtype", "n": 2847, "events": 412 }
    ],
    "logRankP": 0.00023,
    "hazardRatio": 2.34
  }
}
```

### 4.4 OncoMatrix (Oncoprint)

Sample × Gene mutation matrix:

```
         TP53  KRAS  NRAS  BRAF  PIK3CA  PTEN
Sample1   ■     ·     ·     ·      ·      ·
Sample2   ·     ■     ·     ·      ·      ·
Sample3   ■     ·     ■     ·      ·      ·
Sample4   ·     ·     ·     ■      ·      ·
Sample5   ■     ·     ·     ·      ■      ·
Sample6   ·     ■     ·     ·      ·      ■
...

Legend: ■ = Missense  ▲ = Frameshift  ● = Nonsense  ◆ = Splice
```

### 4.5 Mutation Signatures

COSMIC mutation signature analysis:

```
┌────────────────────────────────────────────────────────────────┐
│  Mutation Signature Decomposition                               │
│                                                                 │
│  SBS1 (Age):      ████████████████░░░░░░░░░░░░░░░  (42%)       │
│  SBS5 (Clock):    ██████████░░░░░░░░░░░░░░░░░░░░░  (28%)       │
│  SBS7 (UV):       ████░░░░░░░░░░░░░░░░░░░░░░░░░░░  (12%)       │
│  SBS11 (TMZ):     ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (10%)       │
│  Other:           ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (8%)        │
│                                                                 │
│  Trinucleotide Context:                                         │
│   C>T at CpG: ████████████████████ (dominant)                   │
│   C>A:        ████████░░░░░░░░░░░░                              │
│   T>C:        ████░░░░░░░░░░░░░░░░                              │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. The Pediatric Cancer Dataset

### Sample Composition

The GenomePaint dataset at viz.stjude.cloud includes:

| Cancer Type                         | Abbreviation | Samples    | % of Total |
| ----------------------------------- | ------------ | ---------- | ---------- |
| T-cell Acute Lymphoblastic Leukemia | TALL         | 462        | 12.2%      |
| B-cell Acute Lymphoblastic Leukemia | BALL         | 1,078      | 28.4%      |
| Acute Myeloid Leukemia              | AML          | 356        | 9.4%       |
| Neuroblastoma                       | NBL          | 234        | 6.2%       |
| Osteosarcoma                        | OS           | 178        | 4.7%       |
| Ewing Sarcoma                       | EWS          | 145        | 3.8%       |
| Rhabdomyosarcoma                    | RMS          | 167        | 4.4%       |
| High-Grade Glioma                   | HGG          | 289        | 7.6%       |
| Medulloblastoma                     | MB           | 312        | 8.2%       |
| Other                               | Various      | 579        | 15.1%      |
| **Total**                           |              | **~3,800** | **100%**   |

### Data Types Available

```
┌─────────────────────────────────────────────────────────────────┐
│  Multi-Omics Data Layers                                         │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ SNV/Indels  │  │ CNV         │  │ SV/Fusions  │              │
│  │ (WGS/WES)   │  │ (Arrays,    │  │ (RNA-seq,   │              │
│  │             │  │  WGS)       │  │  WGS)       │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Expression  │  │ Methylation │  │ Clinical    │              │
│  │ (RNA-seq)   │  │ (Arrays)    │  │ (Survival,  │              │
│  │             │  │             │  │  Response)  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Using GenomePaint Online

### Accessing GenomePaint

**URL**: https://viz.stjude.cloud/tools/genomepaint

### Basic Navigation

#### 1. Gene Search

```
Enter gene name → TAL1 → Press Enter
```

#### 2. Coordinate Navigation

```
Format: chr:start-stop
Example: chr17:7571720-7590868 (TP53 region)
```

#### 3. Zoom Controls

- **Mouse wheel**: Zoom in/out
- **Click + drag**: Pan left/right
- **Double-click**: Center on position

### Key Interface Elements

```
┌─────────────────────────────────────────────────────────────────┐
│  [Gene Search] [Coordinates] [2x] [10x] [50x] [Tracks▼] [More▼] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Gene Track ──────────────────────────────────────────────┐  │
│  │  TP53 ━━━━━━▶━━━━━━━▶━━━━━━━▶━━━━━━━▶                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ Mutation Track ──────────────────────────────────── [⚙] ┐  │
│  │  Pediatric tumor mutation                                 │  │
│  │  ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●    │  │
│  │                                                           │  │
│  │  Legend: [Missense] [Nonsense] [Frameshift] [Splice]     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ CNV Track ───────────────────────────────────────── [⚙] ┐  │
│  │  ▄▄▄▄▄▄▄▄▄▄████████▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄████████▄▄▄▄▄▄    │  │
│  │  (Log2 ratio: -2 ─── 0 ─── +2)                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Common Workflows

#### Workflow 1: Explore Gene Mutations

1. Search for gene (e.g., "TP53")
2. Click on mutation clusters in track
3. View sample breakdown by cancer type
4. Export sample list for further analysis

#### Workflow 2: Survival Analysis

1. Select samples with mutations of interest
2. Click "Survival Analysis" in menu
3. Choose clinical endpoint (OS, EFS)
4. View Kaplan-Meier curves and statistics

#### Workflow 3: Find Recurrent SVs

1. Navigate to gene of interest
2. Enable SV/Fusion track
3. Look for arc patterns indicating breakpoints
4. Click to see fusion partners and frequencies

---

## 7. Embed API Deep Dive

### Loading the Library

```html
<!-- Option 1: From proteinpaint.stjude.org (production) -->
<script src="https://proteinpaint.stjude.org/bin/proteinpaint.js"></script>

<!-- Option 2: Local development server -->
<script src="http://localhost:3000/bin/proteinpaint.js"></script>
```

### Basic Embedding

```javascript
// Minimal example - Gene browser
runproteinpaint({
  host: 'https://proteinpaint.stjude.org',
  holder: document.getElementById('container'),
  genome: 'hg38',
  gene: 'TP53',
});
```

### Advanced Configuration

```javascript
runproteinpaint({
  // Connection settings
  host: 'https://proteinpaint.stjude.org',
  holder: document.getElementById('container'),

  // Genome and position
  genome: 'hg38',
  position: 'chr17:7571720-7590868',

  // Dataset configuration
  mds3: {
    dslabel: 'Pediatric',
    track: {
      type: 'mds3',
      name: 'Pediatric Mutations',
    },
  },

  // Track configuration
  tracks: [
    {
      type: 'bedj',
      name: 'RefGene',
      file: 'anno/refGene.hg38.gz',
    },
    {
      type: 'bigwig',
      name: 'Conservation',
      file: 'anno/phyloP100way.hg38.bw',
      height: 50,
    },
  ],

  // UI settings
  noheader: false,
  nobox: false,

  // Callbacks
  callbacks: {
    postInit: (pp) => {
      console.log('ProteinPaint initialized', pp);
    },
    onCoordinateChange: (coord) => {
      console.log('Position:', coord);
    },
  },
});
```

### Visualization Types

#### 1. Lollipop Plot (Protein-Level Mutations)

```javascript
runproteinpaint({
  host: 'https://proteinpaint.stjude.org',
  holder: document.getElementById('container'),
  genome: 'hg38',
  gene: 'TP53',
  tracks: [
    {
      type: 'mds3',
      dslabel: 'Pediatric',
      displayMode: 'protein', // Lollipop view
    },
  ],
});
```

#### 2. Genome Browser (Multi-Track)

```javascript
runproteinpaint({
  host: 'https://proteinpaint.stjude.org',
  holder: document.getElementById('container'),
  genome: 'hg38',
  block: true, // Enable genome browser mode
  position: 'chr17:7571720-7590868',
  tracks: [
    { type: 'bedj', name: 'Genes', file: 'anno/refGene.hg38.gz' },
    { type: 'mds3', dslabel: 'Pediatric' },
  ],
});
```

#### 3. Sample Matrix (OncoMatrix)

```javascript
runproteinpaint({
  host: 'https://proteinpaint.stjude.org',
  holder: document.getElementById('container'),
  genome: 'hg38',
  mass: {
    state: {
      dslabel: 'Pediatric',
      displayMode: 'matrix',
      matrixConfig: {
        genes: ['TP53', 'KRAS', 'NRAS', 'BRAF', 'PIK3CA'],
        sortBy: 'mutation_count',
      },
    },
  },
});
```

#### 4. Scatter Plot (UMAP/t-SNE)

```javascript
runproteinpaint({
  host: 'https://proteinpaint.stjude.org',
  holder: document.getElementById('container'),
  genome: 'hg38',
  mass: {
    state: {
      dslabel: 'Pediatric',
      displayMode: 'scatter',
      scatterConfig: {
        xTerm: { id: 'UMAP1' },
        yTerm: { id: 'UMAP2' },
        colorTerm: { id: 'cancer_type' },
      },
    },
  },
});
```

### Event Handling

```javascript
const pp = await runproteinpaint({
  host: 'https://proteinpaint.stjude.org',
  holder: document.getElementById('container'),
  genome: 'hg38',
  gene: 'TP53',
});

// Listen for user interactions
pp.on('sampleClick', (sample) => {
  console.log('User clicked sample:', sample.id);
  // Fetch additional data, update external UI, etc.
});

pp.on('mutationSelect', (mutations) => {
  console.log('Selected mutations:', mutations);
  // Trigger downstream analysis
});

pp.on('coordinateChange', ({ chr, start, stop }) => {
  // Sync with other visualizations
  updateOtherViews(chr, start, stop);
});
```

### Programmatic Control

```javascript
// Navigate to position
pp.goto('chr17:7571720-7590868');

// Zoom
pp.zoom(2); // 2x zoom in
pp.zoom(0.5); // 2x zoom out

// Add/remove tracks
pp.addTrack({
  type: 'bigwig',
  name: 'My Track',
  url: 'https://example.com/data.bw',
});

pp.removeTrack('My Track');

// Export
pp.export('svg'); // Download as SVG
pp.export('png'); // Download as PNG
```

---

## 8. Running Locally with Docker

### Quick Start

```bash
# Clone repository
git clone https://github.com/stjude/proteinpaint.git
cd proteinpaint

# Start with Docker (recommended)
docker run -d \
    --name ppdev \
    -p 3000:3000 \
    -v $(pwd):/home/root/pp \
    ghcr.io/stjude/devcontainer:latest

# Access at http://localhost:3000
```

### Development Setup

```bash
# Enter container
docker exec -it ppdev bash

# Install dependencies
cd /home/root/pp
npm ci

# Build client
npm run build

# Start server
npm start
```

### Test Datasets

The devcontainer includes test datasets:

| Dataset       | Description                     | Genome    |
| ------------- | ------------------------------- | --------- |
| TermdbTest    | Sample mutations, clinical data | hg38-test |
| ProtectedTest | Authentication testing          | hg38-test |

### Verify Installation

```bash
# Check API endpoint
curl http://localhost:3000/genomes

# Expected: {"genomes":{"hg38-test":{...}}}
```

---

## 9. Codebase Architecture

### Directory Structure

```
proteinpaint/
├── client/                 # Frontend application
│   ├── plots/             # Visualization types
│   │   ├── matrix/        # OncoMatrix (Oncoprint)
│   │   ├── scatter/       # Scatter plots (UMAP)
│   │   ├── violin/        # Violin plots
│   │   └── survival/      # Kaplan-Meier curves
│   ├── rx/                # Reactive state management
│   │   ├── Bus.ts         # Event bus
│   │   └── store.ts       # State stores
│   ├── mass/              # Main app framework
│   │   └── app.ts         # Entry point
│   ├── dom/               # UI components
│   └── filter/            # Data filtering
│
├── server/                 # Node.js backend
│   ├── routes/            # API endpoints
│   ├── src/               # Core server logic
│   │   ├── mds3.ts        # Dataset queries
│   │   ├── termdb.ts      # Term database
│   │   └── genome.ts      # Genome operations
│   └── shared/            # Shared utilities
│
├── rust/                   # High-performance modules
│   ├── src/
│   │   ├── vcf.rs         # VCF parsing
│   │   └── interval.rs    # Genomic intervals
│   └── Cargo.toml
│
├── shared/                 # Shared between client/server
│   └── types/             # TypeScript definitions
│
├── front/                  # Public entry point
│   └── src/
│       └── app.js         # runproteinpaint()
│
└── container/              # Docker configuration
    └── Dockerfile
```

### Key Source Files

#### State Management (client/rx/Bus.ts)

```typescript
// Event bus for component communication
export class Bus {
  private listeners = new Map<string, Set<Function>>();

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }
}
```

#### Matrix Plot (client/plots/matrix/matrix.js)

```javascript
// OncoMatrix implementation - samples × genes
export async function getPlotConfig(opts) {
  return {
    chartType: 'matrix',
    settings: {
      matrix: {
        colw: 14, // Column width
        rowh: 18, // Row height
        showGrid: true,
        sortBy: 'mutation_count',
      },
    },
  };
}
```

#### Server Route (server/routes/termdb.ts)

```typescript
// Term database API endpoint
app.post('/termdb', async (req, res) => {
  const { genome, dslabel, embedder } = req.body;
  const ds = genomes[genome].datasets[dslabel];

  // Query term database
  const result = await ds.cohort.termdb.query(req.body);

  res.json(result);
});
```

---

## 10. Advanced Customization

### Custom Tracks

```javascript
// Add a custom BigWig track
runproteinpaint({
  host: 'https://proteinpaint.stjude.org',
  holder: document.getElementById('container'),
  genome: 'hg38',
  position: 'chr17:7571720-7590868',
  tracks: [
    {
      type: 'bigwig',
      name: 'My ChIP-seq',
      url: 'https://myserver.com/data/chip.bw',
      height: 80,
      normalize: true,
      color: '#FF5722',
    },
  ],
});
```

### Custom Color Schemes

```javascript
// Customize mutation colors
runproteinpaint({
  ...config,
  mclass: {
    missense: '#4CAF50',
    nonsense: '#F44336',
    frameshift: '#9C27B0',
    splice: '#FF9800',
    silent: '#9E9E9E',
  },
});
```

### Custom Analysis Integration

```javascript
// Hook into selection for custom analysis
runproteinpaint({
  ...config,
  callbacks: {
    onSelection: async (samples) => {
      // Send to external analysis service
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ samples }),
      });

      const result = await response.json();
      displayCustomResults(result);
    },
  },
});
```

### Theming

```css
/* Custom CSS theming */
.sja_root {
  --pp-primary: #1976d2;
  --pp-secondary: #424242;
  --pp-background: #fafafa;
  --pp-font: 'Roboto', sans-serif;
}

.sja_tooltip {
  background: var(--pp-secondary);
  color: white;
  border-radius: 4px;
}
```

---

## 11. Interview Preparation Notes

### Key Technical Points to Highlight

#### 1. Architecture Understanding

- "GenomePaint uses a **hybrid rendering strategy** - SVG for interactive elements and labels, Canvas for high-volume data like mutations across thousands of samples"
- "The **rx event bus** enables decoupled communication between visualization components, similar to patterns I implemented in my linked views tutorial"

#### 2. Performance Optimizations

- "Rust modules via napi-rs handle computationally intensive parsing - I've worked with similar patterns in my VCF parser tutorial"
- "HDF5 for matrix data enables efficient slicing of large expression matrices without loading entire datasets"

#### 3. Scientific Domain Knowledge

- "GenomePaint's power comes from integrating coding AND noncoding mutations - revealing enhancer hijacking in T-ALL is a great example"
- "The mutual exclusivity analysis helps identify functionally related driver genes"

#### 4. Relevant Experience

- Reference your completed tutorials:
  - **Linked Views (4.8)**: Similar event bus pattern to ProteinPaint's rx
  - **Config System (4.9)**: State management comparable to their term filtering
  - **Survival Curves (3.3)**: Same Kaplan-Meier statistics they use
  - **OncoMatrix (3.5)**: Direct equivalent of their matrix visualization

### Questions to Ask

1. "How do you balance adding new features vs. maintaining API stability for embedded users?"
2. "What's the most challenging visualization performance problem you've solved recently?"
3. "How is the team approaching the integration of AI/LLM features mentioned in the job posting?"
4. "What's the process for a new developer's first contribution?"

### Demo Talking Points

```
"I've set up the ProteinPaint dev environment locally via Docker and
created an embed demo showing how external applications can integrate
with the visualization API.

My tutorials demonstrate equivalent patterns to what I see in your
codebase - the event bus for coordinated views, reactive state
management, and performance-focused Canvas rendering for genomic
data at scale."
```

---

## 12. Interview Questions & Answers

This section provides comprehensive Q&A preparation for GenomePaint/ProteinPaint developer interviews.

### Technical Questions - Frontend/Visualization

#### Q1: How would you approach rendering 50,000 mutations on a single screen?

**Answer:**
"I would use a **tiered rendering strategy** based on zoom level and mutation density:

1. **At overview level**: Aggregate mutations into bins and render density bars using Canvas for performance
2. **At intermediate zoom**: Show individual mutations as simple shapes (circles/rectangles) with Canvas batch rendering
3. **At detailed zoom**: Switch to SVG for individual mutations with full interactivity (hover, click, tooltips)

Key optimizations:

- **Spatial indexing** (R-tree or interval tree) for fast viewport queries
- **RequestAnimationFrame batching** to avoid layout thrashing
- **Web Workers** for off-thread data processing
- **Virtual scrolling** concepts - only render what's visible plus buffer

I implemented similar patterns in my scatter plot tutorial handling 100k+ points with WebGL, falling back to Canvas for simpler cases."

---

#### Q2: Explain the tradeoffs between SVG and Canvas for genomic visualization.

**Answer:**
| Aspect | SVG | Canvas |
|--------|-----|--------|
| **Interactivity** | Built-in (DOM events) | Manual hit detection |
| **Performance** | Slow >1000 elements | Fast for millions |
| **Resolution** | Infinite (vector) | Pixel-based (needs scaling) |
| **Memory** | High (DOM nodes) | Low (pixel buffer) |
| **Accessibility** | Good (screen readers) | Poor (just pixels) |
| **Animation** | CSS transitions | Manual redraw |

**When to use each:**

- **SVG**: Axes, labels, tooltips, legend, interactive controls, <500 data points
- **Canvas**: Mutation tracks, heatmaps, scatter plots with >1000 points
- **Hybrid approach (ProteinPaint's choice)**: SVG overlay for interactions, Canvas for data rendering

Example from ProteinPaint:

```javascript
// SVG for the interactive layer
const svg = d3.select(holder).append('svg');

// Canvas underneath for high-volume data
const canvas = d3.select(holder).append('canvas').style('position', 'absolute');
```

---

#### Q3: How does ProteinPaint's `rx` state management work?

**Answer:**
"ProteinPaint uses a custom reactive system similar to Redux or MobX but lighter weight:

```javascript
// Core pattern from client/rx/Bus.ts
class Bus {
  listeners = new Map();

  // Subscribe to state changes
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Broadcast state changes
  emit(event, data) {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }
}
```

**Benefits:**

1. **Decoupled components** - Views don't need direct references to each other
2. **Unidirectional data flow** - Changes propagate predictably
3. **Easy debugging** - Can log all events centrally
4. **Testability** - Mock the bus in unit tests

I implemented an equivalent `EventBus` in my Linked Views tutorial (4.8) for coordinating multiple visualizations."

---

#### Q4: How would you implement zoom and pan for a genome browser?

**Answer:**

```javascript
class GenomeBrowser {
  constructor(options) {
    this.chromosome = options.chr;
    this.start = options.start;
    this.stop = options.stop;
    this.width = options.width;

    // Scale: genomic position → pixel
    this.scale = d3.scaleLinear().domain([this.start, this.stop]).range([0, this.width]);
  }

  // Zoom centered on mouse position
  zoom(factor, mouseX) {
    const genomicPos = this.scale.invert(mouseX);
    const currentSpan = this.stop - this.start;
    const newSpan = currentSpan / factor;

    // Keep mouse position fixed
    const ratio = mouseX / this.width;
    this.start = genomicPos - newSpan * ratio;
    this.stop = genomicPos + newSpan * (1 - ratio);

    this.updateScale();
    this.render();
  }

  // Pan by pixel delta
  pan(deltaX) {
    const genomicDelta = (deltaX / this.width) * (this.stop - this.start);
    this.start -= genomicDelta;
    this.stop -= genomicDelta;

    this.updateScale();
    this.render();
  }
}
```

**Key considerations:**

- Clamp to chromosome boundaries
- Snap to sensible coordinates (don't show chr1:1000.5)
- Debounce rapid events during mouse wheel
- Fetch new data when viewport changes significantly"

---

### Technical Questions - Backend/Data

#### Q5: How would you design a database schema for mutation data?

**Answer:**

```sql
-- Normalized schema for flexibility
CREATE TABLE samples (
    sample_id VARCHAR(50) PRIMARY KEY,
    cancer_type VARCHAR(50),
    age_at_diagnosis INT,
    survival_days INT,
    vital_status VARCHAR(20)
);

CREATE TABLE mutations (
    mutation_id SERIAL PRIMARY KEY,
    sample_id VARCHAR(50) REFERENCES samples(sample_id),
    chromosome VARCHAR(10),
    position BIGINT,
    reference VARCHAR(1000),
    alternate VARCHAR(1000),
    gene VARCHAR(50),
    consequence VARCHAR(50),  -- missense, nonsense, etc.
    amino_acid_change VARCHAR(50),

    -- Indexing for genomic queries
    INDEX idx_genomic (chromosome, position),
    INDEX idx_gene (gene),
    INDEX idx_sample (sample_id)
);

-- For range queries (common in browsers)
CREATE TABLE mutation_ranges (
    chromosome VARCHAR(10),
    bin_start BIGINT,  -- 1MB bins
    bin_end BIGINT,
    mutation_count INT,
    PRIMARY KEY (chromosome, bin_start)
);
```

**For ProteinPaint specifically:**

- They use **SQLite** for termdb (clinical/phenotype data)
- **Tabix-indexed files** for genomic coordinates (fast range queries)
- **HDF5** for large matrices (gene expression)

---

#### Q6: Explain how tabix indexing works for genomic data.

**Answer:**
"Tabix creates a **two-level index** for BGZip-compressed files:

```
Level 1: Chromosome → File offset ranges
Level 2: 16KB bins → Line offsets within bin

Query: chr17:7,500,000-7,600,000

1. Find chr17 in level 1 index
2. Calculate which bins overlap [7.5M, 7.6M]
3. Seek to bin file offsets
4. Decompress only relevant BGZip blocks
5. Linear scan within blocks for exact matches
```

**Performance characteristics:**

- Index is small (~MB for WGS)
- Query time: O(log n) + O(results)
- No need to load entire file into memory
- Works over HTTP with range requests

This is why ProteinPaint stores mutation tracks as tabix-indexed files rather than querying a database for every viewport change."

---

#### Q7: How would you implement a REST API endpoint for mutation queries?

**Answer:**

```javascript
// server/routes/mutations.ts
app.get('/api/mutations', async (req, res) => {
  const { genome, chr, start, stop, dataset } = req.query;

  // Validate parameters
  if (!chr || !start || !stop) {
    return res.status(400).json({
      error: 'Missing required parameters: chr, start, stop',
    });
  }

  // Security: validate genome and dataset exist
  const ds = genomes[genome]?.datasets[dataset];
  if (!ds) {
    return res.status(404).json({ error: 'Dataset not found' });
  }

  try {
    // Use tabix for indexed file query
    const mutations = await tabix.query(ds.mutationFile, chr, parseInt(start), parseInt(stop));

    // Transform to API response format
    const result = mutations.map((m) => ({
      pos: m.position,
      ref: m.reference,
      alt: m.alternate,
      gene: m.gene,
      class: m.consequence,
      sample: m.sampleId,
    }));

    // Aggregate by position for overview
    if (req.query.aggregate === 'true') {
      return res.json(aggregateByPosition(result));
    }

    res.json(result);
  } catch (error) {
    console.error('Mutation query error:', error);
    res.status(500).json({ error: 'Query failed' });
  }
});
```

---

### Technical Questions - Performance/Rust

#### Q8: Why would you use Rust for file parsing in a Node.js application?

**Answer:**
"Rust via **napi-rs** provides significant benefits for CPU-intensive genomic file parsing:

**Performance comparison (VCF parsing):**
| Approach | Time for 1M variants | Memory |
|----------|---------------------|--------|
| Pure JavaScript | ~45 seconds | ~2GB |
| Rust native module | ~3 seconds | ~200MB |
| Improvement | **15x faster** | **10x less memory** |

**Why Rust specifically:**

1. **Zero-cost abstractions** - Safe high-level code compiles to optimal machine code
2. **Memory safety** - No buffer overflows, use-after-free
3. **Parallelism** - Fearless concurrency with ownership model
4. **napi-rs integration** - Clean TypeScript bindings, no C++ required

**Example from ProteinPaint:**

```rust
// rust/src/vcf.rs
#[napi]
pub fn parse_vcf_region(
    file_path: String,
    chr: String,
    start: u64,
    stop: u64
) -> Result<Vec<Variant>> {
    let reader = IndexedReader::from_path(&file_path)?;
    let region = format!("{}:{}-{}", chr, start, stop);

    reader.fetch(&region)?
        .map(|record| Variant::from_record(record?))
        .collect()
}
```

I implemented a similar Rust VCF parser in Tutorial 4.4 with napi-rs bindings and WebAssembly support."

---

#### Q9: How would you profile and optimize a slow visualization?

**Answer:**
"I follow a systematic approach:

**1. Identify the bottleneck:**

```javascript
// Chrome DevTools Performance tab
console.time('render');
renderVisualization();
console.timeEnd('render');

// More granular
performance.mark('start-bindData');
bindDataToDOM();
performance.mark('end-bindData');
performance.measure('Data Binding', 'start-bindData', 'end-bindData');
```

**2. Common bottlenecks and solutions:**

| Bottleneck           | Symptoms                 | Solution                        |
| -------------------- | ------------------------ | ------------------------------- |
| Too many DOM nodes   | Slow reflow, high memory | Switch to Canvas                |
| Excessive redraws    | Janky scrolling          | Debounce, RAF batching          |
| Large data transfers | Slow initial load        | Pagination, streaming           |
| Complex calculations | UI freezes               | Web Workers                     |
| Memory leaks         | Growing memory           | Proper cleanup, weak references |

**3. Specific techniques:**

```javascript
// BAD: Creates 50,000 SVG elements
mutations.forEach((m) => svg.append('circle').attr('cx', m.x));

// GOOD: Single Canvas draw call
ctx.beginPath();
mutations.forEach((m) => {
  ctx.moveTo(m.x + 3, m.y);
  ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
});
ctx.fill();

// BETTER: Off-thread processing
const worker = new Worker('mutationWorker.js');
worker.postMessage({ mutations, viewport });
worker.onmessage = (e) => renderProcessedData(e.data);
```

---

### Scientific/Domain Questions

#### Q10: What are the key challenges in visualizing cancer genomics data?

**Answer:**
"Several unique challenges:

**1. Data scale and heterogeneity:**

- Thousands of samples × millions of variants
- Multiple data types (SNV, CNV, SV, expression, methylation)
- Different file formats (VCF, MAF, BigWig, HDF5)

**2. Biological complexity:**

- Must show genomic context (exons, introns, regulatory regions)
- Mutations have different functional impacts
- Need to link genotype to phenotype (survival, treatment response)

**3. Scientific interpretation:**

- Distinguish drivers from passengers
- Show recurrence patterns
- Identify mutual exclusivity (suggests same pathway)
- Reveal noncoding regulatory effects

**4. User experience:**

- Researchers need both overview and detail
- Must support hypothesis generation AND validation
- Export for publication

GenomePaint addresses these by:

- Multi-track browser for context
- Aggregation at overview, detail on zoom
- Integrated statistical tests (survival, mutual exclusivity)
- Direct links from visualization to sample lists"

---

#### Q11: Explain how enhancer hijacking works and how GenomePaint visualizes it.

**Answer:**
"**Enhancer hijacking** is an oncogenic mechanism where structural variants reposition enhancers to activate proto-oncogenes:

```
Normal:
────[Enhancer]────────[Gene A]─────────────────[TAL1]────
     Active           ON                        OFF

After SV (deletion):
────[Enhancer]─────────────────────[TAL1]────
     Active                         ON (hijacked!)

     (Gene A deleted, enhancer now drives TAL1)
```

**In T-ALL:**

- TAL1 is normally off in T-cells
- Deletions remove insulator/intervening genes
- STIL enhancer now activates TAL1
- Result: T-cell proliferation, leukemia

**GenomePaint visualization:**

1. **Arc track** shows SV breakpoints connecting distant regions
2. **Multi-sample aggregation** reveals recurrent breakpoints
3. **Expression overlay** correlates SV with TAL1 activation
4. **Sample drill-down** shows individual cases

This is why the default GenomePaint view shows TAL1 - it's a canonical example of enhancer hijacking discovered partly using this tool."

---

#### Q12: How would you implement Kaplan-Meier survival analysis?

**Answer:**

```javascript
function kaplanMeier(data) {
  // data: [{time: days, event: 0|1, group: 'A'|'B'}]

  // Sort by time
  const sorted = [...data].sort((a, b) => a.time - b.time);

  // Calculate survival probability at each event
  const results = [];
  let atRisk = sorted.length;
  let survival = 1.0;

  for (const d of sorted) {
    if (d.event === 1) {
      // Death/event occurred
      survival *= (atRisk - 1) / atRisk;
      results.push({
        time: d.time,
        survival: survival,
        atRisk: atRisk,
        events: 1,
      });
    }
    atRisk--; // Either event or censored
  }

  return results;
}

function logRankTest(group1, group2) {
  // Compare survival curves
  // H0: survival functions are equal

  // Calculate observed and expected events
  let O1 = 0,
    E1 = 0; // Group 1

  // At each event time, calculate expected based on at-risk
  // Chi-square statistic: (O - E)² / E

  const chiSquare = Math.pow(O1 - E1, 2) / E1;
  const pValue = 1 - chiSquareCDF(chiSquare, 1);

  return { chiSquare, pValue };
}
```

I implemented full Kaplan-Meier with log-rank testing in Tutorial 3.3 (Survival Curves)."

---

### Behavioral/Team Questions

#### Q13: How do you approach learning a new codebase?

**Answer:**
"I follow a structured approach:

**1. Understand the purpose (1-2 hours):**

- Read README, architecture docs
- Try the product as a user
- Identify key use cases

**2. Map the structure (half day):**

- Draw high-level component diagram
- Identify entry points (main.js, app.ts)
- Note major directories and their purposes

**3. Trace a feature (1 day):**

- Pick one user action (e.g., 'search for gene')
- Follow code from UI → API → database → response → render
- Add console.logs/breakpoints liberally
- Document the flow

**4. Make a small change (1-2 days):**

- Fix a typo, add a log message
- Go through full PR process
- Learn the testing/CI expectations

**For ProteinPaint specifically:**

- I cloned the repo and ran it via Docker
- Explored the `client/rx` state management
- Traced how `runproteinpaint()` initializes views
- Created an embed demo to test the API

This is exactly what I did before this interview."

---

#### Q14: Describe a challenging bug you've debugged.

**Answer:**
"In my linked views tutorial, I had a **cascading update loop** where:

1. User clicks sample in scatter plot
2. Scatter plot emits selection event
3. Heatmap highlights sample, emits 'highlight' event
4. Table scrolls to sample, emits 'scroll' event
5. Scatter plot recenters, which re-triggers selection
6. **Infinite loop**

**Debugging process:**

1. Added event logging to the EventBus
2. Saw the cycle in console output
3. Root cause: Events weren't distinguishing user vs programmatic triggers

**Solution:**

```javascript
// Before (broken)
bus.emit('selection', { samples: [id] });

// After (fixed)
bus.emit('selection', {
  samples: [id],
  source: 'scatterplot', // Track origin
  userInitiated: true, // Was this from user interaction?
});

// Listeners check source to avoid loops
bus.on('selection', (event) => {
  if (event.source === 'heatmap') return; // I triggered this
  // ... handle selection
});
```

This is a common pattern in ProteinPaint's rx system too."

---

#### Q15: How do you balance code quality with delivery speed?

**Answer:**
"I use a **tiered quality approach** based on code criticality:

**Tier 1 - Core/Critical (highest quality):**

- Data processing, API responses, state management
- Full test coverage, code review, documentation
- No shortcuts

**Tier 2 - Important (good quality):**

- Main UI components, common workflows
- Key tests for happy path + edge cases
- Refactor after it works

**Tier 3 - Experimental (MVP quality):**

- New features, prototypes
- Manual testing, basic structure
- Tech debt ticket if it stays

**Practical tactics:**

1. **Timebox exploration** - 2 hours to prototype, then decide
2. **Write tests for bugs** - Every bug becomes a test case
3. **Incremental PRs** - Small, reviewable changes
4. **'Good enough' first** - Perfect is the enemy of shipped

For GenomePaint specifically, I'd prioritize:

- Correctness of genomic calculations (Tier 1)
- API stability for embedders (Tier 1)
- New visualization features (Tier 2)
- Internal refactoring (Tier 3)"

---

### Questions to Ask the Interviewer

1. "What's the typical feature development cycle from idea to production?"

2. "How does the team handle breaking changes to the embed API?"

3. "What's the most exciting upcoming feature on the roadmap?"

4. "How is the team structured? Frontend/backend split or full-stack?"

5. "What does success look like in the first 90 days for this role?"

6. "How do you balance maintaining GenomePaint vs. building new tools?"

7. "What's the testing philosophy? Unit vs integration vs E2E?"

8. "How does the team stay current with genomics research and visualization best practices?"

---

## Quick Reference

### Essential URLs

| Resource           | URL                                                             |
| ------------------ | --------------------------------------------------------------- |
| GenomePaint App    | https://viz.stjude.cloud/tools/genomepaint                      |
| ProteinPaint Demos | https://proteinpaint.stjude.org                                 |
| GitHub Repository  | https://github.com/stjude/proteinpaint                          |
| Documentation      | https://university.stjude.cloud/docs/visualization-community/   |
| Cancer Cell Paper  | https://www.cell.com/cancer-cell/fulltext/S1535-6108(20)30659-0 |

### Key API Endpoints

| Endpoint    | Purpose                           |
| ----------- | --------------------------------- |
| `/genomes`  | List available genome builds      |
| `/termdb`   | Query term database               |
| `/mds3`     | Multi-dimensional dataset queries |
| `/tkbigwig` | BigWig track data                 |

### Common Gene Examples for Testing

| Gene     | Cancer Association          | Coordinates (hg38)      |
| -------- | --------------------------- | ----------------------- |
| TP53     | Pan-cancer tumor suppressor | chr17:7661779-7687538   |
| TAL1     | T-ALL oncogene              | chr1:47218406-47232737  |
| PAX5     | B-ALL transcription factor  | chr9:36833275-37034185  |
| MYCN     | Neuroblastoma amplification | chr2:15940550-15947007  |
| EWS-FLI1 | Ewing sarcoma fusion        | chr22:29268219-29300842 |

---

_Tutorial created: December 15, 2025_
_Last updated: December 15, 2025_
