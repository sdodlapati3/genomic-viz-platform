# St. Jude Genomic Visualization Projects - Tech Stack Reference

## Quick Reference Table

| Project                 | Year | Primary Tech   | Visualization       | Data Formats     | Unique Features      |
| ----------------------- | ---- | -------------- | ------------------- | ---------------- | -------------------- |
| **ProteinPaint**        | 2016 | D3.js, Node.js | Lollipop, Matrix    | VCF, MAF, JSON   | Protein mutation viz |
| **GenomePaint**         | 2021 | D3.js, Node.js | Multi-track browser | BAM, BigWig, BED | Track stacking       |
| **ppBAM**               | 2023 | D3.js, Rust    | Read alignment      | BAM, CRAM        | Single-base reads    |
| **Survivorship Portal** | 2024 | D3.js, R       | Survival curves     | Clinical data    | KM/Cox analysis      |
| **ppHiC**               | 2024 | D3.js          | Hi-C heatmaps       | .hic files       | Chromatin contacts   |
| **MB Portal**           | 2025 | Full stack     | Multi-analysis      | Multi-omic       | Meta-analysis        |

---

## Detailed Technology Breakdown

### ProteinPaint Core

```
Frontend:          D3.js 7.x, TypeScript
Backend:           Node.js, Express 4.x
Database:          SQLite (better-sqlite3)
Caching:           Redis
Performance:       Rust binaries (19 tools)
Export:            jsPDF, svg2pdf.js, Puppeteer
3D Support:        Three.js
Maps:              OpenLayers
WSI Viewing:       OpenSeadragon
```

### Backend Dependencies

```json
{
  "express": "4.17.1",
  "better-sqlite3": "12.4.1",
  "redis": "4.7.0",
  "canvas": "3.2.0",
  "jsonwebtoken": "9.0.2",
  "multer": "1.4.5-lts.1",
  "compression": "1.7.4",
  "cookie-parser": "1.4.6"
}
```

### Frontend Dependencies

```json
{
  "d3": "7.6.1",
  "three": "0.152.2",
  "openseadragon": "4.1.1",
  "ol": "10.0.0",
  "jspdf": "2.5.2",
  "svg2pdf.js": "2.3.0",
  "highlight.js": "11.11.1",
  "html-to-image": "1.11.11"
}
```

### Rust Performance Tools

| Binary       | Purpose                 | Key Crates      |
| ------------ | ----------------------- | --------------- |
| `align`      | Sequence alignment      | bio             |
| `cluster`    | Hierarchical clustering | rayon           |
| `DEanalysis` | Differential expression | statrs          |
| `fisher`     | Statistical tests       | fishers_exact   |
| `bigwig`     | Signal processing       | bigtools        |
| `readHDF5`   | HDF5 parsing            | hdf5-metno      |
| `aichatbot`  | AI integration          | rig-core, tokio |

---

## File Format Support

### Genomic Files

| Format | Reader   | Indexing | Notes                 |
| ------ | -------- | -------- | --------------------- |
| BAM    | samtools | .bai     | Read alignments       |
| CRAM   | samtools | .crai    | Compressed alignments |
| VCF    | tabix    | .tbi     | Variant calls         |
| MAF    | custom   | none     | Mutation annotation   |
| BigWig | Rust     | built-in | Signal tracks         |
| BigBed | Rust     | built-in | Interval tracks       |
| HDF5   | Rust     | none     | Matrix data           |
| Hi-C   | Juicer   | built-in | Contact matrices      |

### Clinical/Annotation Files

| Format  | Purpose             | Parser         |
| ------- | ------------------- | -------------- |
| JSON    | Config, annotations | Native         |
| SQLite  | Term database       | better-sqlite3 |
| TSV/CSV | Tabular data        | Custom         |
| GFF/GTF | Gene models         | Custom         |

---

## API Architecture

### RESTful Endpoints Pattern

