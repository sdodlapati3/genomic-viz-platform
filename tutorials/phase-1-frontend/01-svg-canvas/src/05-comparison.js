/**
 * SVG vs Canvas Comparison - Performance benchmark
 * Learning: When to use each technology
 */

function createSVG(width, height) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  return svg;
}

export function initComparison() {
  const elementCountSlider = document.getElementById('element-count');
  const elementCountDisplay = document.getElementById('element-count-display');
  const runButton = document.getElementById('run-benchmark');
  const svgContainer = document.getElementById('svg-benchmark-demo');
  const canvasEl = document.getElementById('canvas-benchmark-demo');
  const svgTimeDisplay = document.getElementById('svg-time');
  const canvasTimeDisplay = document.getElementById('canvas-time');
  
  if (!elementCountSlider || !runButton) return;
  
  // Update display when slider changes
  elementCountSlider.addEventListener('input', () => {
    elementCountDisplay.textContent = elementCountSlider.value;
  });
  
  // Run benchmark
  runButton.addEventListener('click', () => {
    const count = parseInt(elementCountSlider.value);
    
    // Clear previous
    svgContainer.innerHTML = '';
    
    // Generate random data
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        x: Math.random() * 380 + 10,
        y: Math.random() * 280 + 10,
        r: Math.random() * 4 + 2,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      });
    }
    
    // Benchmark SVG
    const svgStart = performance.now();
    const svg = createSVG(400, 300);
    data.forEach(d => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', d.x);
      circle.setAttribute('cy', d.y);
      circle.setAttribute('r', d.r);
      circle.setAttribute('fill', d.color);
      svg.appendChild(circle);
    });
    svgContainer.appendChild(svg);
    const svgEnd = performance.now();
    svgTimeDisplay.textContent = (svgEnd - svgStart).toFixed(2);
    
    // Benchmark Canvas
    const canvasStart = performance.now();
    const ctx = canvasEl.getContext('2d');
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    data.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.fill();
    });
    const canvasEnd = performance.now();
    canvasTimeDisplay.textContent = (canvasEnd - canvasStart).toFixed(2);
    
    // Highlight winner
    if (svgEnd - svgStart < canvasEnd - canvasStart) {
      svgTimeDisplay.style.color = '#27ae60';
      canvasTimeDisplay.style.color = '#c0392b';
    } else {
      svgTimeDisplay.style.color = '#c0392b';
      canvasTimeDisplay.style.color = '#27ae60';
    }
  });
  
  // Run initial benchmark
  runButton.click();
}
