/**
 * Canvas Basics - 2D context drawing fundamentals
 * Learning: shapes, paths, gradients, text, state management
 */

// Demo 1: Canvas Shapes
function drawCanvasShapes(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Rectangle with fill and stroke
  ctx.fillStyle = '#3498db';
  ctx.strokeStyle = '#2980b9';
  ctx.lineWidth = 2;
  ctx.fillRect(20, 20, 80, 60);
  ctx.strokeRect(20, 20, 80, 60);
  
  // Circle (using arc)
  ctx.beginPath();
  ctx.arc(180, 50, 40, 0, Math.PI * 2);
  ctx.fillStyle = '#e74c3c';
  ctx.fill();
  ctx.strokeStyle = '#c0392b';
  ctx.stroke();
  
  // Rounded rectangle (custom function)
  roundRect(ctx, 250, 20, 100, 60, 10);
  ctx.fillStyle = '#2ecc71';
  ctx.fill();
  ctx.strokeStyle = '#27ae60';
  ctx.stroke();
  
  // Triangle using path
  ctx.beginPath();
  ctx.moveTo(420, 20);
  ctx.lineTo(380, 80);
  ctx.lineTo(460, 80);
  ctx.closePath();
  ctx.fillStyle = '#9b59b6';
  ctx.fill();
  
  // Gradient rectangle
  const gradient = ctx.createLinearGradient(20, 120, 120, 200);
  gradient.addColorStop(0, '#f39c12');
  gradient.addColorStop(1, '#e74c3c');
  ctx.fillStyle = gradient;
  ctx.fillRect(20, 120, 100, 80);
  
  // Text
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#333';
  ctx.fillText('Canvas Text', 150, 160);
  
  // Radial gradient circle
  const radial = ctx.createRadialGradient(350, 160, 5, 350, 160, 50);
  radial.addColorStop(0, '#fff');
  radial.addColorStop(0.5, '#3498db');
  radial.addColorStop(1, '#2c3e50');
  ctx.beginPath();
  ctx.arc(350, 160, 50, 0, Math.PI * 2);
  ctx.fillStyle = radial;
  ctx.fill();
  
  // Dashed line
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(20, 230);
  ctx.lineTo(480, 230);
  ctx.strokeStyle = '#95a5a6';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]); // Reset
  
  // Labels
  ctx.font = '11px Arial';
  ctx.fillStyle = '#666';
  ctx.fillText('fillRect', 30, 100);
  ctx.fillText('arc', 165, 100);
  ctx.fillText('roundRect', 265, 100);
  ctx.fillText('path', 400, 100);
  ctx.fillText('gradient', 35, 220);
  ctx.fillText('radialGradient', 310, 230);
}

// Helper: Rounded rectangle
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Demo 2: Coverage Plot (genomic visualization)
function drawCoveragePlot(canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 30, right: 20, bottom: 40, left: 50 };
  
  ctx.clearRect(0, 0, width, height);
  
  // Generate mock coverage data (simulating sequencing depth)
  const dataPoints = 100;
  const coverage = [];
  let baseValue = 50;
  for (let i = 0; i < dataPoints; i++) {
    // Simulate realistic coverage with some variation
    baseValue += (Math.random() - 0.5) * 20;
    baseValue = Math.max(10, Math.min(100, baseValue));
    // Add a "hotspot" region
    if (i > 40 && i < 60) baseValue += 30;
    coverage.push(baseValue);
  }
  
  const maxCoverage = Math.max(...coverage);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  
  // Background
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(padding.left, padding.top, plotWidth, plotHeight);
  
  // Draw coverage as filled area
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + plotHeight);
  
  coverage.forEach((val, i) => {
    const x = padding.left + (i / (dataPoints - 1)) * plotWidth;
    const y = padding.top + plotHeight - (val / maxCoverage) * plotHeight;
    ctx.lineTo(x, y);
  });
  
  ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
  ctx.closePath();
  
  // Gradient fill
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + plotHeight);
  gradient.addColorStop(0, 'rgba(52, 152, 219, 0.8)');
  gradient.addColorStop(1, 'rgba(52, 152, 219, 0.2)');
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Draw line on top
  ctx.beginPath();
  coverage.forEach((val, i) => {
    const x = padding.left + (i / (dataPoints - 1)) * plotWidth;
    const y = padding.top + plotHeight - (val / maxCoverage) * plotHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#2980b9';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotHeight);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Y-axis ticks and labels
  ctx.font = '11px Arial';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (plotHeight / 4) * i;
    const value = Math.round(maxCoverage * (1 - i / 4));
    ctx.fillText(value.toString(), padding.left - 5, y + 4);
    
    // Grid line
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotWidth, y);
    ctx.strokeStyle = '#e0e0e0';
    ctx.stroke();
  }
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + plotHeight);
  ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
  ctx.strokeStyle = '#333';
  ctx.stroke();
  
  // Labels
  ctx.fillStyle = '#333';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Genomic Position (bp)', width / 2, height - 5);
  
  // Y-axis label (rotated)
  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Coverage', 0, 0);
  ctx.restore();
  
  // Title
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Read Coverage Plot', width / 2, 15);
}

const shapesCode = `// Get 2D context
const ctx = canvas.getContext('2d');

// Rectangle
ctx.fillStyle = '#3498db';
ctx.fillRect(20, 20, 80, 60);
ctx.strokeRect(20, 20, 80, 60);

// Circle using arc
ctx.beginPath();
ctx.arc(180, 50, 40, 0, Math.PI * 2);
ctx.fill();
ctx.stroke();

// Custom path (triangle)
ctx.beginPath();
ctx.moveTo(420, 20);
ctx.lineTo(380, 80);
ctx.lineTo(460, 80);
ctx.closePath();
ctx.fill();

// Linear gradient
const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
gradient.addColorStop(0, '#f39c12');
gradient.addColorStop(1, '#e74c3c');
ctx.fillStyle = gradient;

// Text
ctx.font = 'bold 16px Arial';
ctx.fillText('Canvas Text', 150, 160);

// Dashed lines
ctx.setLineDash([5, 5]);
ctx.stroke();
ctx.setLineDash([]); // Reset`;

const coverageCode = `// Coverage plot for genomics
const ctx = canvas.getContext('2d');

// Generate coverage data
const coverage = generateCoverageData();
const maxCov = Math.max(...coverage);

// Draw as filled area path
ctx.beginPath();
ctx.moveTo(left, bottom); // Start at bottom-left

coverage.forEach((val, i) => {
  const x = left + (i / n) * width;
  const y = bottom - (val / maxCov) * height;
  ctx.lineTo(x, y);
});

ctx.lineTo(right, bottom); // Close to bottom-right
ctx.closePath();

// Gradient fill for depth visualization
const gradient = ctx.createLinearGradient(0, top, 0, bottom);
gradient.addColorStop(0, 'rgba(52, 152, 219, 0.8)');
gradient.addColorStop(1, 'rgba(52, 152, 219, 0.2)');
ctx.fillStyle = gradient;
ctx.fill();

// Line on top for clarity
ctx.strokeStyle = '#2980b9';
ctx.lineWidth = 2;
ctx.stroke();`;

export function initCanvasBasics() {
  const shapesCanvas = document.getElementById('canvas-shapes-demo');
  const coverageCanvas = document.getElementById('canvas-coverage-demo');
  
  if (shapesCanvas) drawCanvasShapes(shapesCanvas);
  if (coverageCanvas) drawCoveragePlot(coverageCanvas);
  
  document.getElementById('canvas-shapes-code').textContent = shapesCode;
  document.getElementById('canvas-coverage-code').textContent = coverageCode;
}
