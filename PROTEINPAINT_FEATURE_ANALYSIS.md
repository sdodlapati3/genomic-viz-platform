# 🔬 ProteinPaint Feature Analysis & Implementation Plan

> **Purpose:** Compare genomic-viz-platform tutorials with ProteinPaint's actual features, identify gaps, and prioritize what to build.
>
> **Date:** December 15, 2025

---

## 📊 Current Tutorial Status

### What We Have Implemented

| Phase       | Tutorial           | Status      | Description                                   |
| ----------- | ------------------ | ----------- | --------------------------------------------- |
| **Phase 1** | 01-svg-canvas      | ✅ Complete | SVG/Canvas basics, interactivity              |
| **Phase 1** | 02-d3-core         | ✅ Complete | Selections, data binding, scales, transitions |
| **Phase 1** | 03-lollipop-plot   | ✅ Complete | Basic lollipop, domains, mutations            |
| **Phase 1** | 04-genome-browser  | ✅ Complete | Coordinates, tracks, features                 |
| **Phase 1** | 05-performance     | 🟡 Partial  | Canvas rendering, Web Workers                 |
| **Phase 2** | 01-rest-api        | ✅ Complete | Express.js, genomic endpoints                 |
| **Phase 2** | 02-postgresql      | 🟡 Partial  | Schema for genomic data                       |
| **Phase 2** | 03-file-parsing    | 🟡 Partial  | VCF, BED, GFF parsers                         |
| **Phase 2** | 04-r-integration   | 🟡 Partial  | R via child_process                           |
| **Phase 3** | 01-scatter-plot    | ✅ Complete | PCA/UMAP style plots                          |
| **Phase 3** | 02-heatmap         | ✅ Complete | Clustered heatmap with dendrogram             |
| **Phase 3** | 03-survival-curves | ✅ Complete | Kaplan-Meier with log-rank test               |
| **Phase 3** | 04-volcano-plot    | ✅ Complete | Differential expression viz                   |
| **Phase 3** | 05-gene-fusion     | 🟡 Partial  | Arc diagrams                                  |
| **Phase 3** | 05-oncoprint       | 🟡 Partial  | Sample x gene matrix                          |

---

## 🔍 ProteinPaint Feature Inventory

Based on exploration of stjude/proteinpaint repository:

### 1. **Core Visualization Components** (`client/plots/`)

| Feature                 | PP Files                                  | Our Status | Priority |
| ----------------------- | ----------------------------------------- | ---------- | -------- |
| **Bar Chart**           | `barchart.js` (47KB), `bars.renderer.js`  | ❌ Missing | Medium   |
| **Violin Plot**         | `violin.js`, `violin.renderer.js`         | ❌ Missing | Low      |
| **Box Plot**            | `boxplot/`                                | ❌ Missing | Low      |
| **Scatter Plot**        | `scatter/` (model/view/viewmodel pattern) | ✅ Have    | Enhance  |
| **Survival/Cuminc**     | `survival/`, `cuminc.js` (44KB)           | ✅ Have    | Enhance  |
| **Matrix/Oncoprint**    | `matrix/` (127KB interactivity!)          | 🟡 Basic   | **HIGH** |
| **Heatmap/HierCluster** | `matrix/hierCluster.*.js`                 | ✅ Have    | Enhance  |
| **Volcano Plot**        | `volcano/`, `corrVolcano/`                | ✅ Have    | Enhance  |
| **GSEA Plot**           | `gsea.js` (28KB)                          | ❌ Missing | Medium   |
| **Regression**          | `regression.*.js`                         | ❌ Missing | Low      |
| **Single Cell**         | `singleCellPlot.js` (58KB), `sc/`         | ❌ Missing | Medium   |
| **Gene Expression**     | `geneExpression.js`                       | ❌ Missing | Medium   |

### 2. **Genomic Browser Components** (`client/src/`)

| Feature                   | PP Files                             | Our Status | Priority |
| ------------------------- | ------------------------------------ | ---------- | -------- |
| **Block (Main Browser)**  | `block.js` (142KB!)                  | 🟡 Basic   | **HIGH** |
| **Tracks Framework**      | `block.tk.*.js`                      | 🟡 Basic   | **HIGH** |
| **BAM Track**             | `block.tk.bam.js` (111KB)            | ❌ Missing | Medium   |
| **BigWig Track**          | `block.tk.bigwig.js`                 | ❌ Missing | Medium   |
| **Junction Track**        | `block.tk.junction.js`               | ❌ Missing | Medium   |
| **Hi-C/Straw**            | `block.tk.hicstraw.ts`               | ❌ Missing | Low      |
| **Sample Matrix (svcnv)** | `block.mds.svcnv.*.js` (300KB total) | ❌ Missing | Medium   |

### 3. **mds3 (Mutation Data System)** (`client/mds3/`)

