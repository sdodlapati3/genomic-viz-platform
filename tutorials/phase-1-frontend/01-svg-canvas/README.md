[← Back to Tutorials Index](../../README.md)

---

# Tutorial 1.1: SVG & Canvas Fundamentals

> Learn the building blocks of web graphics for genomic visualization

## Learning Objectives

By the end of this tutorial, you will be able to:

- [ ] Create and manipulate SVG elements programmatically
- [ ] Understand the SVG coordinate system and viewBox
- [ ] Draw shapes, paths, and text with SVG
- [ ] Use Canvas 2D context for high-performance rendering
- [ ] Implement basic mouse interactions (hover, click, drag)
- [ ] Choose between SVG and Canvas for different use cases

## Prerequisites

- HTML/CSS basics
- JavaScript ES6+ (functions, classes, modules)
- A code editor (VS Code recommended)

## Concepts Covered

### 1. SVG Fundamentals

- Coordinate system (origin at top-left)
- viewBox for responsive scaling
- Basic shapes: `<rect>`, `<circle>`, `<ellipse>`, `<line>`
- Complex shapes: `<path>`, `<polygon>`, `<polyline>`
- Text: `<text>`, `<tspan>`
- Grouping: `<g>` for organization and transforms
- Styling: fill, stroke, opacity

### 2. Canvas Fundamentals

- Getting the 2D context
- Drawing shapes (fillRect, arc, etc.)
- Paths (beginPath, moveTo, lineTo, bezierCurveTo)
- Text rendering
- State management (save, restore)
- Pixel manipulation

### 3. Interactivity

- Event handling in SVG (native DOM events)
- Hit detection in Canvas (geometric calculations)
- Creating tooltips
- Drag and drop

### 4. Performance Considerations

- When to use SVG vs Canvas
- SVG: < 1000 elements, need DOM access, CSS styling
- Canvas: > 1000 elements, animations, image manipulation

## Files

```
01-svg-canvas/
├── README.md           # This file
├── package.json        # Dependencies
├── index.html          # Entry point
├── src/
│   ├── 01-svg-basics.js      # SVG shape examples
│   ├── 02-svg-paths.js       # Path commands
│   ├── 03-canvas-basics.js   # Canvas drawing
│   ├── 04-interactivity.js   # Event handling
│   └── 05-comparison.js      # SVG vs Canvas demo
├── exercises/
│   ├── exercise-1.md   # Draw a protein diagram
│   └── exercise-2.md   # Interactive coordinate display
└── solutions/
    └── ...
```

## Getting Started

```bash
cd tutorials/phase-1-frontend/01-svg-canvas
npm install
npm run dev
```

## Quick Reference

### SVG Path Commands

| Command | Description      | Example                                |
| ------- | ---------------- | -------------------------------------- |
| M       | Move to          | `M 10 10`                              |
| L       | Line to          | `L 50 50`                              |
| H       | Horizontal line  | `H 100`                                |
| V       | Vertical line    | `V 100`                                |
| C       | Cubic bezier     | `C x1 y1 x2 y2 x y`                    |
| Q       | Quadratic bezier | `Q x1 y1 x y`                          |
| A       | Arc              | `A rx ry rotation large-arc sweep x y` |
| Z       | Close path       | `Z`                                    |

### Canvas Context Methods

```javascript
// Get context
const ctx = canvas.getContext('2d');

// Shapes
ctx.fillRect(x, y, width, height);
ctx.strokeRect(x, y, width, height);
ctx.arc(x, y, radius, startAngle, endAngle);

// Paths
ctx.beginPath();
ctx.moveTo(x, y);
ctx.lineTo(x, y);
ctx.closePath();
ctx.fill();
ctx.stroke();

// Text
ctx.fillText(text, x, y);
ctx.measureText(text).width;

// Transforms
ctx.translate(x, y);
ctx.rotate(angle);
ctx.scale(x, y);
ctx.save();
ctx.restore();
```

## 🎯 ProteinPaint Connection

Understanding SVG and Canvas is fundamental to ProteinPaint development:

| Tutorial Concept | ProteinPaint Usage                               |
| ---------------- | ------------------------------------------------ |
| SVG `<rect>`     | Exon rectangles, protein domains, bars           |
| SVG `<line>`     | Intron lines, mutation stems, axes               |
| SVG `<circle>`   | Lollipop heads, scatter plot points              |
| SVG `<path>`     | Splice junctions, bezier curves, complex shapes  |
| SVG `<text>`     | Gene names, axis labels, tooltips                |
| SVG `<g>` groups | Track containers, layered elements               |
| Canvas rendering | High-performance scatter plots (>10k points)     |
| Event handling   | Hover tooltips, click selection, drag navigation |

### Key ProteinPaint Files Using These Concepts

- `client/dom/svg.ts` - SVG element creation utilities
- `client/src/block.tk.*.ts` - Track rendering using SVG
- `client/plots/scatter.js` - Canvas-based scatter plots
- `client/src/client.ts` - DOM manipulation patterns

## Sample Output

