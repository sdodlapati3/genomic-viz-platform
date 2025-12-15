# Tutorial 4.10: ProteinPaint Embed API

## 🎯 Learning Objectives

This tutorial demonstrates how to use St. Jude's **ProteinPaint embed API** to create custom genomic visualizations. You'll learn:

1. How the `runproteinpaint()` API works
2. Different visualization types (Gene Browser, Lollipop, Matrix, Scatter)
3. Configuration options for datasets and genomes
4. How to integrate ProteinPaint into your own applications

## 🧬 About ProteinPaint

ProteinPaint is St. Jude's production genomic visualization platform that powers:

- **GenomePaint** - Pediatric cancer visualization
- **Pecan Data Portal** - Public pediatric cancer data
- **GDC Portal Integration** - NCI Genomic Data Commons

## 📋 Prerequisites

**ProteinPaint must be running locally:**

```bash
# In the proteinpaint repo directory
cd /path/to/proteinpaint
npm run dev1
```

The server should be running at `http://localhost:3000`

## 🚀 Quick Start

```bash
# From this directory
npx serve .
# Open http://localhost:3000 (or the port shown)
```

Or simply open `index.html` in a browser (some features may be limited due to CORS).

## 📚 API Reference

### Basic Gene Browser

```javascript
runproteinpaint({
  host: 'http://localhost:3000',
  holder: document.getElementById('container'),
  genome: 'hg38-test',
  gene: 'TP53',
});
```

### Lollipop Plot with Dataset

```javascript
runproteinpaint({
  host: 'http://localhost:3000',
  holder: document.getElementById('container'),
  genome: 'hg38-test',
  gene: 'TP53',
  tracks: [
    {
      type: 'mds3',
      dslabel: 'TermdbTest',
    },
  ],
});
```

### Sample Matrix (MASS API)

```javascript
runproteinpaint({
  host: 'http://localhost:3000',
  holder: document.getElementById('container'),
  genome: 'hg38-test',
  mass: {
    state: {
      vocab: {
        genome: 'hg38-test',
        dslabel: 'TermdbTest',
      },
      plots: [
        {
          chartType: 'matrix',
          settings: {
            matrix: { maxSample: 50 },
          },
        },
      ],
    },
  },
});
```

### Sample Scatter Plot

```javascript
runproteinpaint({
  host: 'http://localhost:3000',
  holder: document.getElementById('container'),
  genome: 'hg38-test',
  mass: {
    state: {
      vocab: {
        genome: 'hg38-test',
        dslabel: 'TermdbTest',
      },
      plots: [
        {
          chartType: 'sampleScatter',
          colorTW: { id: 'diaggrp' },
        },
      ],
    },
  },
});
```

## 🏗️ Architecture

### Embed API Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                      │
├─────────────────────────────────────────────────────────┤
│  <script src=".../bin/proteinpaint.js"></script>        │
│                                                          │
│  runproteinpaint({                                       │
│      host: "...",                                        │
│      holder: element,                                    │
│      ...config                                           │
│  })                                                      │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              ProteinPaint Client (D3.js)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Genome   │  │ Lollipop │  │ Matrix   │              │
│  │ Browser  │  │ Plot     │  │ View     │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 ProteinPaint Server                      │
│  /genomes    /termdb    /mds3    /bam    /bigwig       │
└─────────────────────────────────────────────────────────┘
```

### Key Components

| Component           | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `runproteinpaint()` | Main entry point for embedding             |
| `host`              | ProteinPaint server URL                    |
| `holder`            | DOM element to render into                 |
| `genome`            | Reference genome (hg38, hg19, etc.)        |
| `gene`              | Gene symbol for navigation                 |
| `tracks`            | Array of track configurations              |
| `mass`              | MASS (Multi-Analytics Sample Space) config |

## 🎨 Available Chart Types

### MASS Charts (via `mass.state.plots`)

| chartType       | Description                      |
| --------------- | -------------------------------- |
| `matrix`        | OncoMatrix-style sample overview |
| `sampleScatter` | 2D/3D scatter plots              |
| `violin`        | Violin plots for distributions   |
| `barchart`      | Bar charts                       |
| `survival`      | Kaplan-Meier survival curves     |
| `sampleView`    | Single sample detail view        |
| `hierCluster`   | Hierarchical clustering          |

### Track Types (via `tracks`)

| type     | Description                                |
| -------- | ------------------------------------------ |
| `mds3`   | Multi-dataset v3 (mutations, fusions, CNV) |
| `bedj`   | BED file with JSON details                 |
| `bigwig` | BigWig coverage tracks                     |
| `bam`    | BAM alignment tracks                       |

## 🔗 Resources

- [ProteinPaint GitHub](https://github.com/stjude/proteinpaint)
- [GenomePaint Paper](https://doi.org/10.1016/j.ccell.2021.03.007)
- [St. Jude Pecan Data Portal](https://pecan.stjude.cloud/)

---

## 🎯 Interview Preparation Q&A

### Q1: How does the ProteinPaint embed API work?

**Answer:**

```javascript
// The embed API loads ProteinPaint as an iframe or injects components
runproteinpaint({
  // Required: Server hosting ProteinPaint
  host: 'https://proteinpaint.stjude.org',

  // Required: DOM element to render into
  holder: document.getElementById('container'),

  // Required: Reference genome
  genome: 'hg38',

  // View configuration
  gene: 'TP53', // or block/tracks for custom views

  // Optional: Callbacks
  onReady: (api) => console.log('ProteinPaint loaded'),
  onError: (err) => console.error('Load failed:', err),
});
```

**Architecture:**

1. Loads JavaScript bundle from host server
2. Initializes D3/Canvas rendering in holder element
3. Fetches data from host APIs
4. Renders interactive visualization
5. Returns API object for programmatic control

---

### Q2: What are the main visualization types in ProteinPaint?

**Answer:**
| Type | Use Case | Example |
|------|----------|---------|
| **Gene/Block** | Genomic region browser | Gene structure, mutations, tracks |
| **Lollipop** | Mutation landscape | Hotspot mutations on protein |
| **Matrix** | Sample overview | OncoMatrix/OncoPrint style |
| **Scatter** | Dimensionality reduction | UMAP, t-SNE clusters |
| **Survival** | Clinical outcomes | Kaplan-Meier curves |
| **Violin** | Distribution comparison | Expression across groups |

```javascript
// Gene browser
runproteinpaint({ genome: 'hg38', gene: 'TP53' });

