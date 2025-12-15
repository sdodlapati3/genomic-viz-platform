# 📚 Genomic Visualization Tutorials

> A comprehensive learning path for building ProteinPaint-style genomic visualizations

---

## 🗺️ Learning Path Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LEARNING PROGRESSION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1                    PHASE 2                    PHASE 3              │
│  Frontend                   Backend                    Advanced Viz         │
│  ─────────                  ─────────                  ────────────         │
│  ┌─────────┐               ┌─────────┐               ┌─────────┐           │
│  │01 SVG   │               │01 REST  │               │01 Scatter│           │
│  │  Canvas │──┐            │   API   │               │   Plot   │           │
│  └─────────┘  │            └─────────┘               └─────────┘           │
│       │       │                 │                         │                 │
│       ▼       │                 ▼                         ▼                 │
│  ┌─────────┐  │            ┌─────────┐               ┌─────────┐           │
│  │02 D3.js │  │            │02 Postgr│               │02 Heatmap│           │
│  │  Core   │──┤            │   eSQL  │               │          │           │
│  └─────────┘  │            └─────────┘               └─────────┘           │
│       │       │                 │                         │                 │
│       ▼       │                 ▼                         ▼                 │
│  ┌─────────┐  │            ┌─────────┐               ┌─────────┐           │
│  │03 Lolli │◀─┘            │03 File  │               │03 Surviv│           │
│  │   pop ⭐ │               │  Parser │               │   al    │           │
│  └─────────┘               └─────────┘               └─────────┘           │
│       │                         │                         │                 │
│       ▼                         ▼                         ▼                 │
│  ┌─────────┐               ┌─────────┐               ┌─────────┐           │
│  │04 Genome│               │04 R     │               │04 Volcano│           │
│  │ Browser │               │  Integr │               │   Plot   │           │
│  └─────────┘               └─────────┘               └─────────┘           │
│                                                           │                 │
│                                                           ▼                 │
│                                                      ┌─────────┐           │
│                                                      │05 Onco  │           │
│                                                      │  Print  │           │
│                                                      └─────────┘           │
│                                                                             │
│  ⭐ = Most important for ProteinPaint interview                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Quick Start

```bash
# Clone and setup
cd genomic-viz-platform/tutorials

# Pick a tutorial and run
cd phase-1-frontend/01-svg-canvas
npm install
npm run dev
# Open http://localhost:5173
```

---

## 🎯 Phase 1: Frontend Visualization Fundamentals

**Goal**: Master the core technologies for building browser-based genomic visualizations.

| #   | Tutorial                                                       | Description                      | Time    | Priority   |
| --- | -------------------------------------------------------------- | -------------------------------- | ------- | ---------- |
| 1.1 | [SVG & Canvas](phase-1-frontend/01-svg-canvas/README.md)       | Web graphics fundamentals        | 1-2 hrs | ⭐⭐⭐     |
| 1.2 | [D3.js Core](phase-1-frontend/02-d3-core/README.md)            | Selections, scales, data binding | 2-3 hrs | ⭐⭐⭐     |
| 1.3 | [Lollipop Plot](phase-1-frontend/03-lollipop-plot/README.md)   | ProteinPaint's signature viz     | 3-4 hrs | ⭐⭐⭐⭐⭐ |
| 1.4 | [Genome Browser](phase-1-frontend/04-genome-browser/README.md) | Track-based navigation           | 2-3 hrs | ⭐⭐⭐⭐   |

### Key Concepts

- SVG vs Canvas: When to use which
- D3 enter/update/exit pattern
- Coordinate transformations (genomic → screen)
- Interactive tooltips and zoom

---

## 🎯 Phase 2: Backend Development

**Goal**: Build APIs and data pipelines for genomic data.

| #   | Tutorial                                                    | Description           | Time    | Priority |
| --- | ----------------------------------------------------------- | --------------------- | ------- | -------- |
| 2.1 | [REST API](phase-2-backend/01-rest-api/README.md)           | Express.js endpoints  | 2 hrs   | ⭐⭐⭐   |
| 2.2 | [PostgreSQL](phase-2-backend/02-postgresql/README.md)       | Genomic data schema   | 2-3 hrs | ⭐⭐⭐   |
| 2.3 | [File Parsing](phase-2-backend/03-file-parsing/README.md)   | VCF, BED, MAF parsers | 2 hrs   | ⭐⭐⭐   |
| 2.4 | [R Integration](phase-2-backend/04-r-integration/README.md) | Statistical analysis  | 1-2 hrs | ⭐⭐     |

### Key Concepts

- RESTful API design for genomics
- Efficient genomic queries
- Streaming large files
- Bridging JS and R

---

## 🎯 Phase 3: Advanced Visualizations

**Goal**: Build production-quality genomic charts.

