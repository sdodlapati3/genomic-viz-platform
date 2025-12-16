# 🔧 Linked Portal Implementation Plan

> **Objective:** Build a production-quality demo portal showcasing ProteinPaint-style linked visualizations
>
> **Timeline:** Dec 15-22, 2025
> **Target:** Evidence for follow-up email to Xin Zhou

---

## 📋 Executive Summary

### Current State

We have **tutorial code** demonstrating individual concepts:

- ✅ EventBus system (`tutorials/phase-4-production/08-linked-views/src/state/EventBus.ts`)
- ✅ Basic lollipop plot (`tutorials/phase-1-frontend/03-lollipop-plot/`)
- ✅ Sample table component (`tutorials/phase-4-production/08-linked-views/src/components/SampleTable.ts`)
- ✅ Mutation panel (`tutorials/phase-4-production/08-linked-views/src/components/MutationPanel.ts`)
- ✅ Sample data (`datasets/mutations/tp53_mutations.json`, `datasets/clinical/samples.json`)

### Gap Analysis

What's **missing** for a cohesive demo:

1. **Integrated Portal App** — Single page with all components working together
2. **Enhanced Lollipop with Brush Selection** — Interactive selection that links to other views
3. **Filter Panel** — UI for filtering by cancer type, mutation type, etc.
4. **Cohort Store** — Centralized state for filtered dataset
5. **Visual Polish** — Professional UI that demonstrates attention to detail

### Deliverables

| #   | Deliverable                      | Type        | Priority | Status      |
| --- | -------------------------------- | ----------- | -------- | ----------- |
| 1   | `demos/linked-portal/`           | New folder  | **P0**   | ✅ Complete |
| 2   | Event-driven lollipop with brush | Enhancement | **P0**   | ✅ Complete |
| 3   | Filter panel component           | New         | **P0**   | ✅ Complete |
| 4   | Cohort/filter store              | New         | **P0**   | ✅ Complete |
| 5   | Integrated portal app            | New         | **P0**   | ✅ Complete |
| 6   | Zoom/pan with mini-map           | Enhancement | **P0**   | ✅ Complete |
| 7   | MutationSummary component        | New         | **P0**   | ✅ Complete |
| 8   | Enhanced Oncoprint matrix        | New demo    | **P1**   | ✅ Complete |
| 9   | Genome Browser with tracks       | New demo    | **P1**   | ✅ Complete |
| 10  | Dataset selector/landing page    | New demo    | **P1**   | ✅ Complete |
| 11  | Documentation & README           | Docs        | **P1**   | ✅ Complete |
| 12  | Disco/Circos Plot                | New         | **P2**   | ✅ Complete |
| 13  | GSEA Running Sum Plot            | New         | **P2**   | ✅ Complete |
| 14  | Hi-C Contact Matrix              | New         | **P2**   | ✅ Complete |

---

## 🏗️ Architecture Design

### Application Structure

