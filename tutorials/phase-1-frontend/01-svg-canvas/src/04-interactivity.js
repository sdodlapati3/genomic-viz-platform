/**
 * Interactivity - Events, tooltips, hit detection
 * Learning: SVG native events, Canvas hit testing, tooltips, drag
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

// Demo 1: SVG Interactive Mutations
function createSvgInteractive() {
  const svg = createSVG(500, 250);
  const tooltip = document.getElementById('svg-tooltip');
  
  // Mock mutation data (like lollipop plot)
  const mutations = [
    { pos: 50, aa: 'R175H', type: 'Missense', count: 892, color: '#e74c3c' },
    { pos: 120, aa: 'G245S', type: 'Missense', count: 234, color: '#e74c3c' },
    { pos: 200, aa: 'R248Q', type: 'Missense', count: 567, color: '#e74c3c' },
    { pos: 280, aa: 'R273H', type: 'Missense', count: 445, color: '#e74c3c' },
    { pos: 350, aa: 'R282W', type: 'Missense', count: 312, color: '#e74c3c' },
    { pos: 420, aa: 'E294*', type: 'Nonsense', count: 89, color: '#2c3e50' },
  ];
  
  // Protein backbone
  svg.appendChild(createEl('rect', {
    x: 30, y: 150, width: 440, height: 20,
    fill: '#ecf0f1', stroke: '#bdc3c7', 'stroke-width': 1
  }));
  
  // Domain
  svg.appendChild(createEl('rect', {
    x: 150, y: 145, width: 200, height: 30,
    fill: '#3498db', stroke: '#2980b9', 'stroke-width': 1, rx: 3
  }));
  const domainLabel = createEl('text', {
    x: 250, y: 165, 'font-size': 12, 'text-anchor': 'middle', fill: 'white'
  });
  domainLabel.textContent = 'DNA Binding Domain';
  svg.appendChild(domainLabel);
  
  // Draw mutations with interactivity
  const maxCount = Math.max(...mutations.map(m => m.count));
  
  mutations.forEach(mut => {
    const x = 30 + mut.pos;
    const stemHeight = 50 + (mut.count / maxCount) * 60;
    const radius = 8 + (mut.count / maxCount) * 8;
    
    // Stem
    const stem = createEl('line', {
      x1: x, y1: 150, x2: x, y2: 150 - stemHeight,
      stroke: '#95a5a6', 'stroke-width': 2
    });
    svg.appendChild(stem);
    
    // Lollipop head
    const head = createEl('circle', {
      cx: x, cy: 150 - stemHeight, r: radius,
      fill: mut.color, stroke: '#fff', 'stroke-width': 2,
      style: 'cursor: pointer; transition: transform 0.15s;'
    });
    
    // Interactivity
    head.addEventListener('mouseenter', (e) => {
      head.setAttribute('transform', `translate(0, -3)`);
      head.setAttribute('r', radius + 3);
      
      tooltip.innerHTML = `
        <strong>${mut.aa}</strong><br>
        Type: ${mut.type}<br>
        Count: ${mut.count} samples
      `;
      tooltip.style.left = e.pageX + 10 + 'px';
      tooltip.style.top = e.pageY - 10 + 'px';
      tooltip.classList.add('visible');
    });
    
    head.addEventListener('mouseleave', () => {
      head.setAttribute('transform', '');
      head.setAttribute('r', radius);
      tooltip.classList.remove('visible');
    });
    
    head.addEventListener('click', () => {
      alert(`Clicked mutation: ${mut.aa}\nSamples: ${mut.count}`);
    });
    
    svg.appendChild(head);
  });
  
  // Title
  const title = createEl('text', {
    x: 250, y: 230, 'font-size': 14, 'text-anchor': 'middle', fill: '#666'
  });
  title.textContent = 'TP53 Mutations (hover for details)';
  svg.appendChild(title);
  
  return svg;
}

// Demo 2: Canvas Hit Detection
function setupCanvasInteractive() {
  const canvas = document.getElementById('canvas-interactive-demo');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const tooltip = document.getElementById('canvas-tooltip');
  
  // Store shapes for hit detection
  const shapes = [
    { type: 'circle', x: 80, y: 80, r: 40, color: '#3498db', label: 'Circle A' },
    { type: 'circle', x: 200, y: 120, r: 35, color: '#e74c3c', label: 'Circle B' },
    { type: 'rect', x: 280, y: 60, w: 80, h: 60, color: '#2ecc71', label: 'Rectangle C' },
    { type: 'circle', x: 420, y: 100, r: 45, color: '#9b59b6', label: 'Circle D' },
    { type: 'rect', x: 100, y: 180, w: 100, h: 50, color: '#f39c12', label: 'Rectangle E' },
    { type: 'circle', x: 320, y: 220, r: 50, color: '#1abc9c', label: 'Circle F' },
  ];
  
  let hoveredShape = null;
  
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    shapes.forEach(shape => {
      ctx.beginPath();
      
      if (shape.type === 'circle') {
        ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
      } else {
        ctx.rect(shape.x, shape.y, shape.w, shape.h);
      }
      
      ctx.fillStyle = shape === hoveredShape 
        ? adjustColor(shape.color, 20) 
        : shape.color;
      ctx.fill();
      
      ctx.strokeStyle = shape === hoveredShape ? '#fff' : adjustColor(shape.color, -30);
      ctx.lineWidth = shape === hoveredShape ? 3 : 2;
      ctx.stroke();
      
      // Label
      ctx.font = '12px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      const labelY = shape.type === 'circle' ? shape.y + 4 : shape.y + shape.h / 2 + 4;
      const labelX = shape.type === 'circle' ? shape.x : shape.x + shape.w / 2;
      ctx.fillText(shape.label, labelX, labelY);
    });
    
    // Instructions
    ctx.font = '13px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Move mouse over shapes (Canvas hit detection)', canvas.width / 2, canvas.height - 10);
  }
  
  // Hit detection
  function getShapeAt(x, y) {
    // Check in reverse order (top shapes first)
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.type === 'circle') {
        const dx = x - shape.x;
        const dy = y - shape.y;
        if (dx * dx + dy * dy <= shape.r * shape.r) return shape;
      } else {
        if (x >= shape.x && x <= shape.x + shape.w &&
            y >= shape.y && y <= shape.y + shape.h) return shape;
      }
    }
    return null;
  }
  
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const shape = getShapeAt(x, y);
    
    if (shape !== hoveredShape) {
      hoveredShape = shape;
      canvas.style.cursor = shape ? 'pointer' : 'default';
      draw();
    }
    
    if (shape) {
      tooltip.innerHTML = `<strong>${shape.label}</strong><br>Type: ${shape.type}`;
      tooltip.style.left = e.pageX + 10 + 'px';
      tooltip.style.top = e.pageY - 10 + 'px';
      tooltip.classList.add('visible');
    } else {
      tooltip.classList.remove('visible');
    }
  });
  
  canvas.addEventListener('mouseleave', () => {
    hoveredShape = null;
    tooltip.classList.remove('visible');
    draw();
  });
  
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const shape = getShapeAt(x, y);
    if (shape) {
      alert(`Clicked: ${shape.label}`);
    }
  });
  
  draw();
}

// Helper: Adjust color brightness
function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

const svgInteractiveCode = `// SVG has native DOM events!
const circle = createEl('circle', {
  cx: x, cy: y, r: radius, fill: color
});

// Hover effects
circle.addEventListener('mouseenter', (e) => {
  circle.setAttribute('r', radius + 3);
  
  // Position tooltip
  tooltip.innerHTML = \`<strong>\${mutation.aa}</strong>\`;
  tooltip.style.left = e.pageX + 10 + 'px';
  tooltip.style.top = e.pageY - 10 + 'px';
  tooltip.classList.add('visible');
});

circle.addEventListener('mouseleave', () => {
  circle.setAttribute('r', radius);
  tooltip.classList.remove('visible');
});

// Click handling
circle.addEventListener('click', () => {
  console.log('Clicked:', mutation);
});`;

const canvasInteractiveCode = `// Canvas requires manual hit detection
const shapes = [
  { type: 'circle', x: 80, y: 80, r: 40 },
  { type: 'rect', x: 280, y: 60, w: 80, h: 60 }
];

// Hit detection function
function getShapeAt(mouseX, mouseY) {
  for (const shape of shapes.reverse()) {
    if (shape.type === 'circle') {
      // Circle: check distance from center
      const dx = mouseX - shape.x;
      const dy = mouseY - shape.y;
      if (dx*dx + dy*dy <= shape.r*shape.r) {
        return shape;
      }
    } else {
      // Rectangle: check bounds
      if (mouseX >= shape.x && 
          mouseX <= shape.x + shape.w &&
          mouseY >= shape.y && 
          mouseY <= shape.y + shape.h) {
        return shape;
      }
    }
  }
  return null;
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const shape = getShapeAt(x, y);
  if (shape) showTooltip(e, shape);
  else hideTooltip();
});`;

export function initInteractivity() {
  document.getElementById('svg-interactive-demo').appendChild(createSvgInteractive());
  setupCanvasInteractive();
  
  document.getElementById('svg-interactive-code').textContent = svgInteractiveCode;
  document.getElementById('canvas-interactive-code').textContent = canvasInteractiveCode;
}
