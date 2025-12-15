[← Back to Phase 3](../README.md)

---

# Tutorial 3.6: Gene Fusion Visualization

> Visualize chromosomal translocations and gene fusions with arc diagrams and dual-gene views

## Overview

Gene fusions occur when two separate genes become joined, often through chromosomal translocations. They're critical in cancer biology - fusions like BCR-ABL (chronic myeloid leukemia) and EML4-ALK (lung cancer) are both diagnostic markers and drug targets.

This tutorial teaches you to build visualizations like those in ProteinPaint's fusion viewer, showing:

- **Arc diagrams** connecting fusion partners
- **Dual-gene views** with aligned breakpoints
- **Exon-level detail** showing where fusions occur
- **Interactive exploration** of fusion databases

## Learning Objectives

By the end of this tutorial, you will be able to:

- [ ] Understand gene fusion biology and data formats
- [ ] Build arc diagrams showing inter-chromosomal connections
- [ ] Create dual-gene coordinate views
- [ ] Visualize exon structure and breakpoint locations
- [ ] Implement interactive fusion exploration
- [ ] Parse fusion detection tool outputs (STAR-Fusion, Arriba)

## Prerequisites

- Tutorial 1.3 (Lollipop Plot)
- Tutorial 1.4 (Genome Browser basics)
- Understanding of gene structure (exons, introns)

## Project Structure

```
05-gene-fusion/
├── package.json
├── vite.config.js
├── index.html
├── README.md
├── public/
│   └── data/
│       ├── fusions.json
│       └── genes.json
├── src/
│   ├── main.js
│   ├── styles.css
│   ├── components/
│   │   ├── ArcDiagram.js        # Circular arc connections
│   │   ├── DualGeneView.js      # Side-by-side gene view
│   │   ├── GeneStructure.js     # Exon/intron rendering
│   │   ├── FusionDetail.js      # Detailed fusion info
│   │   └── ChromosomeRing.js    # Circos-style layout
│   ├── data/
│   │   └── fusionParser.js      # Parse fusion formats
│   ├── utils/
│   │   ├── arcPath.js           # Arc path calculations
│   │   └── geneCoordinates.js   # Gene position utilities
│   └── examples/
│       ├── 01-basic-arc.js
│       ├── 02-dual-gene.js
│       ├── 03-exon-detail.js
│       ├── 04-interactive.js
│       └── 05-circos-view.js
└── exercises/
    ├── exercise-1.md
    └── exercise-2.md
```

## Getting Started

```bash
cd tutorials/phase-3-advanced-viz/05-gene-fusion
npm install
npm run dev
```

Open **http://localhost:5176**

## Key Concepts

### Gene Fusion Structure

```
Normal genes on different chromosomes:

Chr 9:  ═══════[BCR]═══════════════════════════
Chr 22: ═══════════════════════[ABL1]══════════

After translocation (Philadelphia chromosome):

Chr 22': ═══════[BCR]═══[ABL1]═════════════════
                     ↑
              Fusion breakpoint

Resulting fusion protein:
[BCR exons 1-13]──[ABL1 exons 2-11]
        ↓
   BCR-ABL1 oncogenic kinase
```

### Arc Diagram Representation

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│     ╭──────────────────────────╮                           │
│     │                          │                           │
│  ╭──┼────────╮              ╭──┼────────╮                  │
│  │  │        │              │  │        │                  │
├──┴──┴────────┴──────────────┴──┴────────┴──────────────────┤
│  BCR                         ALK  EML4                      │
│  (chr9)                      (chr2)                         │
│                                                             │
│  Arc height = fusion frequency                              │
│  Arc color = fusion type (in-frame, out-of-frame)          │
└─────────────────────────────────────────────────────────────┘
```

### Dual-Gene View

```
5' Partner (BCR)                    3' Partner (ABL1)
┌─────────────────────────┐        ┌─────────────────────────┐
│ ▓▓▓──▓▓──▓▓▓▓──▓▓──▓▓▓▓ │   ──→  │ ▓▓──▓▓▓──▓▓▓▓──▓▓──▓▓▓ │
│ 1  2  3  4   5  6   ...13│        │ 2  3   4    5  ...  11 │
└─────────────────────────┘        └─────────────────────────┘
         Breakpoint ─────────┼─────────── Breakpoint
                             │
                    Fusion Junction
```

## Fusion Data Format

```json
{
  "fusions": [
    {
      "id": "fusion_001",
      "gene5": {
        "name": "BCR",
        "chromosome": "chr22",
        "strand": "+",
        "breakpoint": 23523148,
        "exon": 13
      },
      "gene3": {
        "name": "ABL1",
        "chromosome": "chr9",
        "strand": "+",
        "breakpoint": 130854064,
        "exon": 2
      },
      "type": "in-frame",
      "readSupport": 156,
      "spanningFrags": 42,
      "sample": "TCGA-AB-2803"
    }
  ]
}
```

## API Reference

### ArcDiagram

```javascript
const arc = new ArcDiagram('#container', {
  width: 1000,
  height: 400,
  genePositions: geneMap, // Map of gene -> x position
  arcHeight: (d) => Math.sqrt(d.readSupport) * 10,
});

arc.setData(fusions);
arc.on('click', (fusion) => showDetail(fusion));
```

### DualGeneView

```javascript
const dualView = new DualGeneView('#detail-container', {
  width: 800,
  height: 200,
  exonHeight: 30,
});

dualView.setFusion(selectedFusion);
dualView.highlightBreakpoint(true);
```

### GeneStructure

```javascript
const gene = new GeneStructure(svg, {
  gene: geneData,
  scale: xScale,
  height: 40,
  showLabels: true,
});

gene.render();
gene.highlightExon(13); // Highlight breakpoint exon
```

## Common Fusion Types

| Fusion      | Cancer Type      | Significance       |
| ----------- | ---------------- | ------------------ |
| BCR-ABL1    | CML              | Imatinib target    |
| EML4-ALK    | NSCLC            | Crizotinib target  |
| TMPRSS2-ERG | Prostate         | Diagnostic marker  |
| PML-RARA    | APL              | ATRA + ATO therapy |
| EWSR1-FLI1  | Ewing sarcoma    | Diagnostic         |
| PAX3-FOXO1  | Rhabdomyosarcoma | Prognostic         |

## Exercises

### Exercise 1: Build an Arc Diagram

Create an arc diagram showing all fusions for a sample.

### Exercise 2: Fusion Detail Panel

Build an interactive panel showing exon-level fusion details.

## Resources

- [COSMIC Fusions](https://cancer.sanger.ac.uk/cosmic/fusion)
- [FusionGDB](https://ccsm.uth.edu/FusionGDB/)
- [ProteinPaint Fusion Viewer](https://proteinpaint.stjude.org/)
- [STAR-Fusion](https://github.com/STAR-Fusion/STAR-Fusion)

---

_Tutorial 3.6 - Gene Fusion Visualization_