```
demos/linked-portal/
├── index.html              # Entry point
├── package.json            # Dependencies (vite, d3, typescript)
├── vite.config.ts          # Build configuration
├── tsconfig.json           # TypeScript config
├── public/
│   └── data/              # Static data files (copied from datasets/)
├── src/
│   ├── main.ts            # Application entry
│   ├── App.ts             # Main application component
│   ├── types/
│   │   ├── index.ts       # Type definitions
│   │   ├── mutations.ts   # Mutation types
│   │   ├── samples.ts     # Sample types
│   │   └── events.ts      # Event types
│   ├── state/
│   │   ├── EventBus.ts    # Event pub/sub (from 08-linked-views)
│   │   ├── CohortStore.ts # NEW: Filter state management
│   │   └── index.ts       # Exports
│   ├── components/
│   │   ├── LollipopPlot.ts    # Enhanced with brush selection
│   │   ├── SampleTable.ts     # Interactive sample list
│   │   ├── FilterPanel.ts     # NEW: Filter controls
│   │   ├── MutationSummary.ts # NEW: Stats panel
│   │   ├── Legend.ts          # NEW: Shared legend
│   │   └── index.ts           # Exports
│   ├── utils/
│   │   ├── dataLoader.ts  # Data fetching
│   │   ├── colors.ts      # Color schemes
│   │   └── scales.ts      # D3 scale utilities
│   └── styles/
│       ├── main.css       # Global styles
│       └── components.css # Component styles
└── README.md              # Demo documentation
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                             │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │ tp53_mutations   │  │ samples.json     │                     │
│  │ .json            │  │ (clinical)       │                     │
│  └────────┬─────────┘  └────────┬─────────┘                     │
│           │                     │                                │
│           └──────────┬──────────┘                                │
│                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    CohortStore                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │    │
│  │  │ rawMutations│  │ rawSamples  │  │ activeFilters   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │    │
│  │                           │                              │    │
│  │                           ▼                              │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │ Computed: filteredMutations, filteredSamples    │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────┬───────────────────────────────┘    │
│                            │                                     │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                      EventBus                            │    │
│  │  Events: filter:apply, selection:change, highlight:show  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                            │                                     │
│           ┌────────────────┼────────────────┐                   │
│           ▼                ▼                ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ LollipopPlot│  │ SampleTable │  │ FilterPanel │             │
│  │             │  │             │  │             │             │
│  │ - brush     │  │ - click     │  │ - dropdowns │             │
│  │ - hover     │  │ - hover     │  │ - sliders   │             │
│  │ - click     │  │ - sort      │  │ - checkboxes│             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Event Specification

| Event              | Payload                                                                     | Emitted By     | Consumed By                  |
| ------------------ | --------------------------------------------------------------------------- | -------------- | ---------------------------- | -------------- |
| `filter:apply`     | `{filters: FilterState, source: string}`                                    | FilterPanel    | CohortStore → All components |
| `filter:clear`     | `{source: string}`                                                          | FilterPanel    | CohortStore → All components |
| `selection:change` | `{sampleIds: string[], mutationIds: string[], source: string, type: 'click' | 'brush'}`      | LollipopPlot, SampleTable    | All components |
| `selection:clear`  | `{source: string}`                                                          | Any            | All components               |
| `highlight:show`   | `{sampleIds: string[], mutationIds: string[], source: string}`              | Any (hover)    | All components               |
| `highlight:hide`   | `{source: string}`                                                          | Any (mouseout) | All components               |
| `cohort:update`    | `{filteredSamples: Sample[], filteredMutations: Mutation[]}`                | CohortStore    | All components               |

---

## 📦 Component Specifications

### 1. CohortStore (NEW)

**Purpose:** Centralized state management for filtered cohort data

**Location:** `src/state/CohortStore.ts`

```typescript
interface FilterState {
  cancerTypes: string[]; // e.g., ['Glioblastoma', 'Lung adenocarcinoma']
  mutationTypes: string[]; // e.g., ['missense', 'nonsense']
  minMutationCount: number; // e.g., 5
  positionRange: [number, number]; // e.g., [100, 300]
  selectedGenes: string[]; // e.g., ['TP53']
}

interface CohortState {
  // Raw data
  allMutations: Mutation[];
  allSamples: Sample[];

  // Computed (derived from filters)
  filteredMutations: Mutation[];
  filteredSamples: Sample[];

  // Active filters
  filters: FilterState;

  // Selection state
  selectedSampleIds: Set<string>;
  selectedMutationIds: Set<string>;
}

class CohortStore {
  private state: CohortState;

  // Methods
  loadData(): Promise<void>;
  applyFilters(filters: Partial<FilterState>): void;
  clearFilters(): void;
  setSelection(sampleIds: string[], mutationIds: string[]): void;
  clearSelection(): void;

  // Getters
  getFilteredMutations(): Mutation[];
  getFilteredSamples(): Sample[];
  getFilterOptions(): FilterOptions; // Available values for dropdowns

