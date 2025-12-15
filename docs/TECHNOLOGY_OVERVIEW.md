# Technology Overview for Genomic Visualization

A comprehensive guide to all technologies used in this learning platform.

---

## 🗺️ Technology Map

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        GENOMIC VISUALIZATION STACK                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │    HTML     │  │     CSS     │  │ JavaScript  │  │ TypeScript  │     │
│  │  Structure  │  │   Styling   │  │   Logic     │  │  Type-safe  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │                │             │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐     │
│  │                    RENDERING TECHNOLOGIES                       │     │
│  │  ┌─────────────────────┐    ┌─────────────────────┐            │     │
│  │  │        SVG          │    │       Canvas        │            │     │
│  │  │  • Vector graphics  │    │  • Pixel graphics   │            │     │
│  │  │  • DOM-based        │    │  • Immediate mode   │            │     │
│  │  │  • Interactivity    │    │  • High performance │            │     │
│  │  └─────────────────────┘    └─────────────────────┘            │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                    │                                     │
│  ┌─────────────────────────────────┴───────────────────────────────┐    │
│  │                         D3.js ECOSYSTEM                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│    │
│  │  │Selections│ │  Scales  │ │  Shapes  │ │  Axes    │ │ Geo    ││    │
│  │  │d3-select │ │d3-scale  │ │ d3-shape │ │ d3-axis  │ │d3-geo  ││    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │Transitions│ │  Arrays │ │  Color   │ │  Fetch   │           │    │
│  │  │d3-transit│ │d3-array  │ │ d3-color │ │ d3-fetch │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────┴───────────────────────────────┐    │
│  │                      BUILD & RUNTIME TOOLS                       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │    │
│  │  │   Vite   │ │  Node.js │ │   npm    │ │   Zod    │            │    │
│  │  │Dev Server│ │ Runtime  │ │ Packages │ │Validation│            │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      BACKEND (Phase 2)                           │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │    │
│  │  │ Express  │ │PostgreSQL│ │  REST    │ │    R     │            │    │
│  │  │   API    │ │ Database │ │  APIs    │ │Statistics│            │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ SVG (Scalable Vector Graphics)

### What is it?
XML-based markup language for describing 2D vector graphics.

### Philosophy
- **Retained Mode**: Browser maintains a DOM tree of graphics elements
- **Resolution Independent**: Scales perfectly at any zoom level
- **Declarative**: You describe WHAT to draw, browser handles HOW

### Why use it?
| Strength | Use Case |
|----------|----------|
| Individual element access | Tooltips on hover |
| CSS styling | Theming visualizations |
| Event handling | Click/drag interactions |
| Accessibility | Screen readers can parse |
| Small datasets | < 1000 elements |

### Core Elements
```svg
<!-- Basic shapes -->
<rect x="10" y="10" width="100" height="50" fill="blue"/>
<circle cx="50" cy="50" r="25" fill="red"/>
<ellipse cx="100" cy="50" rx="40" ry="20"/>
<line x1="0" y1="0" x2="100" y2="100" stroke="black"/>
<polyline points="0,0 50,50 100,0"/>
<polygon points="50,0 100,100 0,100"/>

<!-- Text -->
<text x="50" y="50" font-size="14">Label</text>

<!-- Paths (most powerful) -->
<path d="M10,10 L100,100 Q150,50 200,100"/>

<!-- Groups with transforms -->
<g transform="translate(100, 50) rotate(45)">
  <rect .../>
</g>
```

### Key Attributes
| Attribute | Purpose | Example |
|-----------|---------|---------|
| `fill` | Interior color | `fill="#3498db"` |
| `stroke` | Border color | `stroke="black"` |
| `stroke-width` | Border thickness | `stroke-width="2"` |
| `opacity` | Transparency | `opacity="0.5"` |
| `transform` | Position/rotate/scale | `transform="translate(10,20)"` |
| `viewBox` | Coordinate system | `viewBox="0 0 800 400"` |

### Used in Tutorials
- **Phase 1**: All tutorials (01-04)
- **Phase 3**: Lollipop, Heatmap, Survival, Volcano, OncoPrint

---

## 2️⃣ Canvas API

### What is it?
JavaScript API for drawing graphics via scripting (pixel-based).

### Philosophy
- **Immediate Mode**: Draw commands execute immediately, no retained state
- **Pixel-based**: Works at the pixel level
- **Imperative**: You describe HOW to draw step by step

### Why use it?
| Strength | Use Case |
|----------|----------|
| Performance | > 10,000 elements |
| Pixel manipulation | Image processing |
| Animation | 60fps smooth updates |
| Memory efficient | No DOM overhead |

