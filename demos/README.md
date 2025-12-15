# Genomic Visualization Demos

Interactive demonstrations of genomic visualization components inspired by [ProteinPaint](https://proteinpaint.stjude.org/).

## 🎯 Demo Applications

### 1. Linked Portal (Port 5180)
**Multi-panel dashboard with coordinated views**

![Linked Portal](./screenshots/linked-portal.png)

Features:
- **LollipopPlot**: Protein domain visualization with mutation lollipops
- **SampleTable**: Interactive sample listing with sorting and selection
- **FilterPanel**: Dynamic filtering by disease, stage, consequence type
- **MutationSummary**: Aggregated statistics and distribution charts
- **EventBus**: Pub/sub architecture for cross-component communication
- **CohortStore**: Centralized state management for sample cohorts
- **Zoom/Pan**: Interactive navigation with mini-map

```bash
cd demos/linked-portal
npm install
npm run dev
# Open http://localhost:5180
```

---

### 2. Oncoprint Matrix (Port 5181)
**Gene × Sample mutation matrix visualization**

![Oncoprint](./screenshots/oncoprint.png)

Features:
- **Layered Mutations**: Multiple mutations per cell with priority rendering
- **Color Coding**: Distinct colors for mutation types (missense, truncating, etc.)
- **Sorting**: By mutation frequency, gene name, or sample ID
- **Hover Tooltips**: Detailed mutation information on hover
- **Click Selection**: Select genes/samples for downstream analysis
- **Frequency Bars**: Right-side frequency indicator for each gene

```bash
cd demos/oncoprint
npm install
npm run dev
# Open http://localhost:5181
```

---

### 3. Genome Browser (Port 5182)
**Track-based genomic data visualization**

![Genome Browser](./screenshots/genome-browser.png)

Features:
- **Gene Track**: Gene models with exons, introns, and strand direction
- **Mutation Track**: Lollipop-style mutation markers
- **Signal Track**: Coverage/expression data as area charts
- **Navigation**: Zoom slider and pan controls
- **Coordinate Display**: Genomic position indicator
- **Tooltips**: Feature details on hover

```bash
cd demos/genome-browser
npm install
npm run dev
# Open http://localhost:5182
```

---

### 4. Dataset Selector (Port 5183)
**Landing page for dataset and view selection**

![Dataset Selector](./screenshots/dataset-selector.png)

Features:
- **Dataset Cards**: Visual cards for available datasets
- **Disease Filter**: Filter datasets by disease type
- **View Selector**: Choose visualization type (Lollipop, Oncoprint, Browser)
- **Sample/Mutation Counts**: Key statistics displayed
- **Navigation Flow**: Dataset → View → Visualization

```bash
cd demos/dataset-selector
npm install
npm run dev
# Open http://localhost:5183
```

---

## 🏗️ Architecture

### Component Communication
```
┌─────────────────────────────────────────────────────────────┐
│                        EventBus                              │
│   (Pub/Sub for decoupled component communication)           │
└────────────────────┬────────────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
     ▼               ▼               ▼
┌─────────┐    ┌──────────┐    ┌──────────────┐
│ Filters │───▶│CohortStore│◀───│ Visualizations│
└─────────┘    └──────────┘    └──────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  Shared State  │
            │ (selectedIds,  │
            │  filters, etc) │
            └────────────────┘
```

### Track System (Genome Browser)
```typescript
interface Track {
  render(ctx: RenderContext): void;
  setViewRange(start: number, end: number): void;
  getData(): TrackData;
}

// Implementations
class GeneTrack implements Track { ... }
class MutationTrack implements Track { ... }
class SignalTrack implements Track { ... }
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite 5.x |
| **Language** | TypeScript 5.x |
| **Visualization** | D3.js v7 |
| **State Management** | Custom EventBus + Store pattern |
| **Styling** | CSS3 with CSS Variables |

---

## 📁 Project Structure

```
demos/
├── linked-portal/          # Multi-panel dashboard
│   ├── src/
│   │   ├── components/     # LollipopPlot, SampleTable, etc.
│   │   ├── stores/         # CohortStore, EventBus
│   │   └── main.ts
│   └── package.json
│
├── oncoprint/              # Gene×Sample matrix
│   ├── src/
│   │   ├── Oncoprint.ts    # Main visualization
│   │   ├── Legend.ts       # Mutation type legend
│   │   ├── types.ts        # TypeScript interfaces
│   │   └── data.ts         # Data generation
│   └── package.json
│
├── genome-browser/         # Track-based browser
│   ├── src/
│   │   ├── GenomeBrowser.ts
│   │   ├── GeneTrack.ts
│   │   ├── MutationTrack.ts
│   │   ├── SignalTrack.ts
│   │   └── types.ts
│   └── package.json
│
└── dataset-selector/       # Landing page
    ├── src/
    │   ├── AppController.ts
    │   ├── DatasetCard.ts
    │   ├── ViewSelector.ts
    │   └── types.ts
    └── package.json
```

---

## 🚀 Running All Demos

```bash
# Install dependencies for all demos
for dir in linked-portal oncoprint genome-browser dataset-selector; do
  (cd demos/$dir && npm install)
done

# Run individual demos
cd demos/linked-portal && npm run dev      # Port 5180
cd demos/oncoprint && npm run dev          # Port 5181
cd demos/genome-browser && npm run dev     # Port 5182
cd demos/dataset-selector && npm run dev   # Port 5183
```

---

## 🔗 ProteinPaint Feature Alignment

| ProteinPaint Feature | Demo Implementation | Status |
|---------------------|---------------------|--------|
| Lollipop Plot | linked-portal/LollipopPlot | ✅ Complete |
| Mutation Matrix (Oncoprint) | oncoprint/ | ✅ Complete |
| Genome Browser | genome-browser/ | ✅ Complete |
| Sample Table | linked-portal/SampleTable | ✅ Complete |
| Filter Controls | linked-portal/FilterPanel | ✅ Complete |
| Dataset Selector | dataset-selector/ | ✅ Complete |
| Disco/Circos Plot | - | 🔲 Planned |
| GSEA Visualization | - | 🔲 Planned |
| Hi-C Contact Matrix | - | 🔲 Planned |

---

## 📖 Learning Resources

These demos are designed as learning exercises. See the [tutorials](../tutorials/) folder for step-by-step guides:

1. **Phase 1**: SVG/Canvas basics, D3.js fundamentals
2. **Phase 2**: REST APIs, PostgreSQL, file parsing
3. **Phase 3**: Advanced visualizations (scatter, heatmap, survival curves)
4. **Phase 4**: Production deployment

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details.