```
POST /termdb.boxplot      → Boxplot data
POST /termdb.violin       → Violin plot data
POST /termdb.cluster      → Clustering results
POST /termdb.DE           → Differential expression
POST /termdb.survival     → Survival analysis
POST /gdc.maf             → GDC MAF data
POST /gdc.grin2.run       → GRIN2 analysis
```

### Request/Response Pattern

```typescript
// Type definitions in shared/types/src/
interface BoxplotRequest {
  genome: string;
  dslabel: string;
  termid: string;
  filter?: FilterNode;
}

interface BoxplotResponse {
  plots: BoxplotData[];
  stats: Statistics;
}
```

---

## Visualization Component Patterns

### Standard Component API

```javascript
// Every plot follows this pattern
const plot = {
  type: 'plotType',

  // Configuration
  opts: { holder, genome, data },

  // DOM references
  dom: {
    svg: null,
    mainG: null,
    axes: {},
  },

  // Methods
  render: (data) => {},
  update: (newOpts) => {},
  destroy: () => {},
};
```

### D3.js Rendering Pattern

```javascript
// Data binding pattern used throughout
function render(self, data) {
  const items = self.dom.mainG.selectAll('.item').data(data, (d) => d.id);

  // Enter
  items.enter().append('g').attr('class', 'item').call(initItem);

  // Update
  items.call(updateItem);

  // Exit
  items.exit().remove();
}
```

---

## Integration Examples

### Embed in External Site

```html
<script src="https://proteinpaint.stjude.org/bin/proteinpaint.js"></script>
<script>
  runproteinpaint({
    host: 'https://proteinpaint.stjude.org',
    holder: document.getElementById('viz'),

    // Lollipop plot
    gene: 'TP53',
    genome: 'hg38',
  });
</script>
```

### Custom Dataset

```javascript
runproteinpaint({
  holder: document.getElementById('viz'),
  genome: 'hg38',

  // Custom VCF track
  tracks: [
    {
      type: 'vcf',
      name: 'My Mutations',
      url: 'https://example.com/mutations.vcf.gz',
    },
  ],
});
```

### GDC Integration

```javascript
// Launch GDC analysis
import { launchGdcMaf } from '@sjcrh/proteinpaint-client';

launchGdcMaf({
  holder: document.getElementById('viz'),
  genome: 'hg38',
  gdcCohort: {
    case_set_id: 'your-case-set-id',
  },
});
```

---

## Performance Optimizations

### Client-Side

- **Canvas fallback** for large datasets (>10K points)
- **Virtual scrolling** for long lists
- **Debounced rendering** during zoom/pan
- **Web Workers** for heavy computation

### Server-Side

- **Redis caching** for repeated queries
- **Rust binaries** for CPU-intensive tasks
- **Streaming responses** for large files
- **Query optimization** with SQLite indexes

### Data Loading

- **Lazy loading** for genome browser tracks
- **Region-based queries** for BAM/VCF
- **Precomputed statistics** in SQLite
- **CDN delivery** for static assets

---

## Deployment Architecture

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │ Node.js │        │ Node.js │        │ Node.js │
    │ Server  │        │ Server  │        │ Server  │
    └────┬────┘        └────┬────┘        └────┬────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
         │  Redis  │   │ SQLite  │   │  Files  │
         │  Cache  │   │   DBs   │   │  (BAM,  │
         └─────────┘   └─────────┘   │  VCF)   │
                                     └─────────┘
```

---

## Key Learnings for Tutorial Development

1. **D3.js is universal** - Every visualization uses D3
2. **SVG first, Canvas for performance** - Hybrid approach
3. **Modular architecture** - Self-contained components
4. **Type safety matters** - TypeScript for shared types
5. **Rust for heavy lifting** - CPU tasks offloaded
6. **Real file formats** - BAM, VCF, MAF are standards
7. **SQLite works** - Even at scale with good indexing
8. **Caching is essential** - Redis for performance

---

_Reference document for genomic visualization platform development_
