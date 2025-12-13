# Exercise 2: Interactive Coordinate Display

## Objective
Create a Canvas-based coordinate system that displays mouse position in both pixel coordinates and a custom coordinate system (like genomic coordinates).

## Requirements

### Basic (Required)
1. Create a Canvas element with a grid background
2. Display current mouse X, Y position in pixels
3. Draw crosshairs that follow the mouse

### Intermediate (Recommended)  
4. Convert pixel coordinates to a "genomic" coordinate system
   - Example: X pixels → chromosome position (e.g., chr17:7,668,402)
5. Add axis labels with tick marks
6. Show coordinates in a fixed overlay panel

### Advanced (Challenge)
7. Add zoom functionality (scroll wheel)
8. Add pan functionality (click and drag)
9. Display a "region" when user drags to select an area
10. Add coordinate input field to jump to a specific position

## Genomic Coordinate Mapping

```javascript
// Map pixel X to genomic position
const genomicRange = {
  chromosome: 'chr17',
  start: 7668000,  // TP53 gene region
  end: 7688000
};

function pixelToGenomic(pixelX, canvasWidth) {
  const genomicWidth = genomicRange.end - genomicRange.start;
  const position = genomicRange.start + (pixelX / canvasWidth) * genomicWidth;
  return Math.round(position);
}

function formatPosition(pos) {
  return pos.toLocaleString(); // "7,668,402"
}
```

## Hints

1. Use `requestAnimationFrame` for smooth crosshair updates

2. For the grid, draw lines at regular intervals:
   ```javascript
   for (let x = 0; x < width; x += gridSize) {
     ctx.moveTo(x, 0);
     ctx.lineTo(x, height);
   }
   ```

3. For zoom, scale the coordinate mapping:
   ```javascript
   let zoomLevel = 1;
   const visibleRange = (genomicRange.end - genomicRange.start) / zoomLevel;
   ```

4. For pan, track an offset:
   ```javascript
   let panOffset = 0;
   const currentStart = genomicRange.start + panOffset;
   ```

## Expected Features

```
┌─────────────────────────────────────────────┐
│  Coordinates                                │
│  Pixel: (245, 178)                          │
│  Genomic: chr17:7,674,523                   │
│  Zoom: 1x                                   │
├─────────────────────────────────────────────┤
│     │     │     │     │     │     │         │
│  ───┼─────┼─────┼─────┼─────┼─────┼───      │
│     │     │     │     │  +  │     │    ← crosshair
│  ───┼─────┼─────┼─────┼─────┼─────┼───      │
│     │     │     │     │     │     │         │
│  ───┼─────┼─────┼─────┼─────┼─────┼───      │
│     │     │     │     │     │     │         │
├─────────────────────────────────────────────┤
│ 7,668,000        7,678,000        7,688,000 │
└─────────────────────────────────────────────┘
```

## Bonus: Selection Region

When user drags on the canvas:
1. Draw a semi-transparent rectangle showing the selected region
2. Display the selected genomic range (e.g., "Selected: chr17:7,670,000-7,672,500")
3. Add a "Zoom to Selection" button

## Code Structure

```javascript
class CoordinateDisplay {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mouse = { x: 0, y: 0 };
    this.genomicRange = { chr: 'chr17', start: 7668000, end: 7688000 };
    this.zoom = 1;
    this.pan = 0;
    
    this.setupEventListeners();
    this.draw();
  }
  
  setupEventListeners() {
    // Mouse move, wheel, drag events
  }
  
  pixelToGenomic(pixelX) {
    // Convert pixel to genomic coordinate
  }
  
  drawGrid() {
    // Draw background grid
  }
  
  drawCrosshairs() {
    // Draw lines following mouse
  }
  
  drawAxes() {
    // Draw X/Y axes with labels
  }
  
  draw() {
    // Main render function
    requestAnimationFrame(() => this.draw());
  }
}
```

## Submission

Create your solution in `solutions/exercise-2.js` and include:
1. A working implementation
2. Comments explaining the coordinate math
3. Any HTML/CSS needed
