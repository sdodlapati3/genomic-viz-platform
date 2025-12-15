# 🧬 Genomic Visualization Platform

> A comprehensive learning project for building production-quality genomic data visualization tools, inspired by St. Jude's ProteinPaint platform.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![D3.js](https://img.shields.io/badge/D3.js-v7-orange)](https://d3js.org/)

## 🎯 Project Overview

This project provides hands-on tutorials for developing skills in **genomic data visualization** and **computational biology software development**. It covers the full stack of technologies used in modern bioinformatics portals like:

- [ProteinPaint](https://proteinpaint.stjude.org/) - St. Jude's genomic visualization platform
- [GenomePaint](https://viz.stjude.cloud/tools/genomepaint) - Multi-sample cancer genomics browser
- [GDC Portal](https://portal.gdc.cancer.gov/) - NCI Genomic Data Commons

### Key Skills Covered

| Category          | Technologies                               |
| ----------------- | ------------------------------------------ |
| **Visualization** | D3.js v7, SVG, Canvas, WebGL               |
| **Frontend**      | JavaScript/TypeScript, Vite                |
| **Backend**       | Node.js, Express, REST APIs                |
| **Database**      | PostgreSQL, SQLite                         |
| **Statistics**    | R integration, Kaplan-Meier, log-rank test |
| **Performance**   | Rust, WebAssembly, Web Workers             |
| **AI/ML**         | LLM integration, RAG chatbots              |
| **DevOps**        | Docker, GitHub Actions, CI/CD              |

## 📚 Tutorial System

The repository contains **25+ tutorials** organized into 4 phases:

```
tutorials/
├── phase-1-frontend/          # Visualization Fundamentals
│   ├── 01-svg-canvas/         # SVG & Canvas graphics basics
│   ├── 02-d3-core/            # D3.js selections, scales, bindings
│   ├── 03-lollipop-plot/      # ⭐ Mutation visualization (ProteinPaint signature)
│   ├── 04-genome-browser/     # Track-based genomic navigation
│   └── 05-performance/        # Canvas optimization, Web Workers
│
├── phase-2-backend/           # Data Infrastructure
│   ├── 01-rest-api/           # Express.js genomic endpoints
│   ├── 02-postgresql/         # Genomic data schema design
│   ├── 03-file-parsing/       # VCF, BED, MAF, GFF parsers
│   ├── 04-r-integration/      # Statistical analysis bridge
│   └── 05-binary-formats/     # BigWig, tabix, HDF5
│
├── phase-3-advanced-viz/      # Production Visualizations
│   ├── 01-scatter-plot/       # UMAP/t-SNE with WebGL (100k+ points)
│   ├── 02-heatmap/            # Clustered expression heatmaps
│   ├── 03-survival-curves/    # Kaplan-Meier with log-rank test
│   ├── 04-volcano-plot/       # Differential expression
│   ├── 05-gene-fusion/        # Structural variant arcs
│   └── 06-oncoprint/          # Sample × gene mutation matrix
│
└── phase-4-production/        # Professional Skills
    ├── 01-testing/            # Vitest, visual regression
    ├── 02-cicd/               # GitHub Actions pipelines
    ├── 03-ai-chatbot/         # LLM-powered data exploration
    ├── 04-rust-parsing/       # High-performance VCF parsing
    ├── 05-rust-wasm/          # WebAssembly compilation
    ├── 06-multi-view/         # State management patterns
    ├── 07-protein-panel/      # TypeScript + D3 components
    ├── 08-linked-views/       # ⭐ EventBus, coordinated views
    ├── 09-config-system/      # Zod validation, URL state
    └── 10-proteinpaint-embed/ # ⭐ GenomePaint API integration
```

**📖 Full curriculum:** [tutorials/TUTORIAL_INDEX.md](./tutorials/TUTORIAL_INDEX.md)

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Docker** (optional, for full environment)

### Installation

```bash
# Clone the repository
git clone https://github.com/sdodlapati3/genomic-viz-platform.git
cd genomic-viz-platform

# Install dependencies
npm install

# Run a specific tutorial
cd tutorials/phase-1-frontend/03-lollipop-plot
npm install
npm run dev
# Open http://localhost:5173
```

### Running with Docker

```bash
# Start PostgreSQL and other services
docker-compose up -d

# Access the database
docker exec -it genomic-viz-postgres psql -U postgres -d genomic_viz
```

## 🔬 Sample Visualizations

After completing the tutorials, you'll be able to build:

| Visualization          | Description                               | Tutorial  |
| ---------------------- | ----------------------------------------- | --------- |
| **Lollipop Plot**      | Protein mutations with domain annotations | Phase 1.3 |
| **Genome Browser**     | Track-based coordinate navigation         | Phase 1.4 |
| **Survival Curves**    | Kaplan-Meier with confidence intervals    | Phase 3.3 |
| **Expression Heatmap** | Hierarchical clustering with dendrograms  | Phase 3.2 |
| **Volcano Plot**       | Differential expression with significance | Phase 3.4 |
| **OncoPrint**          | Sample × gene mutation matrix             | Phase 3.6 |
| **Scatter Plot**       | UMAP/t-SNE with 100k+ points              | Phase 3.1 |

## 🎨 Interactive Demos

Production-ready demos showcasing ProteinPaint-inspired visualizations:

| Demo | Port | Description | Run |
|------|------|-------------|-----|
| **[Linked Portal](./demos/linked-portal/)** | 5180 | Multi-panel dashboard with EventBus coordination | `cd demos/linked-portal && npm run dev` |
| **[Oncoprint Matrix](./demos/oncoprint/)** | 5181 | Gene × Sample mutation matrix with layered rendering | `cd demos/oncoprint && npm run dev` |
| **[Genome Browser](./demos/genome-browser/)** | 5182 | Track-based viewer with gene, mutation, signal tracks | `cd demos/genome-browser && npm run dev` |
| **[Dataset Selector](./demos/dataset-selector/)** | 5183 | Landing page with dataset cards and view navigation | `cd demos/dataset-selector && npm run dev` |

### Quick Start - Run All Demos

```bash
# Install dependencies
for dir in linked-portal oncoprint genome-browser dataset-selector; do
  (cd demos/$dir && npm install)
done

# Run any demo
cd demos/linked-portal && npm run dev   # http://localhost:5180
```

See [demos/README.md](./demos/README.md) for detailed documentation.

## 📁 Project Structure

```
genomic-viz-platform/
├── tutorials/              # 25+ learning modules
│   ├── TUTORIAL_INDEX.md   # Complete curriculum
│   └── INTERVIEW_PREP.md   # Technical Q&A guide
├── capstone/               # Integration project
├── datasets/               # Sample genomic data
│   ├── mutations/          # TP53, BRCA1 mutations
│   ├── clinical/           # Sample metadata
│   └── references/         # Gene annotations
├── shared/                 # Common TypeScript types
├── docs/                   # Technical documentation
└── docker-compose.yml      # Development environment
```

## 🛠️ Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  D3.js v7 │ Canvas API │ WebGL │ TypeScript │ Vite          │
├─────────────────────────────────────────────────────────────┤
│                        Backend                               │
│  Node.js │ Express │ REST API │ WebSocket                   │
├─────────────────────────────────────────────────────────────┤
│                        Data Layer                            │
│  PostgreSQL │ SQLite │ tabix │ BigWig │ HDF5                │
├─────────────────────────────────────────────────────────────┤
│                        Performance                           │
│  Rust (napi-rs) │ WebAssembly │ Web Workers                 │
├─────────────────────────────────────────────────────────────┤
│                        AI Integration                        │
│  OpenAI API │ RAG │ LangChain │ Embeddings                  │
└─────────────────────────────────────────────────────────────┘
```

## 📖 Documentation

| Document                                                                                             | Description                                   |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [Tutorial Index](./tutorials/TUTORIAL_INDEX.md)                                                      | Complete learning path with progress tracking |
| [Interview Prep](./tutorials/INTERVIEW_PREP.md)                                                      | Technical Q&A for genomic viz roles           |
| [GenomePaint Tutorial](./tutorials/phase-4-production/10-proteinpaint-embed/GENOMEPAINT_TUTORIAL.md) | Deep dive into ProteinPaint architecture      |
| [Feature Analysis](./docs/PROTEINPAINT_FEATURE_ANALYSIS.md)                                          | Comparison with ProteinPaint features         |
| [Technology Overview](./docs/TECHNOLOGY_OVERVIEW.md)                                                 | Stack decisions and rationale                 |

## 🎓 Inspired By

This project is designed to build skills relevant to genomic visualization platforms:

- **[ProteinPaint](https://github.com/stjude/proteinpaint)** - St. Jude Children's Research Hospital
- **[GenomePaint](https://genomepaint.stjude.cloud/)** - Multi-sample cancer visualization
- **[cBioPortal](https://www.cbioportal.org/)** - Cancer genomics portal
- **[IGV.js](https://github.com/igvteam/igv.js)** - Integrative Genomics Viewer

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for a specific tutorial
cd tutorials/phase-4-production/01-testing
npm test

# Run with coverage
npm run test:coverage
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Author:** Sanjeeva Reddy Dodlapati  
**Repository:** [github.com/sdodlapati3/genomic-viz-platform](https://github.com/sdodlapati3/genomic-viz-platform)

_Built with ❤️ for learning genomic visualization_
