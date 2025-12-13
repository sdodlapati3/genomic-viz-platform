# ProteinPaint Interview Prep Plan

> **Timeline**: Dec 13-22, 2025 (10 days)  
> **Interview**: Dec 23, 2025 @ 12:00pm ET  
> **Available Hours**: ~15h/day, 80% coding

---

## Gap Analysis: What We Have vs. What's Needed

### ✅ Already Implemented (Strong Foundation)

| Feature | Location | Interview Ready? |
|---------|----------|------------------|
| **Mutation Lollipop Plots** | `tutorials/phase-1-frontend/03-lollipop-plot/` | ✅ Yes |
| **D3.js Data Viz** | Multiple tutorials + capstone | ✅ Yes |
| **Node.js REST API** | `capstone/server/` | ✅ Yes |
| **JWT Authentication** | `capstone/server/src/auth/` | ✅ Yes |
| **Database + Migrations** | Knex.js with 7 tables | ✅ Yes |
| **Playwright E2E Tests** | `capstone/e2e/` | ✅ Yes |
| **WebSocket Real-time** | Socket.io integration | ✅ Yes |
| **Swagger API Docs** | `/api/docs` endpoint | ✅ Yes |
| **Docker Setup** | `docker-compose.yml` | ✅ Yes |
| **Error Tracking** | Sentry integration | ✅ Yes |

### 🔄 Gaps to Address (High Priority)

| Gap | Why Important | Action |
|-----|---------------|--------|
| **TypeScript** | ProteinPaint codebase is TS-heavy | Convert key components |
| **Typed Config System** | "Config → render" pipeline pattern | Create embed-style API |
| **URL State Sync** | "Copy link reproduces figure" | Add URL serialization |
| **Genome Coordinate Viewer** | Core ProteinPaint feature | Build track-based browser |
| **Cohort/Study View** | Multi-sample exploration | Add sample matrix component |

---

## 10-Day Action Plan

### Day 1 (Dec 13): TypeScript Foundation ⚡

**Goal**: Convert React client to TypeScript basics

```
Tasks:
□ Install TypeScript + @types dependencies
□ Configure tsconfig.json for client
□ Convert 3 key components to TypeScript:
  - LollipopPlot.tsx
  - MutationViewer.tsx  
  - GeneSelector.tsx
□ Create interfaces for genomic data types
```

**Files to create/update**:
- `capstone/client/tsconfig.json`
- `capstone/client/src/types/genomic.ts`
- `capstone/client/src/components/LollipopPlot.tsx`

### Day 2 (Dec 14): Embed API Pattern 🔌

**Goal**: Create ProteinPaint-style embed component

```
Tasks:
□ Create EmbedConfig interface (typed parameters)
□ Build GenomicEmbed component with config prop
□ Support multiple "entrypoints":
  - gene view (lollipop)
  - sample matrix
  - survival plot
□ Add runtime config validation with Zod
```

**Key Files**:
- `capstone/client/src/embed/index.ts`
- `capstone/client/src/embed/GenomicEmbed.tsx`
- `capstone/client/src/embed/config.schema.ts`

### Day 3 (Dec 15): URL State & Reproducibility 🔗

**Goal**: "Copy link reproduces the same view"

```
Tasks:
□ Implement useUrlState hook
□ Serialize view config to URL params
□ Parse URL → config on page load
□ Add "Share View" button with copy-to-clipboard
□ Handle deep linking for all visualization types
```

**Implementation Pattern**:
```typescript
// URL: /visualize?gene=TP53&view=lollipop&filters=missense,nonsense

const { config, updateConfig } = useUrlState();
// Changes to config automatically update URL
// Page reload restores exact same state
```

### Day 4 (Dec 16): Genome Browser Track System 🧬

**Goal**: Build foundational track-based browser

```
Tasks:
□ Create Track interface/base class
□ Implement GeneTrack component
□ Implement MutationTrack component
□ Add coordinate navigation (zoom, pan)
□ Synchronize tracks on same coordinate axis
```

**Architecture**:
```
GenomeBrowser
├── TrackContainer
│   ├── CoordinateAxis
│   ├── GeneTrack
│   ├── MutationTrack
│   └── CustomTrack (extensible)
├── NavigationControls
└── CoordinateDisplay
```

### Day 5 (Dec 17): Sample Matrix / Cohort View 📊

**Goal**: Multi-sample exploration UI

```
Tasks:
□ Create SampleMatrix component (samples × genes)
□ Color cells by mutation type
□ Add sorting by gene, sample, mutation count
□ Implement row/column selection
□ Link selection to other views (survival, expression)
```

### Day 6 (Dec 18): Config Panel + JSON Editor 🛠️

**Goal**: Interactive config editing (demo feature)

```
Tasks:
□ Create ConfigEditor component
□ JSON textarea with syntax highlighting
□ Real-time validation feedback
□ "Preset" dropdown for common configurations
□ Export/import config as JSON file
```