### Core API
```javascript
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Drawing
ctx.fillStyle = 'blue';
ctx.fillRect(10, 10, 100, 50);

ctx.strokeStyle = 'red';
ctx.lineWidth = 2;
ctx.strokeRect(10, 10, 100, 50);

// Paths
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(100, 100);
ctx.quadraticCurveTo(150, 50, 200, 100);
ctx.stroke();

// Text
ctx.font = '14px Arial';
ctx.fillText('Label', 50, 50);

// Transforms
ctx.save();
ctx.translate(100, 50);
ctx.rotate(Math.PI / 4);
ctx.fillRect(0, 0, 50, 50);
ctx.restore();
```

### SVG vs Canvas Decision Matrix
| Factor | Choose SVG | Choose Canvas |
|--------|------------|---------------|
| Elements | < 1,000 | > 10,000 |
| Interaction | Per-element events | Manual hit testing |
| Animation | Transitions | requestAnimationFrame |
| Export | Native vector | toDataURL() |
| Accessibility | Built-in | Manual |

### Used in Tutorials
- **Phase 1**: 01-svg-canvas (comparison)
- **Phase 1**: 04-genome-browser (performance optimization)

---

## 3️⃣ D3.js (Data-Driven Documents)

### What is it?
JavaScript library for producing dynamic, interactive data visualizations.

### Philosophy
```
                    DATA
                      │
                      ▼
              ┌───────────────┐
              │   SELECTION   │  ← Bind data to DOM
              │  .selectAll() │
              │    .data()    │
              └───────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │  ENTER  │  │ UPDATE  │  │  EXIT   │
    │New data │  │Existing │  │Removed  │
    │ → Create│  │ → Modify│  │ → Remove│
    └─────────┘  └─────────┘  └─────────┘
         │            │            │
         └────────────┼────────────┘
                      ▼
                    DOM
```

### Core Concepts

#### 1. Selections
```javascript
// Select elements
d3.select('#container')        // Single element
d3.selectAll('circle')         // All matching

// Chain operations
d3.select('svg')
  .attr('width', 800)
  .attr('height', 400)
  .style('background', '#fff');
```

#### 2. Data Binding (The D3 Way™)
```javascript
const data = [10, 20, 30, 40, 50];

// The classic enter-update-exit pattern
const circles = svg.selectAll('circle')
  .data(data);

// ENTER: New data points
circles.enter()
  .append('circle')
  .attr('r', d => d)
  .attr('fill', 'blue');

// UPDATE: Existing elements
circles
  .attr('r', d => d);

// EXIT: Removed data points
circles.exit()
  .remove();

// Modern: .join() combines all three
svg.selectAll('circle')
  .data(data)
  .join('circle')
  .attr('r', d => d);
```

#### 3. Scales (Data → Visual)
```javascript
// Linear scale (continuous → continuous)
const xScale = d3.scaleLinear()
  .domain([0, 100])      // Data range
  .range([0, 800]);      // Pixel range

xScale(50);  // → 400

// Band scale (categorical → continuous)
const yScale = d3.scaleBand()
  .domain(['A', 'B', 'C'])
  .range([0, 300])
  .padding(0.1);

// Color scales
const colorScale = d3.scaleOrdinal()
  .domain(['missense', 'nonsense', 'frameshift'])
  .range(['#3498db', '#e74c3c', '#f39c12']);
```

#### 4. Shapes & Generators
```javascript
// Line generator
const line = d3.line()
  .x(d => xScale(d.x))
  .y(d => yScale(d.y))
  .curve(d3.curveStep);  // For survival curves

svg.append('path')
  .datum(data)
  .attr('d', line);

// Area generator
const area = d3.area()
  .x(d => xScale(d.x))
  .y0(height)
  .y1(d => yScale(d.y));

// Arc generator (for pie charts)
const arc = d3.arc()
  .innerRadius(0)
  .outerRadius(100);
```

#### 5. Axes
```javascript
const xAxis = d3.axisBottom(xScale)
  .ticks(10)
  .tickFormat(d => `${d} bp`);

svg.append('g')
  .attr('transform', `translate(0, ${height})`)
  .call(xAxis);
```

#### 6. Transitions
```javascript
svg.selectAll('rect')
  .transition()
  .duration(750)
  .ease(d3.easeCubicOut)
  .attr('height', d => yScale(d))
  .attr('fill', '#3498db');
```

### D3 Modules Used
| Module | Purpose | Tutorial Usage |
|--------|---------|----------------|
| d3-selection | DOM manipulation | All |
| d3-scale | Data → visual mapping | All |
| d3-axis | Coordinate axes | All charts |
| d3-shape | Lines, areas, arcs | Survival, Lollipop |
| d3-transition | Animations | Interactive demos |
| d3-array | Data utilities | Statistics |
| d3-color | Color manipulation | Heatmaps |
| d3-brush | Selection rectangles | Filtering |
| d3-zoom | Pan/zoom behavior | Genome Browser |