| Feature               | PP Files                               | Our Status | Priority    |
| --------------------- | -------------------------------------- | ---------- | ----------- |
| **Skewer (Lollipop)** | `skewer.js`, `skewer.render.js` (30KB) | ✅ Have    | **ENHANCE** |
| **CNV Track**         | `cnv.js`                               | ❌ Missing | Medium      |
| **Sample Table**      | `sampletable.js`                       | ❌ Missing | **HIGH**    |
| **Item Table**        | `itemtable.js`                         | ❌ Missing | Medium      |
| **Legend System**     | `legend.js` (33KB)                     | 🟡 Basic   | Medium      |
| **Numeric Mode**      | `numericmode.js`                       | ❌ Missing | Low         |

### 4. **Circos/Disco Plot** (`client/plots/disco/`)

| Feature             | PP Files               | Our Status                | Priority |
| ------------------- | ---------------------- | ------------------------- | -------- |
| **Chromosome Ring** | `chromosome/`, `ring/` | ❌ Missing                | Medium   |
| **SNV Layer**       | `snv/`                 | ❌ Missing                | Medium   |
| **CNV Layer**       | `cnv/`                 | ❌ Missing                | Medium   |
| **Fusion Arcs**     | `fusion/`              | 🟡 Basic (in gene-fusion) | Enhance  |
| **LOH Layer**       | `loh/`                 | ❌ Missing                | Low      |
| **Legend**          | `legend/`              | ❌ Missing                | Low      |

### 5. **Hi-C Visualization** (`client/tracks/hic/`)

| Feature                 | PP Files      | Our Status | Priority |
| ----------------------- | ------------- | ---------- | -------- |
| **Genome View**         | `genome/`     | ❌ Missing | Medium   |
| **ChrPair View**        | `chrpair/`    | ❌ Missing | Medium   |
| **Detail View**         | `detail/`     | ❌ Missing | Medium   |
| **Horizontal Track**    | `horizontal/` | ❌ Missing | Low      |
| **Contact Matrix Grid** | `grid/`       | ❌ Missing | Medium   |
| **4-View Navigation**   | Full system   | ❌ Missing | Low      |

### 6. **MASS (Multimodal Analytics)** (`client/mass/`)

| Feature                | PP Files           | Our Status | Priority |
| ---------------------- | ------------------ | ---------- | -------- |
| **State Store**        | `store.ts`         | ❌ Missing | **HIGH** |
| **Charts Registry**    | `charts.js`        | ❌ Missing | **HIGH** |
| **Navigation**         | `nav.js`           | ❌ Missing | Medium   |
| **Groups/Cohorts**     | `groups.js` (35KB) | ❌ Missing | **HIGH** |
| **Session Management** | `sessionBtn.js`    | ❌ Missing | Low      |
| **About/Metadata**     | `about.ts`         | ❌ Missing | Low      |

### 7. **Supporting Infrastructure**

| Feature                | PP Location           | Our Status | Priority |
| ---------------------- | --------------------- | ---------- | -------- |
| **Filter System**      | `client/filter/`      | ❌ Missing | **HIGH** |
| **Term Settings**      | `client/termsetting/` | ❌ Missing | Medium   |
| **GDC Integration**    | `client/gdc/`         | ❌ Missing | Low      |
| **Reactive Framework** | `client/rx/`          | ❌ Missing | **HIGH** |
| **DOM Utilities**      | `client/dom/`         | 🟡 Basic   | Low      |

### 8. **Chat/AI Integration** (`client/plots/chat/`)

| Feature            | PP Files  | Our Status | Priority |
| ------------------ | --------- | ---------- | -------- |
| **Chat Component** | `chat.ts` | ❌ Missing | Low      |

---

## 🎯 Prioritized Implementation Plan

### 🔴 PRIORITY 1: Must Have for Interview (Impact on Email)

These directly address Xin Zhou's concerns:

#### 1. **Interactive Linked Lollipop (Enhance 03-lollipop-plot)**

