# Genomic Visualization Platform - Learning Roadmap

> **Goal**: Build production-quality skills for the St. Jude ProteinPaint team position through hands-on tutorials and a capstone project.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Phase 1: Frontend Visualization Fundamentals](#phase-1-frontend-visualization-fundamentals)
4. [Phase 2: Backend & Data Processing](#phase-2-backend--data-processing)
5. [Phase 3: Advanced Genomic Visualizations](#phase-3-advanced-genomic-visualizations)
6. [Phase 4: Production & DevOps Skills](#phase-4-production--devops-skills)
7. [Phase 5: Capstone Project](#phase-5-capstone-project)
8. [Resources & References](#resources--references)
9. [Progress Tracking](#progress-tracking)

---

## Project Overview

### Target Position Skills (from Job Description)

| Skill Category | Required Technologies | Priority |
|---------------|----------------------|----------|
| Full-stack Web Development | Linux, JavaScript, Node.js | **Critical** |
| Data Analysis Languages | R, Python | **Critical** |
| High-Performance Computing | Rust | **High** |
| Database | SQL | **High** |
| AI Integration | LLM APIs, RAG | **High** |
| DevOps | Testing, CI/CD | **High** |
| Domain Knowledge | Cancer genomics, multi-omics | **Critical** |

### Learning Approach

```
Tutorial Structure (for each topic):
├── README.md           → Concept explanation, learning objectives
├── docs/               → Detailed documentation, diagrams
├── src/                → Implementation code (step-by-step)
├── data/               → Sample datasets
├── tests/              → Unit and integration tests
├── exercises/          → Practice problems
└── solutions/          → Exercise solutions
```

### Repository Structure

```
genomic-viz-platform/
├── LEARNING_ROADMAP.md          # This file
├── README.md                    # Project overview
├── package.json                 # Root package configuration
├── docker-compose.yml           # Development environment
│
├── tutorials/                   # Learning modules
│   ├── phase-1-frontend/
│   ├── phase-2-backend/
│   ├── phase-3-advanced-viz/
│   └── phase-4-production/
│
├── capstone/                    # Final integrated project
│   ├── client/                  # Frontend application
│   ├── server/                  # Backend API
│   ├── rust/                    # Performance modules
│   ├── R/                       # Statistical analysis
│   └── python/                  # AI/ML components
│
├── shared/                      # Shared utilities and types
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Common utilities
│
└── datasets/                    # Genomic data samples
    ├── mutations/               # Variant data (VCF, MAF)
    ├── expression/              # Gene expression matrices
    ├── clinical/                # Sample clinical data
    └── references/              # Gene/protein references
```

---

## Technology Stack

### Core Technologies

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | JavaScript/TypeScript | ES2022+ | Core language |
| **Visualization** | D3.js | v7.x | Data-driven visualizations |
| **Canvas** | HTML5 Canvas API | - | High-performance rendering |
| **Backend** | Node.js | v20+ | Server runtime |
| **Framework** | Express.js | v4.x | REST API |
| **Database** | PostgreSQL | v15+ | Relational data storage |
| **Statistics** | R | v4.x | Statistical analysis |
| **Data Science** | Python | v3.11+ | Data processing, AI |
| **Performance** | Rust | Latest | High-performance parsing |
| **Containerization** | Docker | Latest | Development environment |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Vite** | Frontend build tool |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **GitHub Actions** | CI/CD |
| **Docker Compose** | Local development |

---

## Phase 1: Frontend Visualization Fundamentals

**Duration**: 2-3 weeks  
**Objective**: Master the core visualization technologies used in ProteinPaint

### Tutorial 1.1: SVG & Canvas Fundamentals

**Learning Objectives**:
- Understand SVG vs Canvas trade-offs
- Master SVG elements (rect, circle, path, text, g)
- Learn Canvas 2D context API
- Implement basic interactivity (hover, click, drag)

**Topics Covered**:
```
1. SVG Basics
   ├── Coordinate system and viewBox
   ├── Basic shapes (rect, circle, ellipse, line, polyline, polygon)
   ├── Path commands (M, L, C, Q, A, Z)
   ├── Text rendering and positioning
   ├── Grouping and transformations
   └── Styling (fill, stroke, opacity)

2. Canvas Basics
   ├── Canvas context and pixel manipulation
   ├── Drawing shapes and paths
   ├── Text rendering
   ├── Image manipulation
   └── Performance considerations

3. Interactivity
   ├── Event handling (mouse, touch)
   ├── Hit detection in Canvas
   ├── SVG event delegation
   └── Tooltips and hover states
```

**Deliverables**:
- [ ] Interactive SVG shape playground
- [ ] Canvas performance benchmark
- [ ] Comparison documentation

**Estimated Time**: 3-4 days

---

### Tutorial 1.2: D3.js Core Concepts

**Learning Objectives**:
- Master D3 selections and data binding
- Understand scales, axes, and domains
- Implement enter/update/exit pattern
- Create responsive visualizations

**Topics Covered**:
```
1. Selections & Data Binding
   ├── d3.select() and d3.selectAll()
   ├── .data() and data joins
   ├── .enter(), .update(), .exit()
   ├── .join() (modern approach)
   └── Key functions for object constancy

2. Scales
   ├── Linear scales (scaleLinear)
   ├── Logarithmic scales (scaleLog)
   ├── Band scales (scaleBand)
   ├── Ordinal scales (scaleOrdinal)
   ├── Color scales (scaleSequential, scaleDiverging)
   └── Time scales (scaleTime)

3. Axes
   ├── axisTop, axisBottom, axisLeft, axisRight
   ├── Tick formatting
   ├── Custom tick values
   └── Axis styling

4. Layouts
   ├── d3.stack() for stacked charts
   ├── d3.hierarchy() for trees
   └── d3.forceSimulation() basics
```

**Deliverables**:
- [ ] Reusable bar chart component
- [ ] Interactive scatter plot with zoom
- [ ] Line chart with transitions

**Estimated Time**: 4-5 days

---

### Tutorial 1.3: Mutation Lollipop Plot ⭐ (Signature Viz)

**Learning Objectives**:
- Understand protein domain visualization
- Map genomic coordinates to visual space
- Implement mutation clustering
- Create interactive tooltips with mutation details

**Topics Covered**:
```
1. Genomic Concepts
   ├── Protein structure (domains, motifs)
   ├── Amino acid positions
   ├── Mutation types (missense, nonsense, frameshift)
   ├── Mutation frequency and recurrence
   └── Gene/transcript models

2. Visualization Components
   ├── Protein backbone (linear representation)
   ├── Domain rectangles with labels
   ├── Lollipop stems and heads
   ├── Mutation clustering algorithm
   ├── Color coding by mutation type
   └── Frequency-based sizing

3. Interactivity
   ├── Hover tooltips (mutation details)
   ├── Click to filter/highlight
   ├── Zoom to region
   └── Export functionality
```

**Sample Data**: TP53, KRAS, EGFR mutations from public datasets

**Deliverables**:
- [ ] Complete lollipop plot component
- [ ] Domain annotation system
- [ ] Mutation data parser
- [ ] Interactive demo page

**Estimated Time**: 5-6 days

---

### Tutorial 1.4: Genome Browser Track

**Learning Objectives**:
- Understand genomic coordinate systems
- Implement track-based visualization
- Handle large-scale data efficiently
- Create synchronized multi-track views

**Topics Covered**:
```
1. Genomic Coordinates
   ├── Chromosome naming conventions
   ├── 0-based vs 1-based coordinates
   ├── Strand orientation (+/-)
   ├── Coordinate transformations
   └── Reference genome versions (hg19, hg38)

2. Track Types
   ├── Gene/transcript tracks
   ├── Quantitative tracks (BigWig concept)
   ├── Variant tracks
   ├── Region/annotation tracks
   └── Read alignment visualization

3. Navigation
   ├── Pan and zoom mechanics
   ├── Coordinate input parsing
   ├── Bookmark/history management
   └── Region search
```

**Deliverables**:
- [ ] Mini genome browser with gene track
- [ ] Zoom/pan navigation
- [ ] Coordinate display and input
- [ ] Track layering system

**Estimated Time**: 5-6 days

---

## Phase 2: Backend & Data Processing

**Duration**: 2-3 weeks  
**Objective**: Build robust APIs and data pipelines for genomic data

### Tutorial 2.1: Node.js REST API for Genomics

**Learning Objectives**:
- Design RESTful endpoints for genomic queries
- Implement efficient data streaming
- Handle large file uploads
- Create authentication/authorization

**Topics Covered**:
```
1. API Design
   ├── Resource modeling (genes, variants, samples)
   ├── Query parameter design
   ├── Pagination strategies
   ├── Error handling patterns
   └── Response formatting

2. Express.js Implementation
   ├── Router organization
   ├── Middleware (auth, logging, validation)
   ├── Request validation (Joi/Zod)
   ├── File upload handling (multer)
   └── Streaming responses

3. Performance
   ├── Caching strategies (Redis)
   ├── Response compression
   ├── Connection pooling
   └── Rate limiting
```

**API Endpoints to Implement**:
```
GET  /api/genes/:symbol          # Gene information
GET  /api/genes/:symbol/variants # Variants for a gene
GET  /api/variants               # Search variants
POST /api/variants/annotate      # Annotate uploaded variants
GET  /api/samples                # Sample metadata
GET  /api/samples/:id/mutations  # Mutations for a sample
```

**Deliverables**:
- [ ] Complete REST API server
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Request validation middleware
- [ ] Error handling system

**Estimated Time**: 4-5 days

---

### Tutorial 2.2: PostgreSQL for Genomic Data

**Learning Objectives**:
- Design schemas for genomic data
- Optimize queries for variant lookups
- Implement full-text search for genes
- Handle large-scale data imports

**Topics Covered**:
```
1. Schema Design
   ├── Gene table (symbol, name, coordinates)
   ├── Transcript table (exons, CDS)
   ├── Variant table (position, ref, alt, annotations)
   ├── Sample table (metadata, phenotypes)
   ├── Sample-variant junction (genotypes)
   └── Indexing strategies

2. Query Patterns
   ├── Range queries (variants in region)
   ├── Aggregation (mutation frequencies)
   ├── Joins (variants with samples)
   ├── Full-text search (gene names)
   └── JSON/JSONB for flexible annotations

3. Performance
   ├── EXPLAIN ANALYZE usage
   ├── Index types (B-tree, GiST, GIN)
   ├── Partitioning by chromosome
   └── Materialized views for summaries
```

**Deliverables**:
- [ ] Database schema with migrations
- [ ] Seed data scripts
- [ ] Query optimization examples
- [ ] Data import pipeline

**Estimated Time**: 4-5 days

---

### Tutorial 2.3: Genomic File Parsing (VCF, MAF, BED)

**Learning Objectives**:
- Parse standard genomic file formats
- Handle large files with streaming
- Implement in JavaScript, then optimize with Rust
- Create format converters

**Topics Covered**:
```
1. File Formats
   ├── VCF (Variant Call Format)
   │   ├── Header parsing (##INFO, ##FORMAT)
   │   ├── Variant records
   │   ├── Genotype fields
   │   └── Multi-allelic handling
   │
   ├── MAF (Mutation Annotation Format)
   │   ├── Column definitions
   │   ├── Variant classification
   │   └── Annotation fields
   │
   ├── BED (Browser Extensible Data)
   │   ├── 3-column vs extended BED
   │   ├── Track lines
   │   └── Score and color fields
   │
   └── BigWig/BigBed (binary indexed formats)

2. Parsing Strategies
   ├── Line-by-line streaming
   ├── Chunk processing
   ├── Index file usage (.tbi, .bai)
   └── Memory management

3. Rust Implementation
   ├── Rust basics for the parser
   ├── napi-rs for Node.js binding
   ├── Performance comparison
   └── WebAssembly compilation
```

**Deliverables**:
- [ ] JavaScript VCF parser
- [ ] JavaScript MAF parser
- [ ] Rust VCF parser with Node binding
- [ ] Performance benchmarks

**Estimated Time**: 5-6 days

---

### Tutorial 2.4: R Integration for Statistical Analysis

**Learning Objectives**:
- Call R from Node.js
- Implement survival analysis
- Create statistical test endpoints
- Generate R-based visualizations

**Topics Covered**:
```
1. R-Node.js Integration
   ├── child_process approach
   ├── Rserve connection
   ├── OpenCPU REST API
   └── Data serialization (JSON, feather)

2. Statistical Methods
   ├── Survival analysis (survminer, survival)
   │   ├── Kaplan-Meier curves
   │   ├── Cox proportional hazards
   │   └── Log-rank tests
   │
   ├── Differential expression
   │   ├── DESeq2 basics
   │   ├── Volcano plot data
   │   └── Multiple testing correction
   │
   └── Enrichment analysis
       ├── Gene set enrichment (GSEA)
       ├── Over-representation analysis
       └── Pathway visualization

3. API Endpoints
   ├── POST /api/analysis/survival
   ├── POST /api/analysis/differential
   ├── POST /api/analysis/enrichment
   └── Result caching and retrieval
```

**Deliverables**:
- [ ] R script collection for common analyses
- [ ] Node.js-R bridge implementation
- [ ] Statistical analysis API endpoints
- [ ] Result visualization components

**Estimated Time**: 5-6 days

---

## Phase 3: Advanced Genomic Visualizations

**Duration**: 2-3 weeks  
**Objective**: Build complex visualizations found in ProteinPaint/GenomePaint

### Tutorial 3.1: UMAP/t-SNE Scatter Plot

**Learning Objectives**:
- Visualize high-dimensional data
- Implement efficient rendering for large point clouds
- Create interactive selection and filtering
- Add metadata overlays

**Topics Covered**:
```
1. Dimensionality Reduction Concepts
   ├── PCA vs t-SNE vs UMAP
   ├── Perplexity and n_neighbors
   ├── Interpreting clusters
   └── Batch effects

2. Visualization Implementation
   ├── Canvas-based rendering (performance)
   ├── Quadtree for hit detection
   ├── Lasso selection
   ├── Color by metadata (categorical, continuous)
   ├── Point size by value
   └── Density contours

3. Interactivity
   ├── Zoom and pan
   ├── Brush selection
   ├── Linked views (selection sync)
   └── Animation between projections
```

**Deliverables**:
- [ ] High-performance scatter plot (10k+ points)
- [ ] Lasso selection tool
- [ ] Metadata overlay controls
- [ ] Export selected points

**Estimated Time**: 4-5 days

---

### Tutorial 3.2: Gene Expression Heatmap with Clustering

**Learning Objectives**:
- Implement hierarchical clustering visualization
- Create efficient heatmap rendering
- Add row/column dendrograms
- Enable interactive exploration

**Topics Covered**:
```
1. Clustering Concepts
   ├── Distance metrics (Euclidean, correlation)
   ├── Linkage methods (complete, average, ward)
   ├── Dendrogram construction
   └── Cluster cutting

2. Heatmap Implementation
   ├── Canvas rendering for cells
   ├── SVG for labels and dendrograms
   ├── Color scale selection
   ├── Row/column ordering
   └── Cell annotations

3. Interactivity
   ├── Zoom to region
   ├── Row/column highlighting
   ├── Tooltip with values
   ├── Dendrogram branch selection
   └── Reordering controls
```

**Deliverables**:
- [ ] Clustered heatmap component
- [ ] Dendrogram visualization
- [ ] Interactive zoom and selection
- [ ] Multiple color scale options

**Estimated Time**: 5-6 days

---

### Tutorial 3.3: Kaplan-Meier Survival Curves

**Learning Objectives**:
- Understand survival analysis concepts
- Implement step-function visualization
- Add confidence intervals
- Create stratified comparisons

**Topics Covered**:
```
1. Survival Analysis Concepts
   ├── Time-to-event data
   ├── Censoring (right, left, interval)
   ├── Hazard and survival functions
   ├── Log-rank test
   └── Cox regression basics

2. Visualization Components
   ├── Step function rendering
   ├── Confidence interval bands
   ├── Risk table below plot
   ├── Multiple group comparison
   ├── Median survival lines
   └── P-value annotation

3. Interactivity
   ├── Hover for survival probability
   ├── Toggle groups
   ├── Time range selection
   └── Export data/image
```

**Deliverables**:
- [ ] Kaplan-Meier plot component
- [ ] Risk table component
- [ ] Statistical summary panel
- [ ] R integration for calculations

**Estimated Time**: 4-5 days

---

### Tutorial 3.4: Volcano Plot for Differential Expression

**Learning Objectives**:
- Visualize statistical significance vs effect size
- Implement point labeling strategies
- Add interactive filtering
- Create linked gene selection

**Topics Covered**:
```
1. Differential Expression Concepts
   ├── Fold change calculation
   ├── P-value vs adjusted p-value
   ├── Significance thresholds
   └── Effect size interpretation

2. Visualization Implementation
   ├── Log2 fold change (x-axis)
   ├── -log10(p-value) (y-axis)
   ├── Threshold lines
   ├── Point coloring (up/down/ns)
   ├── Label collision avoidance
   └── Density-based label selection

3. Interactivity
   ├── Brush to select genes
   ├── Search and highlight gene
   ├── Adjustable thresholds
   ├── Click for gene details
   └── Export gene lists
```

**Deliverables**:
- [x] Volcano plot component (Canvas-based for 20k+ genes)
- [x] Dynamic threshold controls (FC and p-value sliders)
- [x] Gene labeling system (top 12 significant genes)
- [x] Gene search and highlight
- [x] Hover tooltips with gene details
- [ ] Selection export (future enhancement)

**Implementation Notes**:
- Uses Canvas + SVG hybrid approach for performance
- Handles 20,000 genes (full human transcriptome scale)
- Throttled mouse events prevent UI lag
- Batch drawing by color reduces draw calls

**Estimated Time**: 4-5 days

---

### Tutorial 3.5: Oncoprint/Mutation Matrix

**Learning Objectives**:
- Display mutation patterns across samples
- Implement track-based co-mutation view
- Add sorting and grouping
- Create summary statistics

**Topics Covered**:
```
1. Oncoprint Concepts
   ├── Gene x Sample matrix
   ├── Mutation type encoding
   ├── Co-occurrence patterns
   ├── Mutual exclusivity
   └── Clinical annotation tracks

2. Visualization Components
   ├── Matrix grid rendering
   ├── Glyph design for mutation types
   ├── Track headers and labels
   ├── Summary bar charts (top/side)
   ├── Clinical annotation rows
   └── Legend design

3. Interactivity
   ├── Sort by frequency/gene/clinical
   ├── Group samples
   ├── Filter by mutation type
   ├── Hover details
   └── Column/row selection
```

**Deliverables**:
- [ ] Oncoprint matrix component
- [ ] Multiple mutation type glyphs
- [ ] Sorting and grouping controls
- [ ] Summary statistics panel

**Estimated Time**: 5-6 days

---

## Phase 4: Production & DevOps Skills

**Duration**: 2 weeks  
**Objective**: Learn professional software development practices

### Tutorial 4.1: Testing Strategy for Visualizations

**Learning Objectives**:
- Write unit tests for data transformations
- Test visualization rendering
- Implement integration tests
- Set up E2E testing

**Topics Covered**:
```
1. Unit Testing
   ├── Testing data parsing functions
   ├── Scale and coordinate calculations
   ├── Mocking D3 selections
   ├── Snapshot testing for SVG
   └── Coverage reporting

2. Integration Testing
   ├── API endpoint testing
   ├── Database query testing
   ├── R integration testing
   └── File parsing validation

3. E2E Testing
   ├── Playwright setup
   ├── Visual regression testing
   ├── Interaction testing
   └── Cross-browser testing
```

**Deliverables**:
- [ ] Test suite for all tutorials
- [ ] CI test automation
- [ ] Coverage reports
- [ ] Visual regression baseline

**Estimated Time**: 4-5 days

---

### Tutorial 4.2: CI/CD Pipeline with GitHub Actions

**Learning Objectives**:
- Automate testing and builds
- Implement deployment workflows
- Set up Docker image building
- Create release automation

**Topics Covered**:
```
1. GitHub Actions Basics
   ├── Workflow syntax
   ├── Job dependencies
   ├── Matrix builds
   ├── Secrets management
   └── Artifact handling

2. CI Pipeline
   ├── Lint on PR
   ├── Test on PR
   ├── Build verification
   ├── Coverage enforcement
   └── Security scanning

3. CD Pipeline
   ├── Semantic versioning
   ├── Changelog generation
   ├── Docker image building
   ├── Registry publishing
   └── Deployment triggers
```

**Deliverables**:
- [ ] Complete CI workflow
- [ ] Docker build workflow
- [ ] Release automation
- [ ] Deployment documentation

**Estimated Time**: 3-4 days

---

### Tutorial 4.3: AI Chatbot for Data Queries

**Learning Objectives**:
- Integrate LLM APIs (OpenAI/Anthropic)
- Implement RAG for genomic knowledge
- Create natural language data queries
- Build conversation context management

**Topics Covered**:
```
1. LLM Integration
   ├── API setup and authentication
   ├── Prompt engineering for genomics
   ├── Streaming responses
   ├── Token management
   └── Error handling

2. RAG Implementation
   ├── Document chunking
   ├── Embedding generation
   ├── Vector storage (pgvector)
   ├── Similarity search
   └── Context injection

3. Data Query Interface
   ├── Natural language to SQL
   ├── Query validation
   ├── Result explanation
   ├── Visualization suggestions
   └── Follow-up handling
```

**Deliverables**:
- [ ] Chat interface component
- [ ] LLM integration service
- [ ] RAG pipeline
- [ ] Example genomic queries

**Estimated Time**: 5-6 days

---

### Tutorial 4.4: Rust for High-Performance Parsing

**Learning Objectives**:
- Learn Rust basics for systems programming
- Build Node.js native modules with napi-rs
- Compile to WebAssembly
- Benchmark against JavaScript

**Topics Covered**:
```
1. Rust Fundamentals
   ├── Ownership and borrowing
   ├── Structs and enums
   ├── Error handling (Result, Option)
   ├── Iterators and closures
   └── Cargo and crates

2. Node.js Integration
   ├── napi-rs setup
   ├── Type mapping (JS ↔ Rust)
   ├── Async functions
   ├── Buffer handling
   └── Build configuration

3. WebAssembly
   ├── wasm-bindgen
   ├── Browser compilation
   ├── Memory management
   └── Performance profiling
```

**Deliverables**:
- [ ] Rust VCF parser
- [ ] Node.js native module
- [ ] WebAssembly build
- [ ] Performance comparison

**Estimated Time**: 5-6 days

---

## Phase 5: Capstone Project

**Duration**: 3-4 weeks  
**Objective**: Build a production-quality genomic visualization platform

### Project: Mini-ProteinPaint

A simplified but complete genomic data visualization platform demonstrating all learned skills.

**Features**:
```
1. Data Management
   ├── Upload VCF/MAF files
   ├── Sample metadata management
   ├── Gene/variant database
   └── User sessions

2. Visualizations
   ├── Lollipop plot (mutations)
   ├── Genome browser (simplified)
   ├── UMAP scatter plot
   ├── Survival curves
   ├── Volcano plot
   └── Oncoprint matrix

3. Analysis
   ├── Variant annotation
   ├── Survival analysis (R)
   ├── Differential expression
   └── Gene set enrichment

4. AI Features
   ├── Natural language queries
   ├── Data exploration assistant
   └── Visualization recommendations

5. Infrastructure
   ├── Docker deployment
   ├── CI/CD pipeline
   ├── Comprehensive tests
   └── Documentation
```

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   D3.js     │ │   Canvas    │ │   React/Vanilla JS  │   │
│  │   Charts    │ │   Renderer  │ │   Components        │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Node.js Backend                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │  REST API   │ │  File       │ │   WebSocket         │   │
│  │  (Express)  │ │  Parsing    │ │   (Real-time)       │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                │                    │
         ▼                ▼                    ▼
┌──────────────┐  ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │  │     R        │    │   Python     │
│  (Data)      │  │ (Statistics) │    │   (AI/ML)    │
└──────────────┘  └──────────────┘    └──────────────┘
         │
         ▼
┌──────────────┐
│    Rust      │
│  (Parsing)   │
└──────────────┘
```

**Deliverables**:
- [ ] Complete working application
- [ ] Docker Compose deployment
- [ ] Comprehensive documentation
- [ ] Video demo
- [ ] GitHub repository with CI/CD

---

## Resources & References

### Official Documentation
- [D3.js Documentation](https://d3js.org/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Rust Book](https://doc.rust-lang.org/book/)

### Genomics Resources
- [ProteinPaint GitHub](https://github.com/stjude/proteinpaint)
- [GenomePaint Paper](https://pubmed.ncbi.nlm.nih.gov/33434514/)
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

## Progress Tracking

### Phase 1: Frontend Visualization Fundamentals
| Tutorial | Status | Start Date | End Date | Notes |
|----------|--------|------------|----------|-------|
| 1.1 SVG & Canvas | ⬜ Not Started | | | |
| 1.2 D3.js Core | ⬜ Not Started | | | |
| 1.3 Lollipop Plot | ⬜ Not Started | | | |
| 1.4 Genome Browser | ⬜ Not Started | | | |

### Phase 2: Backend & Data Processing
| Tutorial | Status | Start Date | End Date | Notes |
|----------|--------|------------|----------|-------|
| 2.1 Node.js API | ⬜ Not Started | | | |
| 2.2 PostgreSQL | ⬜ Not Started | | | |
| 2.3 File Parsing | ⬜ Not Started | | | |
| 2.4 R Integration | ⬜ Not Started | | | |

### Phase 3: Advanced Visualizations
| Tutorial | Status | Start Date | End Date | Notes |
|----------|--------|------------|----------|-------|
| 3.1 UMAP Scatter | ✅ Complete | Dec 12 | Dec 12 | WebGL rendering, 10k+ points |
| 3.2 Heatmap | ✅ Complete | Dec 12 | Dec 12 | Canvas-based, clustering |
| 3.3 Survival Curves | ✅ Complete | Dec 13 | Dec 13 | Kaplan-Meier, log-rank test |
| 3.4 Volcano Plot | ✅ Complete | Dec 13 | Dec 13 | Canvas rendering, 20k genes |
| 3.5 Oncoprint | ⬜ Not Started | | | |

### Phase 4: Production Skills
| Tutorial | Status | Start Date | End Date | Notes |
|----------|--------|------------|----------|-------|
| 4.1 Testing | ⬜ Not Started | | | |
| 4.2 CI/CD | ⬜ Not Started | | | |
| 4.3 AI Chatbot | ⬜ Not Started | | | |
| 4.4 Rust Parsing | ⬜ Not Started | | | |

### Phase 5: Capstone
| Milestone | Status | Start Date | End Date | Notes |
|-----------|--------|------------|----------|-------|
| Architecture | ⬜ Not Started | | | |
| Backend | ⬜ Not Started | | | |
| Frontend | ⬜ Not Started | | | |
| Integration | ⬜ Not Started | | | |
| Testing | ⬜ Not Started | | | |
| Documentation | ⬜ Not Started | | | |

---

## Timeline Summary

| Phase | Duration | Topics |
|-------|----------|--------|
| **Phase 1** | 2-3 weeks | SVG, Canvas, D3.js, Lollipop, Genome Browser |
| **Phase 2** | 2-3 weeks | Node.js, PostgreSQL, File Parsing, R |
| **Phase 3** | 2-3 weeks | UMAP, Heatmap, Survival, Volcano, Oncoprint |
| **Phase 4** | 2 weeks | Testing, CI/CD, AI, Rust |
| **Phase 5** | 3-4 weeks | Capstone Project |
| **Total** | ~12-15 weeks | Complete skill development |

---

*Last Updated: December 13, 2025*
