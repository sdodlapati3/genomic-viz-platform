# Capstone Project: Mini-ProteinPaint

A production-quality genomic data visualization platform demonstrating all skills from the tutorial phases.

## Overview

This capstone project integrates everything learned across all phases into a cohesive, deployable application.

## Architecture

```
capstone/
├── client/          # Frontend visualization app
├── server/          # Node.js REST API
├── R/               # R statistical scripts
├── python/          # AI/ML components
└── rust/            # High-performance modules
```

## Features

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
