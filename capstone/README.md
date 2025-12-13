# Mini-ProteinPaint

## Phase 5 Capstone Project

A comprehensive genomic visualization platform inspired by St. Jude's ProteinPaint, integrating all skills learned throughout the tutorial phases.

## 🎯 Project Overview

Mini-ProteinPaint demonstrates production-ready genomic visualization capabilities:

- **Mutation Analysis**: Lollipop plots with protein domains, Oncoprint matrix
- **Gene Expression**: Heatmaps, Volcano plots, UMAP clustering
- **Survival Analysis**: Kaplan-Meier curves, Forest plots, Cox regression
- **AI Assistant**: Natural language querying of genomic data
- **File Handling**: VCF, MAF, CSV/TSV file upload and parsing

## 🏗️ Architecture

```
capstone/
├── client/                 # Frontend (Vite + D3.js)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── visualizations/ # D3.js visualization views
│   │   ├── services/       # Data services
│   │   └── styles/         # CSS styles
│   └── index.html
├── server/                 # Backend (Express.js)
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/          # Utilities
│   │   └── data/           # Sample data
│   └── tests/              # API tests
└── shared/                 # Shared types & utilities
    └── src/
        ├── types/          # Type definitions
        └── utils/          # Utility functions
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd capstone
npm install
npm run dev
```

This starts:
- Client: http://localhost:5173
- Server: http://localhost:3001

## 📊 Features

### Core Visualizations
- Mutation lollipop plot
- Mini genome browser
- UMAP scatter plot
- Survival curves
- Expression heatmap
- Volcano plot
- Oncoprint matrix

### Data Management
- VCF/MAF file upload
- Sample metadata management
- Cohort builder

### Analysis
- Variant annotation
- Survival analysis
- Differential expression
- Gene set enrichment

### AI Features
- Natural language data queries
- Visualization recommendations

## Getting Started

```bash
# From project root
npm run docker:up
npm run dev
```

## Development

See individual component READMEs for detailed development instructions.
