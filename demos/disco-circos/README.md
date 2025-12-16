# 🌀 Disco/Circos Plot Demo

A circular genome visualization demo inspired by ProteinPaint's Disco plot.

## Features

- **Chromosome Ring**: Outer ring showing all chromosomes proportionally sized
- **SNV/Mutation Ring**: Inner ring with mutations colored by class (missense, nonsense, etc.)
- **CNV Ring**: Copy number variations shown as colored arcs (red=gain, blue=loss)
- **Fusion Chords**: Bezier curves connecting structural variant breakpoints
- **Interactive Tooltips**: Hover over any element for detailed information
- **Sample Switching**: Toggle between different sample datasets
- **Track Controls**: Show/hide individual rings
- **Adjustable Radius**: Scale the plot size dynamically

## Architecture

Based on ProteinPaint's `client/plots/disco/` implementation:

```
src/
├── main.ts                    # App entry point
├── types/
│   └── index.ts               # Type definitions (Arc, Chromosome, SNV, CNV, Fusion)
├── core/
│   ├── Reference.ts           # Chromosome angle calculations
│   ├── ArcMappers.ts          # Data → Arc conversion
│   └── Colors.ts              # Color schemes
├── components/
│   └── DiscoDiagram.ts        # Main visualization component
└── styles.css                 # Styling
```

## Running the Demo

```bash
cd demos/disco-circos
npm install
npm run dev
```

Opens at http://localhost:5184

## Key Concepts

### Angle Calculation

Each chromosome is assigned an angular span proportional to its size:

```typescript
chromosomeAngle = (2π - totalPadAngle) × (chrSize / totalGenomeSize)
```

### Position to Angle Mapping

Converting a genomic position to an angle:

```typescript
angle = chromosomeStartAngle + (position / chromosomeSize) × chromosomeAngle
```

### D3 Arc Generator

Using D3's arc generator for ring segments:

```typescript
const arc = d3
  .arc<ArcData>()
  .innerRadius((d) => d.innerRadius)
  .outerRadius((d) => d.outerRadius)
  .startAngle((d) => d.startAngle)
  .endAngle((d) => d.endAngle);
```

### Fusion Chords

Bezier curves connecting two genomic loci:

```typescript
M sx sy C cx1 cy1, cx2 cy2, tx ty
```

## Data Format

### Sample Data

```json
{
  "sample": "SAMPLE-001",
  "mutations": [
    { "chr": "chr17", "pos": 7577100, "gene": "TP53", "class": "missense", "mname": "R175H" }
  ],
  "cnv": [{ "chr": "chr1", "start": 1000000, "end": 50000000, "value": 1.5 }],
  "fusions": [
    {
      "chrA": "chr9",
      "posA": 133729451,
      "geneA": "ABL1",
      "chrB": "chr22",
      "posB": 23632600,
      "geneB": "BCR"
    }
  ]
}
```

### Mutation Classes

- `missense` - Blue
- `nonsense` - Red
- `frameshift` - Orange
- `splice` - Purple
- `inframe` - Cyan
- `silent` - Gray

## References

- ProteinPaint Disco: `client/plots/disco/`
- D3 Arc: https://github.com/d3/d3-shape#arcs
- Circos: http://circos.ca/