  // Subscription
  subscribe(callback: (state: CohortState) => void): () => void;
}
```

**Implementation Details:**

- Initialize from `datasets/mutations/tp53_mutations.json` and `datasets/clinical/samples.json`
- Filter logic must handle multi-select (OR within category, AND across categories)
- Emit `cohort:update` event when filters change
- Emit `selection:change` event when selection changes

---

### 2. FilterPanel (NEW)

**Purpose:** UI controls for filtering the cohort

**Location:** `src/components/FilterPanel.ts`

**UI Mockup:**

```
┌─────────────────────────────────────────────┐
│  🔍 Filters                    [Clear All]  │
├─────────────────────────────────────────────┤
│  Cancer Type                                │
│  ┌─────────────────────────────────────┐   │
│  │ ☑ Glioblastoma (12)                 │   │
│  │ ☑ Lung adenocarcinoma (8)           │   │
│  │ ☐ Breast invasive carcinoma (5)     │   │
│  │ ☐ Colorectal adenocarcinoma (3)     │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  Mutation Type                              │
│  ┌─────────────────────────────────────┐   │
│  │ ☑ Missense (●)                      │   │
│  │ ☑ Nonsense (●)                      │   │
│  │ ☐ Frameshift (●)                    │   │
│  │ ☐ Splice (●)                        │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  Min. Mutation Count                        │
│  ──────●────────────── [5]                 │
├─────────────────────────────────────────────┤
│  Position Range                             │
│  [100] ─────────────── [300]               │
├─────────────────────────────────────────────┤
│  📊 Showing 156 mutations in 45 samples    │
└─────────────────────────────────────────────┘
```

**Features:**

- Dynamic options based on data
- Counts next to each option
- Real-time updates (debounced)
- Clear all button
- Summary stats at bottom

---

### 3. LollipopPlot (ENHANCED)

**Purpose:** Mutation lollipop visualization with brush selection

**Location:** `src/components/LollipopPlot.ts`

**Enhancements over existing:**

1. **Brush Selection** — D3 brush for selecting position range
2. **Linked Highlighting** — Respond to hover events from other components
3. **Click Selection** — Click mutation → emit selection event
4. **Zoom** — Mouse wheel zoom on position axis
5. **Responsive** — SVG viewBox for responsive sizing

**UI Mockup:**

```
┌─────────────────────────────────────────────────────────────────┐
│  TP53 Mutations (156 shown)                       [Reset Zoom] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│        ●                    ●●●        ●●    ●                 │
│        │                    │││        ││    │                 │
│  ──────┴────────────────────┴┴┴────────┴┴────┴────────────────│
│  │ TAD1 │TAD2│ PRD │    DNA-binding    │NLS│Tetra│  REG  │    │
│  1      42   63   92                   292 305  322  356  393  │
│                                                                 │
│  [============ brush selection area =============]             │
│                                                                 │
│  Legend: ● Missense  ● Nonsense  ● Frameshift  ● Splice       │
└─────────────────────────────────────────────────────────────────┘
```

**Event Interactions:**
| User Action | Event Emitted | Effect on Others |
|-------------|---------------|------------------|
| Brush drag | `selection:change` | SampleTable highlights rows |
| Click mutation | `selection:change` | SampleTable scrolls to samples |
| Hover mutation | `highlight:show` | SampleTable highlights rows |
| Mouseout | `highlight:hide` | SampleTable removes highlight |

---

### 4. SampleTable (ENHANCED)

**Purpose:** Interactive sample list with clinical data

**Location:** `src/components/SampleTable.ts`

**Enhancements:**

1. **Sortable Columns** — Click header to sort
2. **Virtual Scrolling** — For large datasets
3. **Row Selection** — Click to select, shift+click for range
4. **Linked Highlighting** — Respond to events from LollipopPlot
5. **Mutation Count Column** — Show mutations per sample

**UI Mockup:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Samples (45 shown)                              [Export CSV]  │
├─────────────────────────────────────────────────────────────────┤
│  Sample ID    │ Cancer Type      │ Mutations │ Stage │ Surv.  │
│  ──────────────────────────────────────────────────────────────│
│  TCGA-02-0001 │ Glioblastoma     │     3     │  IV   │  456   │
│  TCGA-02-0002 │ Glioblastoma     │     2     │  IV   │  234   │
│ >TCGA-02-0003 │ Glioblastoma     │     5     │  IV   │  890   │← highlighted
│  TCGA-02-0004 │ Lung adeno.      │     1     │ IIIA  │  567   │
│  TCGA-02-0005 │ Lung adeno.      │     4     │  IIA  │ 1234   │
│  ...                                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. MutationSummary (NEW)

**Purpose:** Statistics panel showing cohort summary

**Location:** `src/components/MutationSummary.ts`

**UI Mockup:**

```
┌─────────────────────────────────────────────┐
│  📊 Cohort Summary                          │
├─────────────────────────────────────────────┤
│  Total Samples: 45                          │
│  Total Mutations: 156                       │
│                                             │
│  Mutation Types:                            │
│  ████████████████░░░░ Missense (78, 50%)   │
│  ██████████░░░░░░░░░░ Nonsense (39, 25%)   │
│  ████░░░░░░░░░░░░░░░░ Frameshift (23, 15%) │
│  ██░░░░░░░░░░░░░░░░░░ Other (16, 10%)      │
│                                             │
│  Top Hotspots:                              │
│  R175H (42)  R248Q (38)  R273H (31)        │
└─────────────────────────────────────────────┘
```

---

### 6. Oncoprint Matrix (NEW - P1)

**Purpose:** Gene × Sample matrix showing mutation landscape across cohort

**Location:** `demos/oncoprint/` (new demo) or `src/components/Oncoprint.ts`

**Reference:** `client/plots/matrix/` in ProteinPaint (127KB interactivity!)

**UI Mockup:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Oncoprint Matrix                                    [Sort] [Export]   │
├─────────────────────────────────────────────────────────────────────────┤
│         Sample1  Sample2  Sample3  Sample4  Sample5  ...               │
│  TP53   ████████ ░░░░░░░░ ████████ ████████ ░░░░░░░░                   │
│  BRCA1  ░░░░░░░░ ████████ ░░░░░░░░ ████████ ████████                   │
│  KRAS   ████████ ████████ ░░░░░░░░ ░░░░░░░░ ████████                   │
│  EGFR   ░░░░░░░░ ░░░░░░░░ ████████ ░░░░░░░░ ░░░░░░░░                   │
│  ...                                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  Legend: ■ Missense  ■ Nonsense  ■ Frameshift  ■ Splice  □ No mutation │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**

- Interactive cells: hover shows mutation details, click selects
- Sortable rows (genes) and columns (samples) by mutation frequency
- Linked to other views via EventBus
- Multiple mutation types per cell (layered rendering)
- Row/column annotations (clinical data, gene function)

**Implementation Approach:**

1. Model: Gene × Sample matrix data structure
2. View: SVG/Canvas rendering with D3
3. Interactivity: Hover, click, sort, zoom
4. Integration: Connect to CohortStore and EventBus

---

### 7. Genome Browser with Tracks (NEW - P1)

**Purpose:** Interactive genome browser showing genomic features, variants, and read alignments

**Location:** `demos/genome-browser/` (enhance existing) or new component

**Reference:** `client/src/block.js` (142KB), `block.tk.*.js` in ProteinPaint

**UI Mockup:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Genome Browser                    chr17:7,668,402-7,687,550    [Zoom] │
├─────────────────────────────────────────────────────────────────────────┤
│  Genes    │ ←───────── TP53 ──────────→                                │
│           │ ═══╤═══╤═══════╤═══╤═══════                                │
├───────────┼─────────────────────────────────────────────────────────────┤
│  Mutations│     ●   ●●  ●      ●●●  ●                                  │
│           │     │   ││  │      │││  │                                  │
├───────────┼─────────────────────────────────────────────────────────────┤
│  BigWig   │  ▂▃▅▇█▇▅▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                                  │
│  (signal) │                                                             │
├───────────┼─────────────────────────────────────────────────────────────┤
│  BAM      │  ════════════════════                                       │
│  (reads)  │    ═══════════════════                                      │
│           │       ════════════════════                                  │
└───────────┴─────────────────────────────────────────────────────────────┘
```

