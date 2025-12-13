/**
 * Exercise 2 Solution: SVG Interactivity
 * 
 * Add interactivity to SVG elements
 */

// Task: Create interactive SVG with hover effects and click handlers

export function createInteractiveSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '500');
  svg.setAttribute('height', '400');
  svg.setAttribute('viewBox', '0 0 500 400');

  // Add CSS styles for hover effects
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `
    .interactive-shape {
      cursor: pointer;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    .interactive-shape:hover {
      opacity: 0.8;
      transform-origin: center;
    }
    .circle-shape:hover {
      transform: scale(1.1);
    }
    .rect-shape:hover {
      stroke-width: 4;
    }
    .tooltip {
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .tooltip.visible {
      opacity: 1;
    }
  `;
  svg.appendChild(style);

  // Create shapes with data
  const shapes = [
    { type: 'circle', cx: 100, cy: 100, r: 50, fill: '#3498db', label: 'Mutations: 42' },
    { type: 'circle', cx: 250, cy: 150, r: 40, fill: '#e74c3c', label: 'Mutations: 28' },
    { type: 'rect', x: 350, y: 80, width: 80, height: 60, fill: '#2ecc71', label: 'Samples: 156' },
    { type: 'circle', cx: 150, cy: 280, r: 60, fill: '#9b59b6', label: 'Mutations: 73' },
    { type: 'rect', x: 280, y: 250, width: 100, height: 70, fill: '#f39c12', label: 'Samples: 89' },
  ];

  // Create tooltip
  const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  tooltip.setAttribute('class', 'tooltip');
  
  const tooltipBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  tooltipBg.setAttribute('fill', 'rgba(0,0,0,0.8)');
  tooltipBg.setAttribute('rx', '4');
  
  const tooltipText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  tooltipText.setAttribute('fill', 'white');
  tooltipText.setAttribute('font-size', '14');
  
  tooltip.appendChild(tooltipBg);
  tooltip.appendChild(tooltipText);

  // Create shapes
  shapes.forEach((shape, index) => {
    let element;
    
    if (shape.type === 'circle') {
      element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      element.setAttribute('cx', shape.cx);
      element.setAttribute('cy', shape.cy);
      element.setAttribute('r', shape.r);
      element.setAttribute('class', 'interactive-shape circle-shape');
    } else {
      element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      element.setAttribute('x', shape.x);
      element.setAttribute('y', shape.y);
      element.setAttribute('width', shape.width);
      element.setAttribute('height', shape.height);
      element.setAttribute('class', 'interactive-shape rect-shape');
    }
    
    element.setAttribute('fill', shape.fill);
    element.setAttribute('stroke', '#333');
    element.setAttribute('stroke-width', '2');
    element.setAttribute('data-label', shape.label);
    element.setAttribute('data-index', index);

    // Add event listeners
    element.addEventListener('mouseenter', (e) => {
      const label = e.target.getAttribute('data-label');
      const bbox = e.target.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      
      tooltipText.textContent = label;
      const textBBox = tooltipText.getBBox();
      
      tooltipBg.setAttribute('width', textBBox.width + 16);
      tooltipBg.setAttribute('height', textBBox.height + 8);
      
      const x = bbox.left - svgRect.left + bbox.width / 2 - textBBox.width / 2 - 8;
      const y = bbox.top - svgRect.top - textBBox.height - 16;
      
      tooltip.setAttribute('transform', `translate(${x}, ${y})`);
      tooltipText.setAttribute('x', '8');
      tooltipText.setAttribute('y', textBBox.height);
      
      tooltip.classList.add('visible');
    });

    element.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });

    element.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      console.log(`Clicked shape ${index}:`, shapes[index]);
      
      // Visual feedback
      const originalFill = e.target.getAttribute('fill');
      e.target.setAttribute('fill', '#fff');
      setTimeout(() => e.target.setAttribute('fill', originalFill), 200);
    });

    svg.appendChild(element);
  });

  svg.appendChild(tooltip);
  return svg;
}

// Task: Create a draggable element
export function createDraggableSVG() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '500');
  svg.setAttribute('height', '400');
  svg.setAttribute('viewBox', '0 0 500 400');
  svg.style.border = '1px solid #ccc';

  // Create draggable circle
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '250');
  circle.setAttribute('cy', '200');
  circle.setAttribute('r', '40');
  circle.setAttribute('fill', '#3498db');
  circle.setAttribute('stroke', '#2980b9');
  circle.setAttribute('stroke-width', '3');
  circle.style.cursor = 'grab';

  let isDragging = false;
  let offset = { x: 0, y: 0 };

  circle.addEventListener('mousedown', (e) => {
    isDragging = true;
    circle.style.cursor = 'grabbing';
    
    const svgPoint = svg.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const transformed = svgPoint.matrixTransform(svg.getScreenCTM().inverse());
    
    offset.x = transformed.x - parseFloat(circle.getAttribute('cx'));
    offset.y = transformed.y - parseFloat(circle.getAttribute('cy'));
  });

  svg.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const svgPoint = svg.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    const transformed = svgPoint.matrixTransform(svg.getScreenCTM().inverse());

    const newCx = transformed.x - offset.x;
    const newCy = transformed.y - offset.y;

    // Constrain to bounds
    const r = parseFloat(circle.getAttribute('r'));
    const constrainedCx = Math.max(r, Math.min(500 - r, newCx));
    const constrainedCy = Math.max(r, Math.min(400 - r, newCy));

    circle.setAttribute('cx', constrainedCx);
    circle.setAttribute('cy', constrainedCy);
  });

  svg.addEventListener('mouseup', () => {
    isDragging = false;
    circle.style.cursor = 'grab';
  });

  svg.addEventListener('mouseleave', () => {
    isDragging = false;
    circle.style.cursor = 'grab';
  });

  // Instructions text
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '250');
  text.setAttribute('y', '30');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', '#666');
  text.textContent = 'Drag the circle!';

  svg.appendChild(text);
  svg.appendChild(circle);
  return svg;
}

// Export for use
export default {
  createInteractiveSVG,
  createDraggableSVG,
};
