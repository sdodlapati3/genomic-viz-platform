# Genomic Visualization Platform

> A comprehensive learning project for building production-quality genomic data visualization tools, inspired by St. Jude's ProteinPaint platform.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

## 🎯 Project Goals

This project serves as a hands-on learning platform for developing skills required in computational biology software development, specifically targeting:

- **Interactive Data Visualization**: D3.js, Canvas, SVG
- **Full-Stack Development**: Node.js, Express, PostgreSQL
- **Statistical Analysis**: R integration, survival analysis
- **High-Performance Computing**: Rust for parsing
- **AI Integration**: LLM-powered data exploration
- **Production Practices**: Testing, CI/CD, Docker

## 📚 Learning Structure

```
This repository is organized into progressive tutorials:

tutorials/
├── phase-1-frontend/       # Visualization fundamentals
│   ├── 01-svg-canvas/      # SVG & Canvas basics
│   ├── 02-d3-core/         # D3.js core concepts
│   ├── 03-lollipop-plot/   # Mutation visualization
│   └── 04-genome-browser/  # Genomic coordinate viz
│
├── phase-2-backend/        # Data infrastructure
│   ├── 01-nodejs-api/      # REST API development
│   ├── 02-postgresql/      # Database design
│   ├── 03-file-parsing/    # VCF/MAF/BED parsing
│   └── 04-r-integration/   # Statistical analysis
│
├── phase-3-advanced-viz/   # Complex visualizations
│   ├── 01-umap-scatter/    # Dimensionality reduction
│   ├── 02-heatmap/         # Gene expression clustering
│   ├── 03-survival-plot/   # Kaplan-Meier curves
│   ├── 04-volcano-plot/    # Differential expression
│   └── 05-oncoprint/       # Mutation matrices
│
└── phase-4-production/     # Professional skills
    ├── 01-testing/         # Test strategies
    ├── 02-cicd/            # GitHub Actions
    ├── 03-ai-chatbot/      # LLM integration
    └── 04-rust-parsing/    # High-performance code
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Docker** & **Docker Compose**
- **Git**

Optional (for full functionality):

- **R** >= 4.x (for statistical analysis)
- **Rust** (for high-performance parsing)
- **Python** >= 3.11 (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/genomic-viz-platform.git
cd genomic-viz-platform

# Install dependencies
npm install

# Start development environment
docker-compose up -d

# Run the development server
npm run dev
```

### Running Tutorials

Each tutorial can be run independently:

```bash
# Navigate to a specific tutorial
cd tutorials/phase-1-frontend/01-svg-canvas

# Install tutorial dependencies
npm install

# Start the tutorial
npm run dev
```

## 🛠️ Technology Stack

| Layer         | Technology            | Purpose              |
| ------------- | --------------------- | -------------------- |
| Frontend      | JavaScript/TypeScript | Core language        |
| Visualization | D3.js v7              | Data-driven graphics |
| Rendering     | Canvas API            | High-performance     |
| Backend       | Node.js + Express     | REST API             |
| Database      | PostgreSQL            | Data storage         |
| Statistics    | R                     | Analysis pipelines   |
| Performance   | Rust                  | File parsing         |
| AI            | Python + LLM APIs     | Chatbot              |
| Container     | Docker                | Development env      |

## 📊 Sample Visualizations

After completing the tutorials, you'll be able to create:

- **Mutation Lollipop Plots** - Visualize protein mutations
- **Genome Browser Tracks** - Navigate genomic coordinates
- **UMAP/t-SNE Scatter** - Single-cell data visualization
- **Survival Curves** - Kaplan-Meier analysis
- **Expression Heatmaps** - Clustered gene expression
- **Volcano Plots** - Differential expression
- **Oncoprint Matrices** - Mutation patterns

## 📁 Project Structure

```
genomic-viz-platform/
├── README.md               # This file
├── tutorials/TUTORIAL_INDEX.md  # Complete tutorial system
├── package.json            # Root configuration
├── docker-compose.yml      # Dev environment
├── .github/                # CI/CD workflows
│
├── tutorials/              # Learning modules
├── capstone/               # Final project
├── shared/                 # Common code
└── datasets/               # Sample data
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for a specific tutorial
npm test -- --filter=lollipop

# Run with coverage
npm run test:coverage
```

## 📖 Documentation

- [Tutorial System](./tutorials/TUTORIAL_INDEX.md) - Complete curriculum with progress tracking
- [GenomePaint Tutorial](./tutorials/phase-4-production/10-proteinpaint-embed/GENOMEPAINT_TUTORIAL.md) - Interview prep
- [API Documentation](./docs/api/) - REST API reference

## 🎓 Inspired By

- [ProteinPaint](https://proteinpaint.stjude.org/) - St. Jude Children's Research Hospital
- [GenomePaint](https://genomepaint.stjude.cloud/) - Multi-omics exploration
- [cBioPortal](https://www.cbioportal.org/) - Cancer genomics portal
- [IGV.js](https://github.com/igvteam/igv.js) - Genome visualization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is primarily a learning project, but suggestions and improvements are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📬 Contact

For questions about this learning project, please open an issue.

---

_Built with ❤️ for learning genomic visualization_