**Features:**

- Coordinate navigation (jump to gene, region)
- Zoom/pan with smooth rendering
- Multiple track types:
  - Gene/transcript track
  - Mutation track (linked to lollipop)
  - Signal track (BigWig visualization)
  - Read alignment track (BAM - simplified)
- Linked selection with other views

**Implementation Approach:**

1. Track abstraction layer (base class for all track types)
2. Coordinate system with zoom transform
3. Data fetching layer (mock data initially)
4. Connect to existing linked portal via EventBus

---

### 8. Dataset Selector / Landing Page (NEW - P1)

**Purpose:** Entry point for portal showing available datasets and navigation

**Location:** `demos/linked-portal/src/pages/Landing.ts` or separate route

**Reference:** ProteinPaint's GenomePaint, Survivorship Portal patterns

**UI Mockup:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        🧬 Genomic Viz Platform                          │
│                     Explore Cancer Genomics Data                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ 📊 TP53 Cohort  │  │ 📊 Pan-Cancer   │  │ 📊 Custom Data  │         │
│  │                 │  │                 │  │                 │         │
│  │  156 mutations  │  │  1,234 samples  │  │  Upload VCF/MAF │         │
│  │  45 samples     │  │  5 cancer types │  │                 │         │
│  │                 │  │                 │  │                 │         │
│  │  [Explore →]    │  │  [Explore →]    │  │  [Upload →]     │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  Visualizations:  [Lollipop] [Oncoprint] [Genome Browser] [Survival]   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**

