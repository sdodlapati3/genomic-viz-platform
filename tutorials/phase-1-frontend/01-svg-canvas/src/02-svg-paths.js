/**
 * SVG Paths - Path commands for complex shapes
 * Learning: M, L, H, V, C, Q, A, Z commands
 */

function createSVG(width, height) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  return svg;
}

function createEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

// Demo 1: Path Commands
function createPathsDemo() {
  const svg = createSVG(500, 280);
  
  // M (Move) and L (Line) - Simple shape
  svg.appendChild(createEl('path', {
    d: 'M 20 50 L 80 50 L 80 100 L 20 100 Z',
    fill: '#3498db', stroke: '#2980b9', 'stroke-width': 2
  }));
  const label1 = createEl('text', { x: 50, y: 130, 'font-size': 11, 'text-anchor': 'middle', fill: '#666' });
  label1.textContent = 'M, L, Z';
  svg.appendChild(label1);
  
  // H (Horizontal) and V (Vertical)
  svg.appendChild(createEl('path', {
    d: 'M 120 50 H 180 V 100 H 120 Z',
    fill: '#e74c3c', stroke: '#c0392b', 'stroke-width': 2
  }));
  const label2 = createEl('text', { x: 150, y: 130, 'font-size': 11, 'text-anchor': 'middle', fill: '#666' });
  label2.textContent = 'H, V';
  svg.appendChild(label2);
  
  // Q (Quadratic Bezier)
  svg.appendChild(createEl('path', {
    d: 'M 220 100 Q 260 20 300 100',
    fill: 'none', stroke: '#2ecc71', 'stroke-width': 3
  }));
  // Control point visualization
  svg.appendChild(createEl('circle', { cx: 260, cy: 20, r: 4, fill: '#27ae60' }));
  svg.appendChild(createEl('line', { x1: 220, y1: 100, x2: 260, y2: 20, stroke: '#27ae60', 'stroke-dasharray': '4' }));
  svg.appendChild(createEl('line', { x1: 260, y1: 20, x2: 300, y2: 100, stroke: '#27ae60', 'stroke-dasharray': '4' }));
  const label3 = createEl('text', { x: 260, y: 130, 'font-size': 11, 'text-anchor': 'middle', fill: '#666' });
  label3.textContent = 'Q (Quadratic)';
  svg.appendChild(label3);
  
  // C (Cubic Bezier)
  svg.appendChild(createEl('path', {
    d: 'M 340 100 C 360 20 420 20 440 100',
    fill: 'none', stroke: '#9b59b6', 'stroke-width': 3
  }));
  svg.appendChild(createEl('circle', { cx: 360, cy: 20, r: 4, fill: '#8e44ad' }));
  svg.appendChild(createEl('circle', { cx: 420, cy: 20, r: 4, fill: '#8e44ad' }));
  svg.appendChild(createEl('line', { x1: 340, y1: 100, x2: 360, y2: 20, stroke: '#8e44ad', 'stroke-dasharray': '4' }));
  svg.appendChild(createEl('line', { x1: 420, y1: 20, x2: 440, y2: 100, stroke: '#8e44ad', 'stroke-dasharray': '4' }));
  const label4 = createEl('text', { x: 390, y: 130, 'font-size': 11, 'text-anchor': 'middle', fill: '#666' });
  label4.textContent = 'C (Cubic)';
  svg.appendChild(label4);
  
  // A (Arc)
  svg.appendChild(createEl('path', {
    d: 'M 50 200 A 40 40 0 0 1 130 200',
    fill: 'none', stroke: '#f39c12', 'stroke-width': 3
  }));
  svg.appendChild(createEl('path', {
    d: 'M 50 200 A 40 40 0 1 0 130 200',
    fill: 'none', stroke: '#e67e22', 'stroke-width': 3, 'stroke-dasharray': '5'
  }));
  const label5 = createEl('text', { x: 90, y: 260, 'font-size': 11, 'text-anchor': 'middle', fill: '#666' });
  label5.textContent = 'A (Arc)';
  svg.appendChild(label5);
  
  // Complex combined path (star)
  svg.appendChild(createEl('path', {
    d: 'M 200 180 L 215 220 L 260 220 L 225 245 L 240 285 L 200 260 L 160 285 L 175 245 L 140 220 L 185 220 Z',
    fill: '#1abc9c', stroke: '#16a085', 'stroke-width': 2
  }));
  const label6 = createEl('text', { x: 200, y: 260, 'font-size': 11, 'text-anchor': 'middle', fill: '#666' });
  label6.textContent = 'Combined';
  svg.appendChild(label6);
  
  return svg;
}

