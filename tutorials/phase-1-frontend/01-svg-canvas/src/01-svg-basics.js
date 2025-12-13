/**
 * SVG Basics - Basic shapes, text, and groups
 * Learning: rect, circle, ellipse, line, text, g (groups), transforms
 */

// Helper to create SVG elements
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

// Demo 1: Basic Shapes
function createShapesDemo() {
  const svg = createSVG(500, 250);
  
  // Rectangle
  svg.appendChild(createEl('rect', {
    x: 20, y: 20, width: 80, height: 60,
    fill: '#3498db', stroke: '#2980b9', 'stroke-width': 2, rx: 5
  }));
  
  // Circle
  svg.appendChild(createEl('circle', {
    cx: 180, cy: 50, r: 40,
    fill: '#e74c3c', stroke: '#c0392b', 'stroke-width': 2
  }));
  
  // Ellipse
  svg.appendChild(createEl('ellipse', {
    cx: 300, cy: 50, rx: 60, ry: 30,
    fill: '#2ecc71', stroke: '#27ae60', 'stroke-width': 2
  }));
  
  // Line
  svg.appendChild(createEl('line', {
    x1: 380, y1: 20, x2: 480, y2: 80,
    stroke: '#9b59b6', 'stroke-width': 3, 'stroke-linecap': 'round'
  }));
  
  // Polygon (triangle)
  svg.appendChild(createEl('polygon', {
    points: '60,180 20,230 100,230',
    fill: '#f39c12', stroke: '#e67e22', 'stroke-width': 2
  }));
  
  // Text
  const text = createEl('text', {
    x: 180, y: 200, 'font-size': 16, 'font-family': 'Arial', fill: '#333'
  });
  text.textContent = 'SVG Text';
  svg.appendChild(text);
  
  // Group with transform
  const group = createEl('g', { transform: 'translate(300, 150)' });
  group.appendChild(createEl('rect', {
    x: 0, y: 0, width: 50, height: 50, fill: '#1abc9c'
  }));
  group.appendChild(createEl('rect', {
    x: 60, y: 0, width: 50, height: 50, fill: '#16a085',
    transform: 'rotate(15, 85, 25)'
  }));
  svg.appendChild(group);
  
  return svg;
}

// Demo 2: Gene Structure Visualization
function createGeneDemo() {
  const svg = createSVG(500, 150);
  
  // Gene data
  const gene = {
    name: 'TP53',
    start: 50,
    end: 450,
    exons: [
      { start: 50, end: 100 },
      { start: 150, end: 220 },
      { start: 280, end: 350 },
      { start: 400, end: 450 }
    ],
    direction: '+'
  };
  
  const y = 60;
  const exonHeight = 30;
  const intronY = y + exonHeight / 2;
  
  // Draw intron line (connects exons)
  svg.appendChild(createEl('line', {
    x1: gene.start, y1: intronY, x2: gene.end, y2: intronY,
    stroke: '#95a5a6', 'stroke-width': 2
  }));
  
  // Draw exons
  gene.exons.forEach((exon, i) => {
    svg.appendChild(createEl('rect', {
      x: exon.start, y: y, width: exon.end - exon.start, height: exonHeight,
      fill: '#3498db', stroke: '#2980b9', 'stroke-width': 1, rx: 3
    }));
    
    // Exon label
    const label = createEl('text', {
      x: exon.start + (exon.end - exon.start) / 2,
      y: y + exonHeight / 2 + 5,
      'font-size': 12, 'text-anchor': 'middle', fill: 'white'
    });
    label.textContent = `E${i + 1}`;
    svg.appendChild(label);
  });
  
  // Gene name
  const nameLabel = createEl('text', {
    x: 250, y: 30, 'font-size': 18, 'font-weight': 'bold',
    'text-anchor': 'middle', fill: '#2c3e50'
  });
  nameLabel.textContent = gene.name;
  svg.appendChild(nameLabel);
  
  // Direction arrow
  const arrowX = gene.direction === '+' ? gene.end + 10 : gene.start - 10;
  svg.appendChild(createEl('polygon', {
    points: gene.direction === '+' 
      ? `${arrowX},${intronY} ${arrowX - 15},${intronY - 8} ${arrowX - 15},${intronY + 8}`
      : `${arrowX},${intronY} ${arrowX + 15},${intronY - 8} ${arrowX + 15},${intronY + 8}`,
    fill: '#e74c3c'
  }));
  
  // Scale bar
  svg.appendChild(createEl('line', {
    x1: 50, y1: 120, x2: 150, y2: 120,
    stroke: '#333', 'stroke-width': 2
  }));
  const scaleText = createEl('text', {
    x: 100, y: 138, 'font-size': 12, 'text-anchor': 'middle', fill: '#666'
  });
  scaleText.textContent = '100 bp';
  svg.appendChild(scaleText);
  
  return svg;
}

// Code snippets for display
const shapesCode = `// Create SVG element
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('viewBox', '0 0 500 250');

// Rectangle with rounded corners
<rect x="20" y="20" width="80" height="60" 
      fill="#3498db" stroke="#2980b9" rx="5"/>

// Circle
<circle cx="180" cy="50" r="40" fill="#e74c3c"/>

// Ellipse  
<ellipse cx="300" cy="50" rx="60" ry="30" fill="#2ecc71"/>

// Line with round caps
<line x1="380" y1="20" x2="480" y2="80" 
      stroke="#9b59b6" stroke-width="3"/>

// Group with transform
<g transform="translate(300, 150)">
  <rect x="0" y="0" width="50" height="50"/>
  <rect x="60" y="0" transform="rotate(15)"/>
</g>`;

const geneCode = `// Gene structure visualization
const gene = {
  name: 'TP53',
  exons: [
    { start: 50, end: 100 },
    { start: 150, end: 220 },
    { start: 280, end: 350 },
    { start: 400, end: 450 }
  ]
};

// Intron line (backbone)
<line x1="50" y1="75" x2="450" y2="75" stroke="#95a5a6"/>

// Exons as rectangles
gene.exons.forEach((exon, i) => {
  <rect x={exon.start} width={exon.end - exon.start}
        height="30" fill="#3498db" rx="3"/>
  <text>E{i + 1}</text>
});

// Direction arrow
<polygon points="460,75 445,67 445,83" fill="#e74c3c"/>`;

export function initSvgBasics() {
  // Render demos
  document.getElementById('svg-shapes-demo').appendChild(createShapesDemo());
  document.getElementById('svg-gene-demo').appendChild(createGeneDemo());
  
  // Show code
  document.getElementById('svg-shapes-code').textContent = shapesCode;
  document.getElementById('svg-gene-code').textContent = geneCode;
}