- Dataset cards with summary stats
- Quick navigation to visualizations
- File upload capability (future)
- Responsive design

---

## 🗓️ Implementation Schedule

### Day 1 (Dec 15): Foundation ✅ COMPLETE

| Time      | Task                                            | Status |
| --------- | ----------------------------------------------- | ------ |
| Morning   | Set up `demos/linked-portal/` project structure | ✅     |
| Morning   | Copy and adapt types from 08-linked-views       | ✅     |
| Afternoon | Implement CohortStore                           | ✅     |
| Afternoon | Copy and enhance EventBus                       | ✅     |
| Evening   | Create data loader utility                      | ✅     |
| Evening   | Build all 4 core components                     | ✅     |

**Deliverable:** ✅ Complete linked portal with LollipopPlot, SampleTable, FilterPanel, MutationSummary

### Day 2 (Dec 15-16): LollipopPlot Enhancement ✅ COMPLETE

| Time      | Task                              | Status |
| --------- | --------------------------------- | ------ |
| Morning   | Port lollipop code to TypeScript  | ✅     |
| Morning   | Add D3 brush for selection        | ✅     |
| Afternoon | Connect to EventBus (emit events) | ✅     |
| Afternoon | Respond to highlight events       | ✅     |
| Evening   | Add zoom/pan functionality        | ✅     |
| Evening   | Add mini-map navigation           | ✅     |

**Deliverable:** ✅ Lollipop with zoom, pan, brush, mini-map

### Day 3 (Dec 16): Oncoprint Matrix (P1)

| Time      | Task                                    | Files                        |
| --------- | --------------------------------------- | ---------------------------- |
| Morning   | Create Oncoprint data model             | demos/oncoprint/src/types.ts |
| Morning   | Build matrix layout with D3             | src/components/Oncoprint.ts  |
| Afternoon | Add cell rendering (layered mutations)  | Oncoprint.ts                 |
| Afternoon | Implement sorting (by gene/sample freq) | Oncoprint.ts                 |
| Evening   | Add hover/click interactivity           | Oncoprint.ts                 |
| Evening   | Connect to EventBus for linked views    | Oncoprint.ts                 |

**Deliverable:** Interactive Oncoprint with linked selection

### Day 4 (Dec 17): Genome Browser Enhancement (P1)

