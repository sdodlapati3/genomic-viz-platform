[← Back to Tutorials Index](../README.md)

---

# Phase 4: Production & DevOps Skills

This phase covers professional software development practices and production-ready patterns for genomic visualization tools.

## Tutorials

### DevOps & Infrastructure

#### [4.1 Testing Strategy for Visualizations](01-testing/README.md)

Write comprehensive tests for data transformations and visual components.

#### [4.2 CI/CD Pipeline with GitHub Actions](02-cicd/README.md)

Automate testing, building, and deployment workflows.

#### [4.3 AI Chatbot for Data Queries](03-ai-chatbot/README.md)

Integrate LLMs for natural language data exploration.

#### [4.4 Rust for High-Performance Parsing](04-rust-parsing/README.md)

Build high-performance file parsers with Rust and Node.js integration.

#### [4.5 Rust WebAssembly Integration](05-rust-wasm/README.md)

Compile Rust to WebAssembly for browser-based performance.

#### [4.6 Multi-View Coordination](06-multi-view-coordination/README.md)

Coordinate state across multiple visualization panels.

---

### ProteinPaint-Style Production Patterns ⭐

These tutorials demonstrate production patterns directly inspired by St. Jude's ProteinPaint:

#### [4.7 Interactive Protein Panel](07-protein-panel/README.md) 🆕

Build a complete protein mutation visualization with TypeScript, D3.js, and component architecture.

- **Port:** 5181
- **Key Skills:** TypeScript + D3, Component patterns, Protein domains, Mutation lollipops

#### [4.8 Linked Views & Multi-Panel Coordination](08-linked-views/README.md) 🆕

Implement coordinated multi-view visualizations with shared selection state.

- **Port:** 5183
- **Key Skills:** Event bus, Selection store, Brush selection, Reactive updates

#### [4.9 Config Schema & Validation System](09-config-system/README.md) 🆕

Build robust configuration management with Zod validation and migrations.

- **Port:** 5184
- **Key Skills:** Zod schemas, Version migrations, URL state, Config editor UI

---

## Quick Start for New Tutorials

```bash
# Tutorial 4.7 - Protein Panel
cd tutorials/phase-4-production/07-protein-panel
npm install && npm run dev  # Opens on localhost:5181

# Tutorial 4.8 - Linked Views
cd tutorials/phase-4-production/08-linked-views
npm install && npm run dev  # Opens on localhost:5183

# Tutorial 4.9 - Config System
cd tutorials/phase-4-production/09-config-system
npm install && npm run dev  # Opens on localhost:5184
```

## Prerequisites

- Phase 1-3 completion
- TypeScript fundamentals
- D3.js basics (covered in Phase 1)
- Basic Git/GitHub knowledge

## Learning Outcomes

By completing this phase, you will be able to:

- Write effective tests for visualization code
- Set up automated CI/CD pipelines
- Integrate AI assistants into data applications
- Use Rust for performance-critical components
- **Build type-safe visualizations with TypeScript + D3.js** ⭐
- **Implement coordinated multi-panel visualizations** ⭐
- **Create robust configuration systems with schema validation** ⭐

## Connection to St. Jude ProteinPaint

| Tutorial          | ProteinPaint Equivalent         |
| ----------------- | ------------------------------- |
| 4.7 Protein Panel | Lollipop plot, domain rendering |
| 4.8 Linked Views  | Multi-track coordination        |
| 4.9 Config System | Configuration management        |
