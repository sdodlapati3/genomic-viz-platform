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
- **View Selector**: Choose visualization type (Lollipop, Oncoprint, Browser, Disco)
- **Sample/Mutation Counts**: Key statistics displayed
- **Navigation Flow**: Dataset → View → Visualization

```bash
cd demos/dataset-selector
npm install
npm run dev
# Open http://localhost:5183
```

---

### 5. Disco/Circos Plot (Port 5184)

**Circular genome visualization**

![Disco Plot](./screenshots/disco-circos.png)

Features:

- **Chromosome Ring**: Outer ring with proportionally-sized chromosomes
- **SNV Ring**: Mutation marks colored by class (missense, nonsense, etc.)
- **CNV Ring**: Copy number variations as colored arcs (gain/loss)
- **Fusion Chords**: Bezier curves connecting structural variant breakpoints
- **Sample Switching**: Toggle between different sample datasets
- **Interactive Tooltips**: Hover details for all elements
- **Adjustable Radius**: Scale the plot dynamically

```bash
cd demos/disco-circos
npm install
npm run dev
# Open http://localhost:5184
```

---

### 6. GSEA Running Sum Plot (Port 5185)

**Gene Set Enrichment Analysis visualization**

![GSEA Plot](./screenshots/gsea-plot.png)

Features:

- **Running ES Curve**: Enrichment score progression along ranked gene list
- **Gene Barcode**: Vertical ticks marking gene set positions
- **Ranked Metric Distribution**: Bottom plot showing ranking metric values
- **Sample Switching**: Multiple gene set examples
- **Statistics Panel**: ES, NES, p-value, FDR displayed
- **Interactive Tooltips**: Gene details on hover

```bash
cd demos/gsea-plot
npm install
npm run dev
# Open http://localhost:5185
```

---

### 7. Hi-C Contact Matrix (Port 5186)

**Chromatin interaction heatmap visualization**

![Hi-C Matrix](./screenshots/hic-matrix.png)

Features:

- **Contact Frequency Heatmap**: Symmetric matrix showing interaction strength
- **Color Scale Options**: Red, Blue, and Viridis color maps
- **Region Selection**: Multiple genomic regions to explore
- **Resolution Control**: Adjustable bin resolution
- **Interactive Tooltips**: Contact frequency values on hover
- **Coordinate Labels**: Genomic positions in Mb

```bash
cd demos/hic-matrix
npm install
npm run dev
# Open http://localhost:5186
```

---

### 8. Bar Chart (Port 5187)

**Categorical data comparison for genomics**

![Bar Chart](./screenshots/bar-chart.png)

Features:

- **Multiple Chart Types**: Simple, grouped, and stacked bar charts
- **Orientation**: Vertical or horizontal layouts
- **Sorting Options**: By value (ascending/descending), alphabetical, or original order
- **Interactive Legend**: Click to toggle group visibility
- **Genomic Datasets**: Mutation types by cancer, gene frequency, sample counts
- **Animated Transitions**: Smooth updates when switching data or options

```bash
cd demos/bar-chart
npm install
npm run dev
# Open http://localhost:5187
```

---

### 9. Violin Plot (Port 5188)

**Distribution visualization for gene expression and genomic data**

![Violin Plot](./screenshots/violin-plot.png)

Features:

- **Kernel Density Estimation**: Smooth distribution visualization
- **Box Plot Overlay**: Optional quartile and median display
- **Individual Points**: Show jittered data points
- **Bandwidth Control**: Adjust smoothing parameter
- **Group Statistics**: Mean, median, std dev for each group
- **Multiple Datasets**: Gene expression, mutation burden, survival time

```bash
cd demos/violin-plot
npm install
npm run dev
# Open http://localhost:5188
```

---

### 10. Box Plot (Port 5189)

**Statistical summary visualization**

![Box Plot](./screenshots/box-plot.png)

Features:

- **Quartile Boxes**: Q1-Q3 range with median line
- **Whiskers**: 1.5×IQR range indicators
- **Outlier Detection**: Points beyond whiskers shown individually
- **Notched Option**: Confidence interval for median comparison
- **Mean Marker**: Diamond marker for group mean
- **Orientation**: Vertical or horizontal layouts
- **Multiple Datasets**: Expression by subtype, TMB by cancer, age by stage