| Time      | Task                                | Files                       |
| --------- | ----------------------------------- | --------------------------- |
| Morning   | Create track abstraction base class | src/tracks/Track.ts         |
| Morning   | Implement gene/transcript track     | src/tracks/GeneTrack.ts     |
| Afternoon | Implement mutation track            | src/tracks/MutationTrack.ts |
| Afternoon | Add BigWig signal track (mock data) | src/tracks/SignalTrack.ts   |
| Evening   | Add coordinate navigation & zoom    | GenomeBrowser.ts            |
| Evening   | Connect to linked portal EventBus   | GenomeBrowser.ts            |

**Deliverable:** Genome browser with multiple track types

### Day 5 (Dec 18): Dataset Selector & Landing Page (P1)

| Time      | Task                           | Files                         |
| --------- | ------------------------------ | ----------------------------- |
| Morning   | Create landing page component  | src/pages/Landing.ts          |
| Morning   | Build dataset cards with stats | src/components/DatasetCard.ts |
| Afternoon | Add routing between views      | src/router.ts                 |
| Afternoon | Connect all demos to landing   | main.ts                       |
| Evening   | Polish UI and transitions      | styles/                       |
| Evening   | Responsive design testing      | Manual                        |

**Deliverable:** Complete portal workflow with landing page

### Day 6 (Dec 19): Deployment & Documentation (P1)

| Time      | Task                               | Files          |
| --------- | ---------------------------------- | -------------- |
| Morning   | Add loading states, error handling | All components |
| Morning   | Accessibility improvements         | All components |
| Afternoon | Write README with screenshots      | README.md      |
| Afternoon | Record GIF demo                    | docs/          |
| Evening   | Deploy to Vercel                   | vercel.json    |
| Evening   | Final testing on deployed version  | Manual         |

**Deliverable:** Polished, deployed demo on Vercel

### Day 7 (Dec 20): Buffer & Polish

| Time | Task                             |
| ---- | -------------------------------- |
| AM   | Final bug fixes                  |
| PM   | Additional P2 features (if time) |

### Day 8+ (Dec 21-22): P2 Features (If Time)

| Priority | Feature             | Description                       |
| -------- | ------------------- | --------------------------------- |
| P2       | Disco/Circos Plot   | Circular chromosome visualization |
| P2       | GSEA Plot           | Gene set enrichment visualization |
| P2       | Hi-C Contact Matrix | Chromatin interaction heatmap     |

---

## 🧪 Testing Strategy

### Unit Tests

- CohortStore filter logic
- EventBus subscription/emit
- Data transformation utilities

### Integration Tests

- Filter → Lollipop update
- Lollipop brush → Table highlight
- Table click → Lollipop highlight

### Manual Tests Checklist

- [ ] Filter by cancer type updates all views
- [ ] Brush selection on lollipop highlights table rows
- [ ] Click mutation shows sample details
- [ ] Hover mutation temporarily highlights related samples
- [ ] Clear filters resets everything
- [ ] Works on Chrome, Firefox, Safari
- [ ] Responsive on tablet/mobile

---

## 📊 Success Metrics

### Technical Metrics

| Metric                 | Target  |
| ---------------------- | ------- |
| Lighthouse Performance | > 90    |
| Bundle size (gzipped)  | < 100KB |
| Time to interactive    | < 2s    |
| No console errors      | 0       |

### Demonstration Metrics

| Feature                          | Demonstrated |
| -------------------------------- | ------------ |
| Linked views (brush → highlight) | ✓            |
| Event-driven architecture        | ✓            |
| Filter → visualization updates   | ✓            |
| TypeScript + modern tooling      | ✓            |
| D3.js proficiency                | ✓            |
| Professional UI polish           | ✓            |

---

## 🔗 References

### ProteinPaint Source Files (to study)

1. `client/mds3/skewer.render.js` — Lollipop rendering patterns
2. `client/mass/store.ts` — State management approach
3. `client/filter/` — Filter UI patterns
4. `client/plots/matrix/matrix.interactivity.js` — Interaction patterns
5. `client/rx/Bus.ts` — Event bus implementation

### Existing Code to Reuse

1. `tutorials/phase-4-production/08-linked-views/src/state/EventBus.ts`
2. `tutorials/phase-4-production/08-linked-views/src/types/`
3. `tutorials/phase-1-frontend/03-lollipop-plot/src/` — Lollipop logic
4. `datasets/` — All data files