- Add: Clicking mutation → filters sample table
- Add: Brush selection → highlights in connected view
- Add: Sunburst/breakdown panel (like PP's block.ds.sun1.js)
- Reference: `client/mds3/skewer.render.js`

#### 2. **Sample Table with Linked Selection**

- New component: Table showing samples with mutations
- Linked: Selection in table ↔ highlights on lollipop
- Reference: `client/mds3/sampletable.js`

#### 3. **State Management System**

- Implement simple event bus or Zustand-like store
- Show you understand reactive data flow
- Reference: `client/mass/store.ts`, `client/rx/`

#### 4. **Cohort Filter Panel**

- Dropdown for cancer type, mutation type
- Cascading filters that update visualizations
- Reference: `client/filter/`, `client/mass/groups.js`

### 🟡 PRIORITY 2: Strong Differentiators

#### 5. **Matrix/Oncoprint (Enhance 05-oncoprint)**

- Gene x Sample matrix with layered mutations
- Interactive: hover, click, sort by gene/sample
- Reference: `client/plots/matrix/` (use their patterns)

#### 6. **Genome Browser with Real Tracks**

- Add: BAM read visualization (even simplified)
- Add: BigWig signal track
- Reference: `client/src/block.tk.bigwig.js`

#### 7. **Mini Portal Workflow**

- Landing page → Dataset selector → Main view
- Shows you understand the product pattern
- Reference: GenomePaint, Survivorship Portal UX

### 🟢 PRIORITY 3: Nice to Have (If Time)

#### 8. **Disco/Circos Plot**

- Circular chromosome view
- Great for showing genome-wide mutations
- Reference: `client/plots/disco/`

#### 9. **Hi-C Contact Matrix**

- Simple matrix visualization
- Click to zoom pattern
- Reference: `client/tracks/hic/`

#### 10. **GSEA Running Sum Plot**

- Enrichment visualization
- Reference: `client/plots/gsea.js`

---

## 💡 Key Patterns to Learn from ProteinPaint

### Architecture Patterns

1. **Model-View-ViewModel (MVVM)**
   - See `client/plots/scatter/model/`, `view/`, `viewmodel/`
   - Separate data processing from rendering

2. **Adaptor Pattern**
   - `*.adaptor.js` files wrap track types
   - Consistent interface for different data sources

3. **Layered Rendering**
   - Base layer → data layer → interaction layer
   - See matrix: `cells.js` → `renderers.js` → `interactivity.js`

4. **Settings/Config Objects**
   - `*.config.js`, `Settings.ts` files
   - Centralized configuration

### D3 Patterns

1. **Enter-Update-Exit** with keyed data
2. **Scales with domains from data**
3. **Transitions on state changes**
4. **Clipping paths for bounded regions**

### Performance Patterns

1. **Canvas for large datasets** (single cell: 58KB file)
2. **Debounced rendering on zoom/pan**
3. **Virtual scrolling for long lists**
4. **Lazy loading of track data**

---

## 🛠️ Suggested Implementation Order

### Week of Dec 16-22

| Day     | Morning                      | Afternoon               | Evening               |
| ------- | ---------------------------- | ----------------------- | --------------------- |
| **Mon** | Enhance lollipop with brush  | Add event bus           | Sample table skeleton |
| **Tue** | Sample table ↔ lollipop link | Filter panel UI         | Filter → update viz   |
| **Wed** | Oncoprint matrix basics      | Oncoprint interactivity | Polish interactions   |
| **Thu** | Genome browser BigWig        | Genome browser BAM mock | Connect to filter     |
| **Fri** | Portal workflow shell        | README screenshots      | Deploy to Vercel      |
| **Sat** | Final polish                 | Email draft finalize    | Test all links        |
| **Sun** | **SEND EMAIL**               |                         |                       |

---

## 📁 Recommended New Files to Create

```
genomic-viz-platform/
├── src/                          # NEW: Main source
│   ├── components/
│   │   ├── LollipopPlot.js      # Enhanced version
│   │   ├── SampleTable.js       # NEW
│   │   ├── FilterPanel.js       # NEW
│   │   ├── Oncoprint.js         # Enhanced version
│   │   └── LinkedViews.js       # NEW: Container
│   ├── stores/
│   │   ├── eventBus.js          # NEW
│   │   └── cohortStore.js       # NEW
│   ├── utils/
│   │   └── dataTransforms.js    # NEW
│   └── App.js                   # NEW: Main app
├── demos/
│   ├── linked-views/            # NEW: Demo page
│   ├── portal-workflow/         # NEW: Demo page
│   └── genome-browser/          # Enhanced
└── data/
    ├── tp53_mutations.json      # Existing
    ├── sample_cohort.json       # NEW
    └── gene_expression.json     # NEW or enhance
```

---

## 🔗 Key ProteinPaint Files to Study

1. **Skewer/Lollipop:** `client/mds3/skewer.render.js` (30KB)
2. **Matrix Layout:** `client/plots/matrix/matrix.layout.js` (23KB)
3. **Filter System:** `client/filter/` directory
4. **State Store:** `client/mass/store.ts` (20KB)
5. **Block Browser:** `client/src/block.js` (143KB) - complex but instructive
6. **Survival:** `client/plots/survival/survival.ts` (42KB)

---

## ✅ Success Criteria for Email

Before sending, the repo should demonstrate:

- [ ] **Linked views** — User can interact with one viz and see updates in another
- [ ] **Filter → visualization** — Dropdown changes → chart updates
- [ ] **Event-driven architecture** — Not hardcoded connections
- [ ] **Clean separation** — Components, data, state are modular
- [ ] **Modern tooling** — Vite, ES modules, clean build
- [ ] **README with screenshots** — Clear what you built
- [ ] **Live demo** (optional but strong) — Vercel/Netlify link

---

_Analysis based on stjude/proteinpaint repository (master branch, December 2025)_
