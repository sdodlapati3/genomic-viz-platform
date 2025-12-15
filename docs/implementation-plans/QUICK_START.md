# Quick Start Guide: Tutorial Implementation

> Get started implementing the 5 priority tutorials

## Pre-Implementation Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Rust toolchain installed (`rustup`)
- [ ] wasm-pack installed (`cargo install wasm-pack`)
- [ ] Docker installed (for Redis caching later)

## Phase 1: Create Directory Structure

```bash
cd /Users/sanjeevadodlapati/Downloads/Repos/genomic-viz-platform/tutorials

# Phase 1 enhancement
mkdir -p phase-1-frontend/05-performance/{src,workers,benchmarks,exercises/solutions}

# Phase 2 new tutorial
mkdir -p phase-2-backend/05-binary-formats/{src/parsers,src/routes,src/examples,data,exercises/solutions}

# Phase 3 new tutorial
mkdir -p phase-3-advanced-viz/06-gene-fusion/{src/parsers,src/components,src/utils,public/data,exercises/solutions}

# Phase 4 enhancement
mkdir -p phase-4-production/04-rust-parsing/rust-genomics/{fisher/src,cluster/src,stats/src,wasm-bindings/src}
mkdir -p phase-4-production/04-rust-parsing/{node-bindings/native,web/src,benchmarks}

# Phase 5 new phase
mkdir -p phase-5-integration/01-multi-view/{src/state,src/coordination,src/components,src/layouts,src/export,exercises/solutions}
```

## Phase 2: Download Sample Data

```bash
# Create data download script
cat > scripts/download-sample-data.sh << 'EOF'
#!/bin/bash
set -e

echo "Downloading sample genomic data..."

# BAM sample (small region)
# Using publicly available test data
mkdir -p tutorials/phase-2-backend/05-binary-formats/data

# For BigWig, we'll create synthetic data in the tutorial
# Real data can be downloaded from ENCODE

# Gene fusion sample data
mkdir -p tutorials/phase-3-advanced-viz/06-gene-fusion/public/data

cat > tutorials/phase-3-advanced-viz/06-gene-fusion/public/data/sample-fusions.json << 'FUSIONS'
{
  "fusions": [
    {
      "id": "BCR--ABL1",
      "geneA": { "symbol": "BCR", "chr": "chr22", "breakpoint": 23179704, "strand": "+" },
      "geneB": { "symbol": "ABL1", "chr": "chr9", "breakpoint": 130854064, "strand": "+" },
      "evidence": { "total": 156, "junctionReads": 89, "spanningReads": 67, "confidence": "high" }
    },
    {
      "id": "EML4--ALK",
      "geneA": { "symbol": "EML4", "chr": "chr2", "breakpoint": 42472827, "strand": "-" },
      "geneB": { "symbol": "ALK", "chr": "chr2", "breakpoint": 29446394, "strand": "-" },
      "evidence": { "total": 89, "junctionReads": 52, "spanningReads": 37, "confidence": "high" }
    }
  ]
}
FUSIONS

echo "Sample data ready!"
EOF

chmod +x scripts/download-sample-data.sh
```

## Phase 3: Implementation Order

### Week 1-2: Binary Formats (Critical)

```bash
# Start with the most critical tutorial
cd tutorials/phase-2-backend/05-binary-formats

# Initialize package
npm init -y
npm install @gmod/bam @gmod/bbi @gmod/tabix generic-filehandle pako express

# Create main files from plan
# See: docs/implementation-plans/01_BINARY_GENOMIC_FORMATS.md
```

**Key files to implement:**

1. `src/parsers/bamParser.js` - BAM file parsing
2. `src/parsers/bigwigParser.js` - BigWig reading
3. `src/routes/bam.js` - BAM API endpoints
4. `src/server.js` - Express server

### Week 3-4: Performance Optimization

```bash
cd tutorials/phase-1-frontend/05-performance

npm init -y
npm install d3 vite

# Create main files from plan
# See: docs/implementation-plans/02_PERFORMANCE_OPTIMIZATION.md
```

**Key files to implement:**

1. `src/01-svg-vs-canvas.js` - Decision matrix & benchmarks
2. `src/02-canvas-rendering.js` - Canvas track rendering
3. `src/03-virtualization.js` - Virtual scrolling
4. `workers/data-processor.worker.js` - Web Worker

### Week 5-6: Gene Fusion Viewer

```bash
cd tutorials/phase-3-advanced-viz/06-gene-fusion

npm init -y
npm install d3 vite

# Create main files from plan
# See: docs/implementation-plans/03_GENE_FUSION_VIEWER.md
```

**Key files to implement:**