| #   | Tutorial                                                             | Description                   | Time    | Priority |
| --- | -------------------------------------------------------------------- | ----------------------------- | ------- | -------- |
| 3.1 | [Scatter Plot](phase-3-advanced-viz/01-scatter-plot/README.md)       | PCA, UMAP visualizations      | 2 hrs   | ⭐⭐⭐   |
| 3.2 | [Heatmap](phase-3-advanced-viz/02-heatmap/README.md)                 | Clustered expression heatmaps | 3 hrs   | ⭐⭐⭐⭐ |
| 3.3 | [Survival Curves](phase-3-advanced-viz/03-survival-curves/README.md) | Kaplan-Meier plots            | 2-3 hrs | ⭐⭐⭐⭐ |
| 3.4 | [Volcano Plot](phase-3-advanced-viz/04-volcano-plot/README.md)       | Differential expression       | 2 hrs   | ⭐⭐⭐   |
| 3.5 | [OncoPrint](phase-3-advanced-viz/05-oncoprint/README.md)             | Mutation matrix               | 3 hrs   | ⭐⭐⭐⭐ |

### Key Concepts

- Hierarchical clustering
- Statistical visualization (KM, log-rank)
- Color scales for expression data
- Large matrix rendering

---

## 🎯 Phase 4: Production Skills

**Goal**: Testing, deployment, and advanced features.

| #   | Tutorial                                                     | Description              | Time    | Priority |
| --- | ------------------------------------------------------------ | ------------------------ | ------- | -------- |
| 4.1 | [Testing](phase-4-production/01-testing/README.md)           | Vitest, Playwright       | 2 hrs   | ⭐⭐⭐   |
| 4.2 | [CI/CD](phase-4-production/02-cicd/README.md)                | GitHub Actions           | 1-2 hrs | ⭐⭐     |
| 4.3 | [AI Chatbot](phase-4-production/03-ai-chatbot/README.md)     | OpenAI integration       | 2 hrs   | ⭐⭐     |
| 4.4 | [Rust Parsing](phase-4-production/04-rust-parsing/README.md) | High-performance parsing | 3 hrs   | ⭐       |

---

## 🚀 Recommended Learning Order

### For ProteinPaint Interview (Focus Path)

1. **1.1 SVG & Canvas** - Foundation
2. **1.2 D3.js Core** - Essential patterns
3. **1.3 Lollipop Plot** ⭐ - MOST IMPORTANT
4. **1.4 Genome Browser** - Track architecture
5. **3.3 Survival Curves** - Statistical viz
6. **3.5 OncoPrint** - Matrix visualization

### Full Learning Path (Comprehensive)

1. Phase 1 (all tutorials in order)
2. Phase 3 (visualizations)
3. Phase 2 (backend as needed)
4. Phase 4 (production skills)

---

## 📖 How to Use Each Tutorial

### Step 1: Read the README

Each tutorial has a `README.md` with:

- Learning objectives
- Key concepts
- Code walkthrough
- ProteinPaint connection (for relevant tutorials)

### Step 2: Run the Tutorial

```bash
cd tutorials/phase-X-xxx/YY-tutorial-name
npm install
npm run dev
```

### Step 3: Explore the Code

- Check `src/` for implementation files
- Files are numbered in learning order (01, 02, ...)
- Each file focuses on one concept

### Step 4: Experiment

- Modify parameters and see effects
- Add console.log to trace data flow
- Try the exercises if provided

---

## 🔗 Related Documentation

- [Technology Overview](../docs/TECHNOLOGY_OVERVIEW.md) - All tools explained
- [Tutorial Review Guide](../docs/TUTORIAL_REVIEW_GUIDE.md) - Quick reference
- [ProteinPaint Prep Plan](../docs/PROTEINPAINT_PREP.md) - Interview preparation

---

## ✅ Progress Tracker

Use this checklist to track your progress:

### Phase 1: Frontend

- [ ] 1.1 SVG & Canvas - Completed
- [ ] 1.2 D3.js Core - Completed
- [ ] 1.3 Lollipop Plot - Completed
- [ ] 1.4 Genome Browser - Completed

### Phase 2: Backend

- [ ] 2.1 REST API - Completed
- [ ] 2.2 PostgreSQL - Completed
- [ ] 2.3 File Parsing - Completed
- [ ] 2.4 R Integration - Completed

### Phase 3: Advanced Viz

- [ ] 3.1 Scatter Plot - Completed
- [ ] 3.2 Heatmap - Completed
- [ ] 3.3 Survival Curves - Completed
- [ ] 3.4 Volcano Plot - Completed
- [ ] 3.5 OncoPrint - Completed

### Phase 4: Production

- [ ] 4.1 Testing - Completed
- [ ] 4.2 CI/CD - Completed
- [ ] 4.3 AI Chatbot - Completed
- [ ] 4.4 Rust Parsing - Completed

---

## 💡 Tips for Effective Learning

1. **Don't just read** - Run every tutorial
2. **Use DevTools** - Inspect SVG elements, check Network tab
3. **Break things** - Modify code to see what happens
4. **Connect to ProteinPaint** - Think how each concept applies
5. **Take notes** - Write down patterns you want to remember

---

_Happy learning! 🧬_