```bash
cd demos/box-plot
npm install
npm run dev
# Open http://localhost:5189
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

| Layer                | Technology                      |
| -------------------- | ------------------------------- |
| **Build**            | Vite 5.x                        |
| **Language**         | TypeScript 5.x                  |
| **Visualization**    | D3.js v7                        |
| **State Management** | Custom EventBus + Store pattern |
| **Styling**          | CSS3 with CSS Variables         |

---

## 📁 Project Structure

```
demos/
├── linked-portal/          # Multi-panel dashboard (Port 5180)
│   ├── src/
│   │   ├── components/     # LollipopPlot, SampleTable, etc.
│   │   ├── stores/         # CohortStore, EventBus
│   │   └── main.ts
│   └── package.json
│
├── oncoprint/              # Gene×Sample matrix (Port 5181)
│   ├── src/
│   │   ├── Oncoprint.ts    # Main visualization
│   │   ├── Legend.ts       # Mutation type legend
│   │   └── data.ts         # Data generation
│   └── package.json
│
├── genome-browser/         # Track-based browser (Port 5182)
│   ├── src/
│   │   ├── GenomeBrowser.ts
│   │   ├── GeneTrack.ts
│   │   ├── MutationTrack.ts
│   │   └── SignalTrack.ts
│   └── package.json
│
├── dataset-selector/       # Landing page (Port 5183)
│   ├── src/
│   │   ├── AppController.ts
│   │   ├── DatasetCard.ts
│   │   └── ViewSelector.ts
│   └── package.json
│
├── disco-circos/           # Circular genome plot (Port 5184)
│   ├── src/
│   │   ├── components/     # DiscoDiagram
│   │   ├── core/           # Reference, ArcMappers
│   │   └── data/           # Sample datasets
│   └── package.json
│
├── gsea-plot/              # GSEA running sum (Port 5185)
│   ├── src/
│   │   ├── components/     # GseaPlot
│   │   └── data/           # Gene set data
│   └── package.json
│
├── hic-matrix/             # Hi-C contact matrix (Port 5186)
│   ├── src/
│   │   ├── components/     # HicMatrix
│   │   └── data/           # Contact data
│   └── package.json
│
├── bar-chart/              # Bar chart (Port 5187)
│   ├── src/
│   │   ├── components/     # BarChart
│   │   └── data/           # Datasets
│   └── package.json
│
├── violin-plot/            # Violin plot (Port 5188)
│   ├── src/
│   │   ├── components/     # ViolinPlot
│   │   └── data/           # Datasets
│   └── package.json
│
├── box-plot/               # Box plot (Port 5189)
│   ├── src/
│   │   ├── components/     # BoxPlot
│   │   └── data/           # Datasets
│   └── package.json
│
└── screenshots/            # Demo screenshots
```

---

## 🚀 Running All Demos

```bash
# Install dependencies for all demos
for dir in linked-portal oncoprint genome-browser dataset-selector disco-circos gsea-plot hic-matrix bar-chart violin-plot box-plot; do
  (cd demos/$dir && npm install)
done

# Run individual demos
cd demos/linked-portal && npm run dev      # Port 5180
cd demos/oncoprint && npm run dev          # Port 5181
cd demos/genome-browser && npm run dev     # Port 5182
cd demos/dataset-selector && npm run dev   # Port 5183
cd demos/disco-circos && npm run dev       # Port 5184
cd demos/gsea-plot && npm run dev          # Port 5185
cd demos/hic-matrix && npm run dev         # Port 5186
cd demos/bar-chart && npm run dev          # Port 5187
cd demos/violin-plot && npm run dev        # Port 5188
cd demos/box-plot && npm run dev           # Port 5189
```

---

## 🔗 ProteinPaint Feature Alignment

| ProteinPaint Feature        | Demo Implementation        | Port | Status      |
| --------------------------- | -------------------------- | ---- | ----------- |
| Lollipop Plot               | linked-portal/LollipopPlot | 5180 | ✅ Complete |
| Mutation Matrix (Oncoprint) | oncoprint/                 | 5181 | ✅ Complete |
| Genome Browser              | genome-browser/            | 5182 | ✅ Complete |
| Sample Table                | linked-portal/SampleTable  | 5180 | ✅ Complete |
| Filter Controls             | linked-portal/FilterPanel  | 5180 | ✅ Complete |
| Dataset Selector            | dataset-selector/          | 5183 | ✅ Complete |
| Disco/Circos Plot           | disco-circos/              | 5184 | ✅ Complete |
| GSEA Visualization          | gsea-plot/                 | 5185 | ✅ Complete |
| Hi-C Contact Matrix         | hic-matrix/                | 5186 | ✅ Complete |
| Bar Chart                   | bar-chart/                 | 5187 | ✅ Complete |
| Violin Plot                 | violin-plot/               | 5188 | ✅ Complete |
| Box Plot                    | box-plot/                  | 5189 | ✅ Complete |

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
