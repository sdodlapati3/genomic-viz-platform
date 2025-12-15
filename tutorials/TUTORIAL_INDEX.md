# 📚 Genomic Visualization Tutorial System

> A comprehensive learning path for building ProteinPaint-style genomic visualizations
>
> **Goal**: Build production-quality skills for the St. Jude GenomePaint team position

---

## 🎯 Target Position: Computational Research Scientist

### Job Details

| Field            | Details                                            |
| ---------------- | -------------------------------------------------- |
| **Position**     | Computational Research Scientist                   |
| **Location**     | Memphis, TN                                        |
| **Department**   | Computational Biology - Zhou Lab ProteinPaint Team |
| **Type**         | Full-Time (40 hrs/week)                            |
| **Req #**        | JR6038                                             |
| **Salary Range** | $86,320 - $154,960/year                            |

### About the Team

Join the **Zhou lab ProteinPaint team** (https://proteinpaint.stjude.org/team/) to contribute to the development of an open-source platform for biomedical data visualization, analysis and sharing.

**ProteinPaint Evolution:**

- **Origin**: Cancer mutation visualization tool ([PubMed 26711108](https://pubmed.ncbi.nlm.nih.gov/26711108/))
- **Current**: Umbrella platform spanning multiple portals

**Platforms Powered by ProteinPaint:**
| Platform | Publication |
|----------|-------------|
| GenomePaint | [PubMed 33434514](https://pubmed.ncbi.nlm.nih.gov/33434514/) |
| Neuro-Oncology Portal | [PubMed 41190809](https://pubmed.ncbi.nlm.nih.gov/41190809/) |
| Survivorship Portal | [PubMed 38593228](https://pubmed.ncbi.nlm.nih.gov/38593228/) |
| NCI Genomic Data Commons | [portal.gdc.cancer.gov](https://portal.gdc.cancer.gov/) |
| ASH HematOmics Program | [proteinpaint.stjude.org/ashop](https://proteinpaint.stjude.org/ashop/) |

### Software Development Focus

- Multi-data-modality support
- Interoperability for data analysis
- Accountability with scientific rigor
- Ease of access through AI chatbot
- Molecular and clinical data integration

### Fields of Application

- Cancer genomics
- Single-cell omics
- Oncology
- Pharmacogenomics
- Population science
- Public health

### Required Qualifications

| Category         | Requirements                                                              |
| ---------------- | ------------------------------------------------------------------------- |
| **Education**    | PhD in cancer, bioinformatics, or relevant biological sciences (required) |
| **Experience**   | PhD with no experience, OR Master's + 4 yrs, OR Bachelor's + 6 yrs        |
| **Publications** | 1-2 first author papers IF >5 (or equivalent)                             |

### Required Technical Skills

| Category           | Technologies                           |
| ------------------ | -------------------------------------- |
| **OS/Environment** | Linux                                  |
| **Frontend**       | JavaScript, Full-stack web development |
| **Backend**        | Node.js                                |
| **Data Analysis**  | R, Python                              |
| **Performance**    | Rust                                   |
| **Database**       | SQL                                    |
| **AI**             | LLM integration, AI chatbot            |
| **DevOps**         | Testing, CI/CD, Continuous Integration |

### Job Responsibilities

1. Lead computationally focused scientific research projects with moderate supervision
2. Provide inputs regarding analytical approaches and develop new computational methods
3. Identify, process, organize, summarize, review, and report relevant data
4. Draft manuscripts and work through submission and review process
5. Instruct and guide other staff in computational research techniques
6. (For recent PhD graduates: equivalent to mentored postdoctoral position)

---

## 📋 Table of Contents

1. [Learning Path Overview](#-learning-path-overview)
2. [Quick Start](#-quick-start)
3. [Phase 1: Frontend Fundamentals](#-phase-1-frontend-visualization-fundamentals)
4. [Phase 2: Backend Development](#-phase-2-backend-development)
5. [Phase 3: Advanced Visualizations](#-phase-3-advanced-visualizations)
6. [Phase 4: Production Skills](#-phase-4-production-skills)
7. [Recommended Learning Order](#-recommended-learning-order)
8. [Progress Tracking](#-progress-tracking)
9. [Technology Stack](#-technology-stack)
10. [Resources & References](#-resources--references)
11. **[🎯 Interview Preparation Guide](INTERVIEW_PREP.md)** ← Comprehensive Q&A

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
| 1.5 | [Performance](phase-1-frontend/05-performance/README.md)       | Canvas optimization, WebGL       | 2 hrs   | ⭐⭐⭐     |

### Key Concepts

- SVG vs Canvas: When to use which
- D3 enter/update/exit pattern
- Coordinate transformations (genomic → screen)
- Interactive tooltips and zoom
- Performance optimization for large datasets

---

## 🎯 Phase 2: Backend Development

**Goal**: Build APIs and data pipelines for genomic data.

| #   | Tutorial                                                      | Description           | Time    | Priority |
| --- | ------------------------------------------------------------- | --------------------- | ------- | -------- |
| 2.1 | [REST API](phase-2-backend/01-rest-api/README.md)             | Express.js endpoints  | 2 hrs   | ⭐⭐⭐   |
| 2.2 | [PostgreSQL](phase-2-backend/02-postgresql/README.md)         | Genomic data schema   | 2-3 hrs | ⭐⭐⭐   |
| 2.3 | [File Parsing](phase-2-backend/03-file-parsing/README.md)     | VCF, BED, MAF parsers | 2 hrs   | ⭐⭐⭐   |
| 2.4 | [R Integration](phase-2-backend/04-r-integration/README.md)   | Statistical analysis  | 1-2 hrs | ⭐⭐     |
| 2.5 | [Binary Formats](phase-2-backend/05-binary-formats/README.md) | BigWig, tabix, HDF5   | 2 hrs   | ⭐⭐⭐   |

### Key Concepts

- RESTful API design for genomics
- Efficient genomic queries
- Streaming large files
- Bridging JS and R
- Indexed binary file formats

---

## 🎯 Phase 3: Advanced Visualizations

**Goal**: Build production-quality genomic charts.

| #   | Tutorial                                                             | Description                   | Time    | Priority |
| --- | -------------------------------------------------------------------- | ----------------------------- | ------- | -------- |
| 3.1 | [Scatter Plot](phase-3-advanced-viz/01-scatter-plot/README.md)       | PCA, UMAP visualizations      | 2 hrs   | ⭐⭐⭐   |
| 3.2 | [Heatmap](phase-3-advanced-viz/02-heatmap/README.md)                 | Clustered expression heatmaps | 3 hrs   | ⭐⭐⭐⭐ |
| 3.3 | [Survival Curves](phase-3-advanced-viz/03-survival-curves/README.md) | Kaplan-Meier plots            | 2-3 hrs | ⭐⭐⭐⭐ |
| 3.4 | [Volcano Plot](phase-3-advanced-viz/04-volcano-plot/README.md)       | Differential expression       | 2 hrs   | ⭐⭐⭐   |
| 3.5 | [Gene Fusion](phase-3-advanced-viz/05-gene-fusion/README.md)         | Fusion visualization arcs     | 2-3 hrs | ⭐⭐⭐   |
| 3.6 | [OncoPrint](phase-3-advanced-viz/05-oncoprint/README.md)             | Mutation matrix               | 3 hrs   | ⭐⭐⭐⭐ |

### Key Concepts

- Hierarchical clustering
- Statistical visualization (KM, log-rank)
- Color scales for expression data
- Large matrix rendering
- Structural variant visualization

---

## 🎯 Phase 4: Production Skills

**Goal**: Testing, deployment, and advanced features.

| #    | Tutorial                                                                           | Description                 | Time    | Priority   |
| ---- | ---------------------------------------------------------------------------------- | --------------------------- | ------- | ---------- |
| 4.1  | [Testing](phase-4-production/01-testing/README.md)                                 | Vitest, Playwright          | 2 hrs   | ⭐⭐⭐     |
| 4.2  | [CI/CD](phase-4-production/02-cicd/README.md)                                      | GitHub Actions              | 1-2 hrs | ⭐⭐       |
| 4.3  | [AI Chatbot](phase-4-production/03-ai-chatbot/README.md)                           | OpenAI integration          | 2 hrs   | ⭐⭐       |
| 4.4  | [Rust Parsing](phase-4-production/04-rust-parsing/README.md)                       | High-performance parsing    | 3 hrs   | ⭐⭐       |
| 4.5  | [Rust WASM](phase-4-production/05-rust-wasm/README.md)                             | WebAssembly compilation     | 2-3 hrs | ⭐⭐       |
| 4.6  | [Multi-View Coordination](phase-4-production/06-multi-view-coordination/README.md) | Shared state patterns       | 2 hrs   | ⭐⭐⭐     |
| 4.7  | [Protein Panel](phase-4-production/07-protein-panel/README.md)                     | TypeScript + D3 components  | 2-3 hrs | ⭐⭐⭐     |
| 4.8  | [Linked Views](phase-4-production/08-linked-views/README.md)                       | EventBus, coordinated views | 2-3 hrs | ⭐⭐⭐⭐   |
| 4.9  | [Config System](phase-4-production/09-config-system/README.md)                     | Zod validation, URL state   | 2 hrs   | ⭐⭐⭐     |
| 4.10 | [ProteinPaint Embed](phase-4-production/10-proteinpaint-embed/README.md)           | GenomePaint API integration | 2-3 hrs | ⭐⭐⭐⭐⭐ |

### Key Concepts

- Unit testing visualizations
- CI/CD for genomic applications
- LLM/RAG for data exploration
- Rust + napi-rs for performance
- WebAssembly for browser performance
- Component architecture patterns
- View coordination (EventBus)
- Configuration management
- **ProteinPaint embed API** ← Direct interview relevance!

---

## 🚀 Recommended Learning Order

### For ProteinPaint Interview (Focus Path)

1. **1.1 SVG & Canvas** - Foundation
2. **1.2 D3.js Core** - Essential patterns
3. **1.3 Lollipop Plot** ⭐ - MOST IMPORTANT
4. **1.4 Genome Browser** - Track architecture
5. **3.3 Survival Curves** - Statistical viz
6. **3.5 OncoPrint** - Matrix visualization
7. **4.8 Linked Views** - EventBus pattern (matches ProteinPaint's rx)
8. **4.10 ProteinPaint Embed** ⭐⭐ - Direct API experience

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

## ✅ Progress Tracking

### Phase 1: Frontend Visualization Fundamentals

| Tutorial           | Status      | Date   | Notes                         |
| ------------------ | ----------- | ------ | ----------------------------- |
| 1.1 SVG & Canvas   | ✅ Complete | Dec 11 | Web graphics fundamentals     |
| 1.2 D3.js Core     | ✅ Complete | Dec 11 | Selections, scales, binding   |
| 1.3 Lollipop Plot  | ✅ Complete | Dec 11 | ProteinPaint signature viz ⭐ |
| 1.4 Genome Browser | ✅ Complete | Dec 12 | Track-based navigation        |
| 1.5 Performance    | ✅ Complete | Dec 12 | Canvas optimization, WebGL    |

### Phase 2: Backend & Data Processing

| Tutorial           | Status      | Date   | Notes                 |
| ------------------ | ----------- | ------ | --------------------- |
| 2.1 REST API       | ✅ Complete | Dec 12 | Express.js endpoints  |
| 2.2 PostgreSQL     | ✅ Complete | Dec 12 | Genomic data schema   |
| 2.3 File Parsing   | ✅ Complete | Dec 12 | VCF, BED, MAF parsers |
| 2.4 R Integration  | ✅ Complete | Dec 12 | Statistical analysis  |
| 2.5 Binary Formats | ✅ Complete | Dec 12 | BigWig, tabix, HDF5   |

### Phase 3: Advanced Visualizations

| Tutorial            | Status      | Date   | Notes                                   |
| ------------------- | ----------- | ------ | --------------------------------------- |
| 3.1 UMAP Scatter    | ✅ Complete | Dec 12 | WebGL rendering, 10k+ points            |
| 3.2 Heatmap         | ✅ Complete | Dec 12 | Canvas-based, clustering                |
| 3.3 Survival Curves | ✅ Complete | Dec 13 | Kaplan-Meier, log-rank test             |
| 3.4 Volcano Plot    | ✅ Complete | Dec 13 | Canvas rendering, 20k genes             |
| 3.5 Gene Fusion     | ✅ Complete | Dec 13 | Arc visualization, SV breakpoints       |
| 3.6 Oncoprint       | ✅ Complete | Dec 13 | Canvas mutation matrix, clinical tracks |

### Phase 4: Production Skills

| Tutorial                      | Status      | Date   | Notes                                       |
| ----------------------------- | ----------- | ------ | ------------------------------------------- |
| 4.1 Testing                   | ✅ Complete | Dec 13 | Vitest, 86 tests, 100% coverage             |
| 4.2 CI/CD                     | ✅ Complete | Dec 13 | GitHub Actions, 34 tests, full pipeline     |
| 4.3 AI Chatbot                | ✅ Complete | Dec 13 | LLM/RAG, 60 tests, chat interface           |
| 4.4 Rust Parsing              | ✅ Complete | Dec 13 | VCF parser, napi-rs, 48 tests               |
| 4.5 Rust WASM                 | ✅ Complete | Dec 13 | WebAssembly compilation                     |
| 4.6 Multi-View Coordination   | ✅ Complete | Dec 14 | Shared state patterns                       |
| 4.7 Protein Panel             | ✅ Complete | Dec 14 | TypeScript+D3, component architecture       |
| 4.8 Linked Views              | ✅ Complete | Dec 14 | EventBus, SelectionStore, coordinated views |
| 4.9 Config System             | ✅ Complete | Dec 14 | Zod validation, migrations, URL state       |
| 4.10 ProteinPaint/GenomePaint | ✅ Complete | Dec 15 | Embed API, Docker, interview prep ⭐⭐      |

### Capstone Project

| Milestone     | Status      | Date   | Notes                              |
| ------------- | ----------- | ------ | ---------------------------------- |
| Architecture  | ✅ Complete | Dec 13 | Monorepo with workspaces           |
| Backend       | ✅ Complete | Dec 13 | Express.js, 6 API routes, services |
| Frontend      | ✅ Complete | Dec 13 | D3.js visualizations, 5 views      |
| Integration   | ✅ Complete | Dec 13 | Client-server, shared types        |
| Testing       | ✅ Complete | Dec 13 | 20 API tests passing               |
| Documentation | ✅ Complete | Dec 13 | Comprehensive README               |

---

## 💡 Tips for Effective Learning

1. **Don't just read** - Run every tutorial
2. **Use DevTools** - Inspect SVG elements, check Network tab
3. **Break things** - Modify code to see what happens
4. **Connect to ProteinPaint** - Think how each concept applies
5. **Take notes** - Write down patterns you want to remember

---

## 🛠️ Technology Stack

### Core Technologies

| Layer             | Technology            | Version | Purpose                    |
| ----------------- | --------------------- | ------- | -------------------------- |
| **Frontend**      | JavaScript/TypeScript | ES2022+ | Core language              |
| **Visualization** | D3.js                 | v7.x    | Data-driven visualizations |
| **Canvas**        | HTML5 Canvas API      | -       | High-performance rendering |
| **Backend**       | Node.js               | v20+    | Server runtime             |
| **Framework**     | Express.js            | v4.x    | REST API                   |
| **Database**      | PostgreSQL            | v15+    | Relational data storage    |
| **Statistics**    | R                     | v4.x    | Statistical analysis       |
| **Data Science**  | Python                | v3.11+  | Data processing, AI        |
| **Performance**   | Rust                  | Latest  | High-performance parsing   |
| **Container**     | Docker                | Latest  | Development environment    |

### Target Position Skills (from Job Description)

| Skill Category             | Required Technologies        | Priority     |
| -------------------------- | ---------------------------- | ------------ |
| Full-stack Web Development | Linux, JavaScript, Node.js   | **Critical** |
| Data Analysis Languages    | R, Python                    | **Critical** |
| High-Performance Computing | Rust                         | **High**     |
| Database                   | SQL                          | **High**     |
| AI Integration             | LLM APIs, RAG                | **High**     |
| DevOps                     | Testing, CI/CD               | **High**     |
| Domain Knowledge           | Cancer genomics, multi-omics | **Critical** |

---

## 📚 Resources & References

### Official Documentation

- [D3.js Documentation](https://d3js.org/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Rust Book](https://doc.rust-lang.org/book/)

### Genomics Resources

- [ProteinPaint GitHub](https://github.com/stjude/proteinpaint)
- [GenomePaint Paper](<https://www.cell.com/cancer-cell/fulltext/S1535-6108(20)30659-0>)
- [VCF Specification](https://samtools.github.io/hts-specs/VCFv4.3.pdf)
- [MAF Specification](https://docs.gdc.cancer.gov/Data/File_Formats/MAF_Format/)

### Visualization Inspiration

- [Observable D3 Gallery](https://observablehq.com/@d3/gallery)
- [cBioPortal](https://www.cbioportal.org/)
- [UCSC Genome Browser](https://genome.ucsc.edu/)
- [IGV.js](https://github.com/igvteam/igv.js)

### Statistical Methods

- [Survival Analysis in R](https://www.emilyzabor.com/tutorials/survival_analysis_in_r_tutorial.html)
- [DESeq2 Vignette](https://bioconductor.org/packages/release/bioc/vignettes/DESeq2/inst/doc/DESeq2.html)

---

_Last Updated: December 15, 2025_

_Happy learning! 🧬_