1. `src/parsers/starFusionParser.js` - STAR-Fusion parsing
2. `src/components/FusionArc.js` - Arc diagram
3. `src/components/DualGeneView.js` - Side-by-side genes
4. `src/components/FusionExplorer.js` - Main component

### Week 7-8: Rust Enhancement

```bash
cd tutorials/phase-4-production/04-rust-parsing/rust-genomics

# Initialize Rust workspace
cat > Cargo.toml << 'EOF'
[workspace]
members = [
    "fisher",
    "cluster",
    "stats",
    "wasm-bindings"
]
EOF

# Initialize fisher crate
cd fisher
cargo init --lib
# See: docs/implementation-plans/04_RUST_ENHANCEMENT.md
```

**Key files to implement:**

1. `fisher/src/lib.rs` - Fisher exact test
2. `cluster/src/lib.rs` - Hierarchical clustering
3. `wasm-bindings/src/lib.rs` - WASM bindings

### Week 9-10: Multi-View Coordination

```bash
cd tutorials/phase-5-integration/01-multi-view

npm init -y
npm install d3 vite

# Create main files from plan
# See: docs/implementation-plans/05_MULTI_VIEW_COORDINATION.md
```

**Key files to implement:**

1. `src/state/store.js` - Central state
2. `src/coordination/EventBus.js` - Event system
3. `src/coordination/LinkedBrush.js` - Brush coordination
4. `src/components/*.js` - Coordinated components
5. `src/layouts/DashboardLayout.js` - Full dashboard

## Phase 4: Testing & Integration

### Unit Tests

```bash
# Each tutorial should have tests
npm install -D vitest @testing-library/dom

# Example test file structure
cat > tutorials/phase-2-backend/05-binary-formats/test/bamParser.test.js << 'EOF'
import { describe, it, expect } from 'vitest';
import { BamParser } from '../src/parsers/bamParser.js';

describe('BamParser', () => {
  it('should parse BAM header', async () => {
    const parser = new BamParser('./data/sample.bam');
    const header = await parser.getHeader();
    expect(header.references).toBeDefined();
  });
});
EOF
```

### Integration Tests

```bash
# Test multi-view coordination
cat > tutorials/phase-5-integration/01-multi-view/test/coordination.test.js << 'EOF'
import { describe, it, expect } from 'vitest';
import { store } from '../src/state/store.js';
import { linkedBrush } from '../src/coordination/LinkedBrush.js';

describe('View Coordination', () => {
  it('should propagate selection to all views', () => {
    // Test linked brushing
  });
});
EOF
```

## Phase 5: Documentation & README Updates

Update the main tutorials README:

```markdown
# Tutorials

## Phase 1: Frontend Foundation

- 01-svg-canvas
- 02-d3-core
- 03-lollipop-plot
- 04-genome-browser
- **05-performance** (NEW)

## Phase 2: Backend Development

- 01-rest-api
- 02-postgresql
- 03-file-parsing
- 04-r-integration
- **05-binary-formats** (NEW)

## Phase 3: Advanced Visualizations

- 01-scatter-plot
- 02-heatmap
- 03-survival-curves
- 04-volcano-plot
- 05-oncoprint
- **06-gene-fusion** (NEW)

## Phase 4: Production

- 01-testing
- 02-cicd
- 03-ai-chatbot
- 04-rust-parsing (ENHANCED)

## Phase 5: Integration (NEW)

- **01-multi-view** (NEW)
```

## Validation Checklist

After implementation, verify:

### Binary Formats (Phase 2.5)

- [ ] BAM header parsing works
- [ ] Reads in region query works
- [ ] BigWig signal extraction works
- [ ] Streaming doesn't crash on large files

### Performance (Phase 1.5)

- [ ] Canvas renders 100k points at 60fps
- [ ] Virtual list scrolls 50k items smoothly
- [ ] Web Worker doesn't block UI

### Gene Fusion (Phase 3.6)

- [ ] STAR-Fusion parsing works
- [ ] Arc diagram renders correctly
- [ ] Dual gene view shows breakpoints

### Rust (Phase 4.4)

- [ ] Fisher test matches R's fisher.test()
- [ ] WASM compiles and loads in browser
- [ ] Node.js bindings work

### Multi-View (Phase 5.1)

- [ ] Brushing in scatter updates lollipop
- [ ] Filters propagate to all views
- [ ] Export produces valid PNG

## Getting Help

If stuck:

1. Check the detailed implementation plan in `docs/implementation-plans/`
2. Reference ProteinPaint source at `github.com/stjude/proteinpaint`
3. Check @gmod library documentation for BAM/BigWig parsing

---

**Start here:** `docs/implementation-plans/01_BINARY_GENOMIC_FORMATS.md`

Happy implementing! 🚀
