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

| Command | Description | Example |
|---------|-------------|---------|
| M | Move to | `M 10 10` |
| L | Line to | `L 50 50` |
| H | Horizontal line | `H 100` |
| V | Vertical line | `V 100` |
| C | Cubic bezier | `C x1 y1 x2 y2 x y` |
| Q | Quadratic bezier | `Q x1 y1 x y` |
| A | Arc | `A rx ry rotation large-arc sweep x y` |
| Z | Close path | `Z` |

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

## Next Steps

After completing this tutorial, proceed to [Tutorial 1.2: D3.js Core Concepts](../02-d3-core/).