---

## 4️⃣ TypeScript

### What is it?
Typed superset of JavaScript that compiles to plain JavaScript.

### Philosophy
- **Type Safety**: Catch errors at compile time
- **Better Tooling**: Autocomplete, refactoring
- **Self-Documenting**: Types serve as documentation
- **Scalable**: Essential for large codebases

### Key Concepts for Viz
```typescript
// Interface for genomic data
interface Mutation {
  gene: string;
  position: number;
  type: 'missense' | 'nonsense' | 'frameshift' | 'splice';
  vaf: number;
}

// Type for visualization config
type ChartConfig = {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  colorScheme?: string[];
};

// Generic function for data binding
function bindData<T>(
  selection: d3.Selection<SVGGElement, unknown, null, undefined>,
  data: T[],
  key: (d: T) => string
): d3.Selection<SVGGElement, T, SVGGElement, unknown> {
  return selection.selectAll('g').data(data, key);
}

// Zod for runtime validation
import { z } from 'zod';

const MutationSchema = z.object({
  gene: z.string(),
  position: z.number().positive(),
  type: z.enum(['missense', 'nonsense', 'frameshift', 'splice']),
  vaf: z.number().min(0).max(1)
});

type Mutation = z.infer<typeof MutationSchema>;
```

### Used in Tutorials
- **Capstone**: All components
- **Phase 3**: Type definitions

---

## 5️⃣ Vite

### What is it?
Next-generation frontend build tool.

### Philosophy
- **Instant Server Start**: No bundling in dev mode
- **Lightning Fast HMR**: Hot Module Replacement
- **Optimized Build**: Rollup-based production builds

### Key Features
```javascript
// vite.config.js
export default {
  root: '.',
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist'
  }
};
```

### Why Vite for Tutorials?
- Zero config for simple setups
- Fast feedback loop
- Native ES modules

---

## 6️⃣ Node.js & Express (Phase 2)

### What is it?
- **Node.js**: JavaScript runtime for server-side
- **Express**: Minimal web framework

### API Pattern
```javascript
import express from 'express';

const app = express();

// REST endpoints
app.get('/api/genes/:symbol', async (req, res) => {
  const gene = await db.query(
    'SELECT * FROM genes WHERE symbol = $1',
    [req.params.symbol]
  );
  res.json(gene);
});

app.get('/api/mutations', async (req, res) => {
  const { gene, type } = req.query;
  const mutations = await getMutations(gene, type);
  res.json(mutations);
});
```

---

## 7️⃣ PostgreSQL (Phase 2)

### What is it?
Advanced open-source relational database.

### Genomic Schema Example
```sql
CREATE TABLE genes (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE,
  chromosome VARCHAR(5),
  start_pos INTEGER,
  end_pos INTEGER,
  strand CHAR(1)
);

CREATE TABLE mutations (
  id SERIAL PRIMARY KEY,
  gene_id INTEGER REFERENCES genes(id),
  position INTEGER,
  ref_allele VARCHAR(100),
  alt_allele VARCHAR(100),
  type VARCHAR(20),
  sample_id VARCHAR(50)
);

-- Efficient queries
CREATE INDEX idx_mutations_gene ON mutations(gene_id);
CREATE INDEX idx_mutations_position ON mutations(position);
```

---

## 📊 How Technologies Map to Tutorials

| Tutorial | Primary Tech | Supporting Tech |
|----------|-------------|-----------------|
| 01-svg-canvas | SVG, Canvas | Vanilla JS |
| 02-d3-core | D3.js | SVG |
| 03-lollipop | D3.js, SVG | TypeScript |
| 04-genome-browser | D3.js, Canvas | TypeScript |
| 01-rest-api | Express, Node | JavaScript |
| 02-postgresql | PostgreSQL | Node |
| 03-file-parsing | Node streams | — |
| 01-scatter-plot | D3.js | TypeScript |
| 02-heatmap | D3.js | Color scales |
| 03-survival | D3.js | Statistics |
| 04-volcano | D3.js | Statistics |
| 05-oncoprint | D3.js | TypeScript |

---

## 🎯 ProteinPaint Connection

ProteinPaint uses similar patterns:
- **SVG** for most visualizations (lollipop, browser)
- **D3.js** extensively for data binding and rendering
- **TypeScript** for type safety
- **Config-driven** approach (JSON → visualization)
- **Track-based** genome browser architecture

Understanding these fundamentals directly prepares you for ProteinPaint development!

---

## 📚 Next Steps

1. **Read this overview** to understand the big picture
2. **Run Tutorial 01-svg-canvas** to see SVG vs Canvas
3. **Run Tutorial 02-d3-core** to master D3 patterns
4. **Progress through remaining tutorials** with context