// Matrix view
runproteinpaint({
  genome: 'hg38',
  dslabel: 'Pediatric',
  chartType: 'matrix',
});

// Scatter plot
runproteinpaint({
  genome: 'hg38',
  dslabel: 'Pediatric',
  chartType: 'sampleScatter',
});
```

---

### Q3: How do you configure custom tracks in ProteinPaint?

**Answer:**

```javascript
runproteinpaint({
  host: 'http://localhost:3000',
  holder: document.getElementById('viz'),
  genome: 'hg38',

  // Block view with custom tracks
  block: true,
  position: 'chr17:7668421-7687490', // TP53 region

  tracks: [
    // Mutation track (mds3)
    {
      type: 'mds3',
      dslabel: 'Pediatric',
      name: 'Pediatric Mutations',
      // Filter to specific cohort
      filterObj: {
        type: 'tvs',
        tvs: { disease: ['ALL', 'AML'] },
      },
    },

    // Coverage track (BigWig)
    {
      type: 'bigwig',
      name: 'RNA-seq Coverage',
      url: '/data/coverage.bw',
      height: 80,
    },

    // Custom BED track
    {
      type: 'bedj',
      name: 'Enhancers',
      url: '/data/enhancers.bed.gz',
      color: '#2ecc71',
    },
  ],
});
```

---

### Q4: How do you handle ProteinPaint API callbacks and events?

**Answer:**

```javascript
const ppInstance = runproteinpaint({
  host: 'http://localhost:3000',
  holder: container,
  genome: 'hg38',
  gene: 'TP53',

  // Lifecycle callbacks
  onReady: (api) => {
    console.log('ProteinPaint ready');

    // Store API for later use
    window.ppApi = api;

    // Programmatic navigation
    api.update({ gene: 'BRCA1' });
  },

  onError: (error) => {
    console.error('ProteinPaint error:', error);
    showErrorMessage(error.message);
  },
});

// Later: Update view programmatically
function navigateToGene(gene) {
  window.ppApi.update({ gene });
}

// Listen for user selections
function onMutationSelect(mutation) {
  // Handle selection in your app
  updateInfoPanel(mutation);
}
```

---

### Q5: How would you integrate ProteinPaint into a larger application?

**Answer:**

```javascript
// React integration example
function ProteinPaintViewer({ gene, dataset, onSelect }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    // Initialize ProteinPaint
    apiRef.current = runproteinpaint({
      host: process.env.PP_HOST,
      holder: containerRef.current,
      genome: 'hg38',
      gene,
      dslabel: dataset,

      onReady: (api) => {
        // Set up event listeners
        api.on('select', onSelect);
      },
    });

    // Cleanup on unmount
    return () => {
      apiRef.current?.destroy();
    };
  }, []);

  // Update when gene changes
  useEffect(() => {
    apiRef.current?.update({ gene });
  }, [gene]);

  return <div ref={containerRef} style={{ width: '100%', height: 600 }} />;
}

// Usage
<ProteinPaintViewer
  gene="TP53"
  dataset="Pediatric"
  onSelect={(mutation) => setSelectedMutation(mutation)}
/>;
```

**Integration patterns:**

1. **Iframe embed** - Simplest, isolated
2. **JavaScript embed** - Full integration, shared DOM
3. **API-only** - Fetch data, render custom visualization

---

## 📝 Notes for Interview

This demo shows:

1. Understanding of ProteinPaint's embed architecture
2. Ability to work with their API
3. Knowledge of genomic visualization patterns
4. Familiarity with their codebase structure
