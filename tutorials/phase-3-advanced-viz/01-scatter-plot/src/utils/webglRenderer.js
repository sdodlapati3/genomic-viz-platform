/**
 * WebGL Renderer for high-performance scatter plots
 * Handles thousands of points efficiently using WebGL
 */

export class WebGLScatterRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }
    
    this.program = null;
    this.buffers = {};
    this.pointSize = 4.0;
    this.init();
  }

  init() {
    const gl = this.gl;
    
    // Vertex shader
    const vsSource = `
      attribute vec2 aPosition;
      attribute vec3 aColor;
      attribute float aSize;
      
      uniform vec2 uScale;
      uniform vec2 uTranslate;
      uniform float uPointSize;
      
      varying vec3 vColor;
      
      void main() {
        vec2 pos = (aPosition * uScale) + uTranslate;
        gl_Position = vec4(pos, 0.0, 1.0);
        gl_PointSize = aSize * uPointSize;
        vColor = aColor;
      }
    `;
    
    // Fragment shader
    const fsSource = `
      precision mediump float;
      varying vec3 vColor;
      
      void main() {
        // Create circular points
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        
        if (dist > 0.5) {
          discard;
        }
        
        // Smooth edge
        float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha);
      }
    `;
    
    // Compile shaders
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
    
    // Create program
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);
    
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error('Shader program failed: ' + gl.getProgramInfoLog(this.program));
    }
    
    // Get attribute/uniform locations
    this.locations = {
      aPosition: gl.getAttribLocation(this.program, 'aPosition'),
      aColor: gl.getAttribLocation(this.program, 'aColor'),
      aSize: gl.getAttribLocation(this.program, 'aSize'),
      uScale: gl.getUniformLocation(this.program, 'uScale'),
      uTranslate: gl.getUniformLocation(this.program, 'uTranslate'),
      uPointSize: gl.getUniformLocation(this.program, 'uPointSize')
    };
    
    // Create buffers
    this.buffers.position = gl.createBuffer();
    this.buffers.color = gl.createBuffer();
    this.buffers.size = gl.createBuffer();
    
    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error('Shader compilation failed: ' + gl.getShaderInfoLog(shader));
    }
    
    return shader;
  }

  setData(points) {
    const gl = this.gl;
    
    // Prepare position data
    const positions = new Float32Array(points.length * 2);
    const colors = new Float32Array(points.length * 3);
    const sizes = new Float32Array(points.length);
    
    for (let i = 0; i < points.length; i++) {
      positions[i * 2] = points[i].x;
      positions[i * 2 + 1] = points[i].y;
      
      // Parse hex color to RGB
      const rgb = this.hexToRgb(points[i].color);
      colors[i * 3] = rgb.r / 255;
      colors[i * 3 + 1] = rgb.g / 255;
      colors[i * 3 + 2] = rgb.b / 255;
      
      sizes[i] = points[i].size || 1.0;
    }
    
    // Upload position data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    // Upload color data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    
    // Upload size data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.size);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
    
    this.pointCount = points.length;
  }

  render(transform = { scale: [0.1, 0.1], translate: [0, 0] }) {
    const gl = this.gl;
    
    // Clear canvas
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    if (!this.pointCount) return;
    
    gl.useProgram(this.program);
    
    // Set uniforms
    gl.uniform2fv(this.locations.uScale, transform.scale);
    gl.uniform2fv(this.locations.uTranslate, transform.translate);
    gl.uniform1f(this.locations.uPointSize, this.pointSize);
    
    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
    gl.enableVertexAttribArray(this.locations.aPosition);
    gl.vertexAttribPointer(this.locations.aPosition, 2, gl.FLOAT, false, 0, 0);
    
    // Bind color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
    gl.enableVertexAttribArray(this.locations.aColor);
    gl.vertexAttribPointer(this.locations.aColor, 3, gl.FLOAT, false, 0, 0);
    
    // Bind size buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.size);
    gl.enableVertexAttribArray(this.locations.aSize);
    gl.vertexAttribPointer(this.locations.aSize, 1, gl.FLOAT, false, 0, 0);
    
    // Draw points
    gl.drawArrays(gl.POINTS, 0, this.pointCount);
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 128, g: 128, b: 128 };
  }

  setPointSize(size) {
    this.pointSize = size;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  destroy() {
    const gl = this.gl;
    if (this.program) {
      gl.deleteProgram(this.program);
    }
    Object.values(this.buffers).forEach(buffer => {
      gl.deleteBuffer(buffer);
    });
  }
}

export default WebGLScatterRenderer;