```
┌─────────────────────────────────────────────────────────────┐
│  SVG Shapes Demo                                            │
│                                                             │
│   ┌────┐    ●      (    )     ╱        △                   │
│   │rect│  circle  ellipse   line    polygon                │
│   └────┘                                                    │
│                                                             │
│  Gene Structure (SVG):                                      │
│                                                             │
│  TP53 ──────████──██████████──████████──────►              │
│              E1      E2-E9        E10                       │
│                                                             │
│  Coverage Plot (Canvas):                                    │
│  ▁▂▃▅▆█▇▅▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Exercises

### Exercise 1: Draw a Protein Domain Diagram

Create an SVG visualization of a protein with multiple domains:

**Requirements:**

- Draw a protein backbone (thin rectangle)
- Add 3+ colored domain rectangles
- Label each domain
- Add position markers below

**Starter Code:**

```javascript
const protein = {
  name: 'TP53',
  length: 393,
  domains: [
    { name: 'TAD', start: 1, end: 43, color: '#e74c3c' },
    { name: 'PRD', start: 64, end: 92, color: '#f39c12' },
    { name: 'DBD', start: 102, end: 292, color: '#3498db' },
    { name: 'TET', start: 323, end: 356, color: '#2ecc71' },
  ],
};
```

### Exercise 2: Interactive Coordinate Display

Build a Canvas visualization that:

- Displays genomic coordinates on hover
- Shows a crosshair following the mouse
- Updates position text in real-time

**Hint:** Use `canvas.addEventListener('mousemove', ...)` and `ctx.clearRect()` to redraw.

### Exercise 3: SVG vs Canvas Performance

Create a benchmark that:

- Renders 100, 1000, 5000, 10000 circles
- Measures render time for both SVG and Canvas
- Displays results in a comparison table

**Expected Observation:** Canvas should be faster above ~1000 elements.

## Next Steps

After completing this tutorial, proceed to [Tutorial 1.2: D3.js Core Concepts](../02-d3-core/README.md).

---

## 🎯 Interview Preparation Q&A

### Q1: When would you choose SVG over Canvas for genomic visualization?

**Answer:** Choose **SVG** when:

- Rendering fewer than ~1,000 elements (exons, domains, mutation lollipops)
- Need DOM access for event handling (click, hover on specific elements)
- Require CSS styling and animations
- Building accessible visualizations (SVG elements can have ARIA attributes)
- Elements need to be individually selectable/inspectable

Choose **Canvas** when:

- Rendering thousands of points (scatter plots, coverage tracks)
- Need pixel-level manipulation (heatmaps, image processing)
- Performance is critical (real-time animations)
- Drawing complex graphical effects

**ProteinPaint Example:** Gene tracks use SVG for exon rectangles (need click events), while high-density scatter plots use Canvas for performance.

---

### Q2: Explain the SVG coordinate system and viewBox attribute.

**Answer:**

- SVG coordinate system has origin (0,0) at **top-left**
- X increases rightward, Y increases **downward** (opposite of math convention)
- `viewBox="0 0 800 400"` defines:
  - Min-x: 0, Min-y: 0 (starting point)
  - Width: 800, Height: 400 (coordinate space)
- viewBox enables **responsive scaling** - SVG content scales proportionally to container
- Useful pattern: Set viewBox to logical coordinates (e.g., protein length), let CSS handle actual pixel size

---

### Q3: How would you implement hit detection in Canvas vs SVG?

**Answer:**
**SVG:** Native DOM events work directly:

```javascript
rect.addEventListener('click', (e) => console.log(e.target));
```

**Canvas:** Requires geometric calculation:

```javascript
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Check if point is inside any shape
  shapes.forEach((shape) => {
    if (x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height) {
      // Hit detected
    }
  });
});
```

For complex shapes or many elements, use **quadtree spatial indexing** or **offscreen canvas with color-coded hit regions**.

---

### Q4: Describe SVG path commands and their use in genomic visualization.

**Answer:** SVG path commands create complex shapes:

| Command            | Use Case in Genomics                       |
| ------------------ | ------------------------------------------ |
| `M` (moveTo)       | Start splice junction arc                  |
| `L` (lineTo)       | Mutation stems, axis lines                 |
| `C` (cubic bezier) | Splice junction curves, smooth connections |
| `A` (arc)          | Fusion gene circular diagrams              |
| `Z` (closePath)    | Closed domain shapes                       |

**Example:** Splice junction arc between exons:

```javascript
const path = `M ${x1} ${y} C ${x1} ${y - 50}, ${x2} ${y - 50}, ${x2} ${y}`;
```

---

### Q5: What Canvas optimization techniques would you use for rendering 50,000 genomic data points?

**Answer:**

1. **Batch drawing by color** - Single `fill()` call per color group
2. **Use `beginPath()` efficiently** - Group similar shapes
3. **Frustum culling** - Skip points outside viewport
4. **Level of detail** - Reduce detail when zoomed out
5. **OffscreenCanvas** - Render in Web Worker
6. **RequestAnimationFrame** - Sync with display refresh
7. **ImageData for pixel operations** - Direct pixel manipulation for heatmaps

```javascript
// Batch drawing example
ctx.fillStyle = 'blue';
ctx.beginPath();
points.forEach((p) => {
  ctx.moveTo(p.x + 2, p.y);
  ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
});
ctx.fill(); // Single draw call for all blue points
```

---

[← Back to Tutorials Index](../../README.md)
