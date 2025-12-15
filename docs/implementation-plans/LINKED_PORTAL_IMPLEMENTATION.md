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

| #   | Deliverable                      | Type        | Priority |
| --- | -------------------------------- | ----------- | -------- |
| 1   | `demos/linked-portal/`           | New folder  | **P0**   |
| 2   | Event-driven lollipop with brush | Enhancement | **P0**   |
| 3   | Filter panel component           | New         | **P0**   |
| 4   | Cohort/filter store              | New         | **P0**   |
| 5   | Integrated portal app            | New         | **P0**   |
| 6   | Enhanced oncoprint matrix        | Enhancement | **P1**   |
| 7   | Live deployment                  | DevOps      | **P1**   |

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

## 🗓️ Implementation Schedule

### Day 1 (Dec 15/16): Foundation

| Time      | Task                                            | Files                                       |
| --------- | ----------------------------------------------- | ------------------------------------------- |
| Morning   | Set up `demos/linked-portal/` project structure | package.json, vite.config.ts, tsconfig.json |
| Morning   | Copy and adapt types from 08-linked-views       | src/types/                                  |
| Afternoon | Implement CohortStore                           | src/state/CohortStore.ts                    |
| Afternoon | Copy and enhance EventBus                       | src/state/EventBus.ts                       |
| Evening   | Create data loader utility                      | src/utils/dataLoader.ts                     |
| Evening   | Test data loading                               | Basic console test                          |

**Deliverable:** Data loads, CohortStore works, EventBus ready

### Day 2 (Dec 16/17): LollipopPlot Enhancement

| Time      | Task                              | Files                          |
| --------- | --------------------------------- | ------------------------------ |
| Morning   | Port lollipop code to TypeScript  | src/components/LollipopPlot.ts |
| Morning   | Add D3 brush for selection        | LollipopPlot.ts                |
| Afternoon | Connect to EventBus (emit events) | LollipopPlot.ts                |
| Afternoon | Respond to highlight events       | LollipopPlot.ts                |
| Evening   | Add zoom functionality            | LollipopPlot.ts                |
| Evening   | Style and polish                  | styles/                        |

**Deliverable:** Lollipop with brush selection, emits events

### Day 3 (Dec 17/18): FilterPanel & SampleTable

| Time      | Task                           | Files                         |
| --------- | ------------------------------ | ----------------------------- |
| Morning   | Build FilterPanel UI           | src/components/FilterPanel.ts |
| Morning   | Connect to CohortStore         | FilterPanel.ts                |
| Afternoon | Port SampleTable to TypeScript | src/components/SampleTable.ts |
| Afternoon | Add sort, highlight features   | SampleTable.ts                |
| Evening   | Wire up all event connections  | App.ts                        |
| Evening   | Test full interaction loop     | Manual testing                |

**Deliverable:** Filters work, table highlights on lollipop hover

### Day 4 (Dec 18/19): Integration & MutationSummary

| Time      | Task                        | Files                             |
| --------- | --------------------------- | --------------------------------- |
| Morning   | Build MutationSummary panel | src/components/MutationSummary.ts |
| Morning   | Add Legend component        | src/components/Legend.ts          |
| Afternoon | Create main App layout      | src/App.ts, index.html            |
| Afternoon | Responsive grid layout      | styles/main.css                   |
| Evening   | Cross-browser testing       | Manual                            |
| Evening   | Fix bugs, polish            | Various                           |

**Deliverable:** Complete integrated portal

### Day 5 (Dec 19/20): Polish & Documentation

| Time      | Task                               | Files          |
| --------- | ---------------------------------- | -------------- |
| Morning   | Add loading states, error handling | All components |
| Morning   | Accessibility improvements         | All components |
| Afternoon | Write README with screenshots      | README.md      |
| Afternoon | Record GIF demo                    | docs/          |
| Evening   | Deploy to Vercel                   | vercel.json    |
| Evening   | Final testing on deployed version  | Manual         |

**Deliverable:** Polished, deployed demo

### Day 6-7 (Dec 20-22): Buffer & Email

| Time   | Task                 |
| ------ | -------------------- |
| Sat AM | Final bug fixes      |
| Sat PM | Email draft revision |
| Sun    | **SEND EMAIL**       |

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

_Document created: December 15, 2025_
_Last updated: December 15, 2025_