**Use Case**: Paste a config → validate → render visualization

### Day 7 (Dec 19): Survival Analysis Integration 📈

**Goal**: Connect cohort selection to Kaplan-Meier

```
Tasks:
□ Wire sample matrix selections to survival API
□ Show survival curves for selected cohorts
□ Add stratification options (gene, clinical)
□ Display log-rank test results
□ Add confidence intervals
```

### Day 8 (Dec 20): Polish & Performance 🚀

**Goal**: Production-quality refinements

```
Tasks:
□ Add loading states/skeletons
□ Implement virtualization for large datasets
□ Add error boundaries with recovery UI
□ Performance profiling (React DevTools)
□ Fix any TypeScript errors
```

### Day 9 (Dec 21): Demo Preparation 🎯

**Goal**: Prepare crisp talking points

```
Prepare:
□ 90-second "Why ProteinPaint" pitch
□ 3 demo wins:
  1. Typed embed component + config validation
  2. URL reproducibility (share link → same view)
  3. Interactive sample matrix → survival stratification
□ Code walkthrough notes
□ 6 questions for interviewer
```

**Questions for Xin Zhou**:
1. "What's the highest-friction part of onboarding new modalities (BAM/Hi-C)?"
2. "How do you balance adding features vs hardening/testing?"
3. "Where does TS/React/Node sit in the codebase roadmap?"
4. "What does success look like in the first 90 days?"
5. "How do you handle cross-team collaboration with data scientists?"
6. "What's the most challenging technical problem you've solved recently?"

### Day 10 (Dec 22): Mock Interview + Rehearsal 🎬

**Goal**: Flawless demo execution

```
Practice:
□ 30-min mock interview run
  - 3 min: Background
  - 7 min: Project fit + playground demo
  - 10 min: Deep-dive (validation/testing/interop/perf)
  - 10 min: Q&A
□ Demo from fresh terminal + clean repo
□ Handle common questions:
  - "Walk me through this code"
  - "How would you add feature X?"
  - "How do you ensure scientific rigor?"
```

---

## Papers to Read (Core Context)

| Paper | What to Extract | Time |
|-------|-----------------|------|
| **ProteinPaint (2016)** | Origin story, mutation visualization primitives | 45 min |
| **GenomePaint (2021)** | Multi-omics integration, cohort queries | 45 min |
| **ppBAM (2023)** | BAM scale/performance, UX decisions | 30 min |
| **Survivorship Portal (2024)** | Clinical+genomic at scale | 30 min |
| **ppHiC (2024)** | Matrix visualization, multi-view design | 30 min |
| **MB Meta-Analysis Portal (2025)** | Portal product mindset | 30 min |

**Reading Strategy**: 
- Read abstract + figures first
- Focus on "what problem solved" + "how UI designed"
- Note any terms/concepts to research further

---

## Key Technical Concepts to Know

### Genomic Coordinates
- Chromosome + position → genome coordinate
- Exon/intron structure, CDS, UTR
- Transcript isoforms

### Protein Context
- Amino acid positions (1-indexed)
- Protein domains (Pfam, UniProt)
- Mutation notation (R248Q = Arg→Gln at position 248)

### ProteinPaint-Specific
- "Embed API" parameters and entrypoints
- studyview, samplematrix, fusioneditor concepts
- Track-based visualization pattern

### Performance Considerations
- Large dataset handling (streaming, pagination)
- Canvas vs SVG for dense data
- Web Workers for computation
- Efficient re-rendering (React.memo, useMemo)

---

## Demo Script (5-7 minutes)

### Opening (30 sec)
"I built a genomic visualization platform inspired by ProteinPaint. Let me show you the key features..."

### Feature 1: Typed Embed API (2 min)
"Here's a TypeScript component that mirrors ProteinPaint's embed pattern. You pass a typed configuration..."
- Show GenomicEmbed component
- Show config interface
- Show Zod validation

### Feature 2: URL Reproducibility (1.5 min)
"Scientific reproducibility is critical. Any view can be shared via URL..."
- Click "Share View"
- Open in new tab → same state
- Explain URL serialization

### Feature 3: Sample Matrix → Survival (2 min)
"Select samples in the matrix, immediately see survival stratification..."
- Select high-TP53 samples
- Show Kaplan-Meier update
- Explain cohort API integration

### Closing (30 sec)
"This demonstrates my understanding of genomic data visualization principles and production-quality React/TypeScript development."

---

## Checklist for Interview Day

- [ ] Repo cloned fresh, dependencies installed
- [ ] All demos working locally
- [ ] Notes printed/accessible
- [ ] Backup plan if demo fails
- [ ] Questions prepared
- [ ] Professional background ready (15-sec summary)
- [ ] Camera/audio tested
- [ ] Water bottle nearby

---

*Last updated: December 13, 2025*