---

## ✅ Checklist Before Starting

- [x] Read existing EventBus implementation
- [x] Review lollipop tutorial code
- [x] Understand data schema
- [x] Plan component architecture
- [x] Define event contracts
- [ ] **START IMPLEMENTATION**

---

## 🌀 P2 Feature: Disco/Circos Plot

### Overview

A circular genome visualization showing:

- **Chromosome arcs** arranged in a circle
- **Mutation tracks** (SNV/indel as marks on inner rings)
- **CNV tracks** (copy number as colored arcs)
- **Fusion/SV chords** (structural variants as connecting arcs between chromosomes)

### Architecture (based on ProteinPaint patterns)

```
demos/disco-circos/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   └── data/
│       ├── genome.json        # Chromosome sizes
│       └── sample_data.json   # SNVs, CNVs, fusions
├── src/
│   ├── main.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── Arc.ts             # Base arc interface
│   │   ├── Chromosome.ts      # Chromosome with angles
│   │   ├── Mutation.ts        # SNV/indel data
│   │   ├── CopyNumber.ts      # CNV data
│   │   └── Fusion.ts          # Structural variant data
│   ├── core/
│   │   ├── Reference.ts       # Chromosome angle calculations
│   │   ├── ArcMapper.ts       # Data → Arc conversion
│   │   └── ColorProvider.ts   # Mutation class colors
│   ├── components/
│   │   ├── DiscoDiagram.ts    # Main component
│   │   ├── ChromosomeRing.ts  # Outer chromosome track
│   │   ├── LabelRing.ts       # Chromosome labels
│   │   ├── SnvRing.ts         # SNV mutation arcs
│   │   ├── CnvRing.ts         # CNV colored arcs
│   │   ├── FusionChords.ts    # SV connecting lines
│   │   └── Tooltip.ts         # Hover info
│   └── styles.css
└── README.md
```

### Key Technical Concepts

1. **Angle Calculation**: Each chromosome gets proportional angle based on size

   ```typescript
   chromosomeAngle = (2 * Math.PI - totalPadAngle) * (chrSize / totalGenomeSize);
   ```

2. **Arc Generation**: D3 arc generator for rings

   ```typescript
   const arc = d3
     .arc<ArcData>()
     .innerRadius((d) => d.innerRadius)
     .outerRadius((d) => d.outerRadius)
     .startAngle((d) => d.startAngle)
     .endAngle((d) => d.endAngle);
   ```

3. **Position to Angle**: Convert genomic position to radians

   ```typescript
   angle = chromosomeStartAngle + (position / chromosomeSize) * chromosomeAngle;
   ```

4. **Fusion Chords**: D3 ribbon or custom bezier curves connecting two loci

### Implementation Steps

1. Create Reference class for chromosome angle mapping
2. Build ChromosomeRing (outer ring with chromosome arcs)
3. Build SnvRing (inner ring with mutation marks)
4. Build CnvRing (colored arcs for copy number)
5. Build FusionChords (bezier curves for structural variants)
6. Add interactivity (hover, click, zoom)
7. Add to Dataset Selector embedded visualizations

### Sample Data Format

```json
{
  "sample": "SAMPLE-001",
  "mutations": [
    { "chr": "chr1", "pos": 12345678, "gene": "TP53", "class": "missense" },
    { "chr": "chr17", "pos": 7577121, "gene": "BRCA1", "class": "nonsense" }
  ],
  "cnv": [
    { "chr": "chr1", "start": 1000000, "end": 50000000, "value": 1.5 },
    { "chr": "chr3", "start": 100000, "end": 30000000, "value": -0.8 }
  ],
  "fusions": [
    {
      "chrA": "chr9",
      "posA": 133729451,
      "geneA": "ABL1",
      "chrB": "chr22",
      "posB": 23632600,
      "geneB": "BCR"
    }
  ]
}
```

---

_Document created: December 15, 2025_
_Last updated: December 16, 2025_
