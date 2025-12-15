# St. Jude ProteinPaint Ecosystem Analysis

## Overview

This document provides a comprehensive analysis of St. Jude Children's Research Hospital's genomic visualization platform, ProteinPaint, and its related projects. This analysis is based on examining the actual source code in the [stjude/proteinpaint](https://github.com/stjude/proteinpaint) GitHub repository.

---

## 1. ProteinPaint Monorepo Structure

**Version:** 2.167.0  
**Repository:** https://github.com/stjude/proteinpaint  
**License:** Custom St. Jude License

### Workspace Architecture

```
proteinpaint/
├── client/           # Frontend visualization library
├── server/           # Node.js backend API
├── rust/             # High-performance Rust binaries
├── python/           # Python integration
├── R/                # R statistical integration
├── shared/           # Shared types and utilities
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Common utilities
├── container/        # Docker configurations
│   ├── server/       # Server-only container
│   └── full/         # Full stack container
├── front/            # Frontend entry points
├── augen/            # Code generation tools
├── build/            # Build scripts
├── test/             # Integration tests
└── utils/            # Development utilities
```

---

## 2. Technology Stack

### Frontend (client/)

| Technology        | Version | Purpose                             |
| ----------------- | ------- | ----------------------------------- |
| **D3.js**         | 7.6.1   | Core data visualization             |
| **TypeScript**    | 5.6.3   | Type safety                         |
| **esbuild**       | -       | Bundle building                     |
| **Three.js**      | 0.152.2 | 3D visualizations                   |
| **OpenSeadragon** | 4.1.1   | High-resolution image viewing (WSI) |
| **OpenLayers**    | 10.0.0  | Map-based visualizations            |
| **Puppeteer**     | 24.2.1  | Server-side rendering, PDF export   |
| **jsPDF**         | 2.5.2   | PDF generation                      |
| **svg2pdf.js**    | 2.3.0   | SVG to PDF conversion               |
| **html-to-image** | 1.11.11 | Image export                        |
| **highlight.js**  | 11.11.1 | Code syntax highlighting            |
| **partjson**      | -       | JSON manipulation                   |

### Backend (server/)

| Technology         | Version | Purpose                     |
| ------------------ | ------- | --------------------------- |
| **Express.js**     | 4.17.1  | HTTP server framework       |
| **Node.js**        | ≥16     | Runtime environment         |
| **better-sqlite3** | 12.4.1  | SQLite database             |
| **Redis**          | 4.7.0   | Caching layer               |
| **canvas**         | 3.2.0   | Server-side image rendering |
| **got/ky**         | -       | HTTP clients                |
| **jsonwebtoken**   | 9.0.2   | Authentication              |
| **multer**         | 1.4.5   | File uploads                |
| **compression**    | -       | Response compression        |

### High-Performance Computing (rust/)

| Crate                | Purpose                   |
| -------------------- | ------------------------- |
| **rayon**            | Parallel processing       |
| **hdf5-metno**       | HDF5 file reading         |
| **bio**              | Bioinformatics algorithms |
| **bigtools**         | BigWig/BigBed parsing     |
| **rusqlite**         | SQLite integration        |
| **ndarray/nalgebra** | Numerical computing       |
| **statrs**           | Statistical functions     |
| **fishers_exact**    | Fisher's exact test       |
| **tokio/reqwest**    | Async HTTP                |
| **rig-core**         | AI chatbot integration    |

### 19 Rust Binaries

```
align           - Sequence alignment
indel           - Indel detection
fisher          - Fisher's exact test
bigwig          - BigWig file processing
sv              - Structural variant analysis
cluster         - Hierarchical clustering
gdcmaf          - GDC MAF processing
topGeneByExpressionVariance - Gene variance analysis
wilcoxon        - Wilcoxon statistical test
DEanalysis      - Differential expression
genesetORA      - Gene set overrepresentation
computeTopTerms - Term ranking
readHDF5        - HDF5 reading
validateHDF5    - HDF5 validation
gdcGRIN2        - GDC GRIN2 analysis
cerno           - CERNO statistical method
readH5          - H5 reading
aichatbot       - AI-powered chatbot
manhattan_plot  - Manhattan plot generation
```

---

## 3. Visualization Types (60+ Components)

### Core Charts (client/plots/)

| Category           | Visualizations                                             |
| ------------------ | ---------------------------------------------------------- |
| **Basic Charts**   | barchart, boxplot, violin, scatter, pie                    |
| **Genomic**        | lollipop (mutation), matrix (oncoplot), volcano, manhattan |
| **Survival**       | survival (Kaplan-Meier), cuminc (cumulative incidence)     |
| **Heatmaps**       | hierarchical clustering heatmap, expression heatmap        |
| **Statistical**    | regression, gsea, corrVolcano, diffAnalysis                |
| **Single-Cell**    | singleCellPlot, UMAP/tSNE visualizations                   |
| **Genome Browser** | multi-track browser, gene fusion viewer                    |
| **Specialized**    | disco (circos-like), brainImaging, wsiviewer               |
| **AI-Powered**     | chat interface, aiProjectAdmin                             |

### Track Types (client/src/)

| Track Type       | File                 | Purpose                      |
| ---------------- | -------------------- | ---------------------------- |
| **BAM**          | block.tk.bam.js      | Read alignment visualization |
| **BigWig**       | block.tk.bigwig.js   | Coverage/signal tracks       |
| **BED/BedGraph** | block.tk.bedj.js     | Genomic intervals            |
| **Hi-C**         | block.tk.hicstraw.ts | Chromatin interaction        |
| **Junction**     | block.tk.junction.js | Splice junctions             |
| **VCF**          | block.ds.vcf.js      | Variant data                 |
| **SV/CNV**       | block.mds.svcnv.js   | Structural variants, CNV     |
| **PGV**          | block.tk.pgv.js      | Protein/gene viewer          |

---

## 4. Supported Data File Formats

### Genomic Formats

| Format       | Extension     | Description                    |
| ------------ | ------------- | ------------------------------ |
| **BAM/CRAM** | .bam, .cram   | Aligned sequence reads         |
| **VCF**      | .vcf, .vcf.gz | Variant calls                  |
| **MAF**      | .maf          | Mutation Annotation Format     |
| **BED**      | .bed          | Genomic intervals              |
| **BigWig**   | .bw, .bigwig  | Signal/coverage tracks         |
| **BigBed**   | .bb, .bigbed  | Indexed BED                    |
| **HDF5**     | .h5, .hdf5    | High-dimensional data          |
| **Hi-C**     | .hic          | Chromatin interaction matrices |
| **GFF/GTF**  | .gff, .gtf    | Gene annotations               |
| **FASTA**    | .fa, .fasta   | Reference sequences            |

### Clinical/Analysis Formats

| Format      | Extension  | Description                |
| ----------- | ---------- | -------------------------- |
| **JSON**    | .json      | Configuration, annotations |
| **SQLite**  | .db        | Term database, sample data |
| **TSV/CSV** | .tsv, .csv | Tabular data               |

### Image Formats

| Format       | Extension | Description        |
| ------------ | --------- | ------------------ |
| **DeepZoom** | .dzi      | Whole slide images |
| **TIFF**     | .tiff     | Pathology images   |
| **SVS**      | .svs      | Aperio whole slide |

---

## 5. API Routes (server/routes/)

### Core Data APIs

```
/genomes          - Genome configuration
/genelookup       - Gene search
/gene2canonicalisoform - Canonical isoform lookup
/isoformlst       - Isoform listing
/pdomain          - Protein domains
/ntseq            - Nucleotide sequences
/snp              - SNP data
```

### Visualization APIs

```
/termdb.boxplot   - Boxplot data
/termdb.violin    - Violin plot data
/termdb.cluster   - Clustering analysis
/termdb.DE        - Differential expression
/termdb.survival  - Survival analysis
/termdb.sampleScatter - Scatter plot data
```

### GDC Integration APIs

```
/gdc.maf          - GDC MAF files
/gdc.mafBuild     - MAF file building
/gdc.grin2.list   - GRIN2 analysis list
/gdc.grin2.run    - GRIN2 analysis execution
```

### Advanced Analysis APIs

```
/genesetEnrichment      - GSEA analysis
/genesetOverrepresentation - ORA analysis
/correlationVolcano     - Correlation volcano
/brainImaging          - Brain imaging data
/hicdata               - Hi-C data
```

---

## 6. Key Features by Application

### ProteinPaint (Core - 2016)

- **Lollipop plots** for protein mutations
- **Gene-level mutation visualization**
- **Protein domain overlay**
- **Mutation class filtering**
- **Data export (SVG, PDF, PNG)**

### GenomePaint (Genome Browser - 2021)

- **Multi-track genome browser**
- **Custom track support**
- **Splice junction visualization**
- **Expression data overlay**
- **Structural variant arcs**

### ppBAM (BAM Viewer - 2023)

- **Single-base resolution reads**
- **Paired-end visualization**
- **Soft-clipping display**
- **Variant highlighting**
- **Coverage track**

### ppHiC (Hi-C Viewer - 2024)

- **Chromatin interaction matrices**
- **Multiple normalization methods**
- **TAD boundary visualization**
- **Integration with gene tracks**

### Survivorship Portal (2024)

- **Kaplan-Meier survival curves**
- **Cumulative incidence plots**
- **Cox regression analysis**
- **Multi-cohort comparison**

### NCI GDC Integration

- **Direct API access to GDC data**
- **MAF file processing**
- **BAM slice retrieval**
- **Case/sample browsing**
- **GRIN2 analysis (Genomic Random Interval analysis)**

---

## 7. Architecture Patterns

### State Management

```javascript
// App state pattern from client/src/app.js
const app = {
  opts: {}, // Configuration options
  tip: null, // Tooltip manager
  callbacks: {}, // Event callbacks
  cache: new Map(), // Data cache
};
```

### Component Pattern

```javascript
// Typical component structure
export function componentName(opts) {
  const self = {
    type: 'componentName',
    opts,
    dom: {},
    api: {},
  };

  // Initialize DOM
  self.dom.svg = opts.holder.append('svg');

  // Public API
  self.api = {
    update: (data) => render(self, data),
    destroy: () => cleanup(self),
  };

  return self.api;
}
```

### Server Route Pattern

```typescript
// Route definition pattern from server/routes/
export const api = {
  endpoint: 'termdb.boxplot',
  methods: {
    get: {
      request: { typeId: 'BoxplotRequest' },
      response: { typeId: 'BoxplotResponse' },
    },
    post: {
      request: { typeId: 'BoxplotRequest' },
      response: { typeId: 'BoxplotResponse' },
    },
  },
};
```

---

## 8. Database Schema (SQLite)

### Core Tables

```sql
-- Terms table for clinical variables
CREATE TABLE terms (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    parent_id TEXT
);

-- Sample annotations
CREATE TABLE annotations (
    sample_id TEXT,
    term_id TEXT,
    value TEXT
);

-- Precomputed statistics
CREATE TABLE precomputed (
    key TEXT PRIMARY KEY,
    value BLOB
);
```

---

## 9. Integration Points

### Embedding in External Applications

```html
<!-- Basic embedding -->
<script src="https://proteinpaint.stjude.org/bin/proteinpaint.js"></script>
<div id="container"></div>
<script>
  runproteinpaint({
    host: 'https://proteinpaint.stjude.org',
    holder: document.getElementById('container'),
    genome: 'hg38',
    gene: 'TP53',
  });
</script>
```

### Custom Dataset Configuration

```javascript
{
    genome: 'hg38',
    queries: [{
        name: 'My Dataset',
        type: 'mds3',
        vcf: {
            file: 'path/to/mutations.vcf.gz',
            indexURL: 'path/to/mutations.vcf.gz.tbi'
        }
    }]
}
```

---

## 10. Development Workflow

### Local Development

```bash
# Clone repository
git clone https://github.com/stjude/proteinpaint.git

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Docker Deployment

```bash
# Build container
docker build -t proteinpaint .

# Run with configuration
docker run -p 3000:3000 \
  -v /path/to/data:/data \
  -v /path/to/config:/config \
  proteinpaint
```

---

## 11. Relevance to Learning Platform

### Key Takeaways for Tutorial Development

1. **D3.js is Central**: All visualizations use D3.js v7
2. **SVG-First Approach**: Primary rendering is SVG with Canvas for performance
3. **Modular Components**: Each visualization is self-contained
4. **Type Safety**: TypeScript for shared types
5. **Performance**: Rust binaries for compute-intensive tasks
6. **Real Data Formats**: BAM, VCF, MAF, BigWig are production standards

### Tutorial Alignment

| Our Tutorial             | ProteinPaint Equivalent        |
| ------------------------ | ------------------------------ |
| Phase 1.1 SVG/Canvas     | client/src/block.\*.js         |
| Phase 1.2 D3 Core        | All client/plots/\*.js         |
| Phase 1.3 Lollipop       | client/plots/lollipop/\*       |
| Phase 1.4 Genome Browser | client/src/block.js            |
| Phase 2.1 REST API       | server/routes/\*.ts            |
| Phase 2.2 PostgreSQL     | SQLite patterns in server/src/ |
| Phase 2.3 File Parsing   | server/src/bam.js, vcf.\*.js   |
| Phase 3.1 Scatter        | client/plots/scatter/          |
| Phase 3.2 Heatmap        | client/plots/matrix/           |
| Phase 3.3 Survival       | client/plots/survival/         |
| Phase 3.4 Volcano        | client/plots/volcano/          |

---

## 12. Further Resources

- **Documentation**: https://docs.google.com/document/d/1ZnPZKSSajWyNISSLELMozKxrZHQbdxQkkkQFnxw6zTs/edit
- **GitHub**: https://github.com/stjude/proteinpaint
- **Demo**: https://proteinpaint.stjude.org
- **GDC Portal**: https://portal.gdc.cancer.gov (uses ProteinPaint)

---

_This analysis was generated by examining the stjude/proteinpaint repository structure, package.json files, and source code patterns._