// Demo 2: Splice Junction (genomic visualization)
function createSpliceDemo() {
  const svg = createSVG(500, 180);
  
  // Exon 1
  svg.appendChild(createEl('rect', {
    x: 30, y: 80, width: 120, height: 40,
    fill: '#3498db', stroke: '#2980b9', 'stroke-width': 1
  }));
  const e1 = createEl('text', { x: 90, y: 105, 'font-size': 14, 'text-anchor': 'middle', fill: 'white' });
  e1.textContent = 'Exon 1';
  svg.appendChild(e1);
  
  // Exon 2
  svg.appendChild(createEl('rect', {
    x: 350, y: 80, width: 120, height: 40,
    fill: '#3498db', stroke: '#2980b9', 'stroke-width': 1
  }));
  const e2 = createEl('text', { x: 410, y: 105, 'font-size': 14, 'text-anchor': 'middle', fill: 'white' });
  e2.textContent = 'Exon 2';
  svg.appendChild(e2);
  
  // Splice junction arc (using cubic bezier for smooth curve)
  svg.appendChild(createEl('path', {
    d: 'M 150 80 C 150 30, 350 30, 350 80',
    fill: 'none', stroke: '#e74c3c', 'stroke-width': 3
  }));
  
  // Junction count label
  const junctionLabel = createEl('text', {
    x: 250, y: 35, 'font-size': 14, 'text-anchor': 'middle', 
    fill: '#e74c3c', 'font-weight': 'bold'
  });
  junctionLabel.textContent = '127 reads';
  svg.appendChild(junctionLabel);
  
  // Alternative splice (skipped exon)
  svg.appendChild(createEl('path', {
    d: 'M 150 120 C 150 160, 350 160, 350 120',
    fill: 'none', stroke: '#95a5a6', 'stroke-width': 2, 'stroke-dasharray': '5,5'
  }));
  const altLabel = createEl('text', {
    x: 250, y: 165, 'font-size': 12, 'text-anchor': 'middle', fill: '#95a5a6'
  });
  altLabel.textContent = '(skipped: 23 reads)';
  svg.appendChild(altLabel);
  
  return svg;
}

const pathsCode = `// SVG Path Command Reference
// M x y      - Move to (start point)
// L x y      - Line to
// H x        - Horizontal line to
// V y        - Vertical line to  
// Z          - Close path

// Curves:
// Q cx cy x y       - Quadratic Bezier
// C c1x c1y c2x c2y x y - Cubic Bezier
// A rx ry rot large sweep x y - Arc

// Examples:
// Rectangle
<path d="M 20 50 L 80 50 L 80 100 L 20 100 Z"/>

// Same with H, V
<path d="M 20 50 H 80 V 100 H 20 Z"/>

// Quadratic curve (1 control point)
<path d="M 220 100 Q 260 20 300 100"/>

// Cubic curve (2 control points)  
<path d="M 340 100 C 360 20 420 20 440 100"/>

// Arc (elliptical)
<path d="M 50 200 A 40 40 0 0 1 130 200"/>`;

const spliceCode = `// Splice junction visualization
// Exons as rectangles
<rect x="30" y="80" width="120" height="40" fill="#3498db"/>
<rect x="350" y="80" width="120" height="40" fill="#3498db"/>

// Splice junction using cubic bezier
// Creates smooth arc between exon ends
<path d="M 150 80 C 150 30, 350 30, 350 80"
      stroke="#e74c3c" stroke-width="3" fill="none"/>

// The cubic bezier parameters:
// M 150 80       - Start at exon 1 right edge
// C 150 30       - First control (pull up)
//   350 30       - Second control (pull up)  
//   350 80       - End at exon 2 left edge

// Alternative splice (dashed)
<path d="M 150 120 C 150 160, 350 160, 350 120"
      stroke="#95a5a6" stroke-dasharray="5,5"/>`;

export function initSvgPaths() {
  document.getElementById('svg-paths-demo').appendChild(createPathsDemo());
  document.getElementById('svg-splice-demo').appendChild(createSpliceDemo());
  
  document.getElementById('svg-paths-code').textContent = pathsCode;
  document.getElementById('svg-splice-code').textContent = spliceCode;
}
