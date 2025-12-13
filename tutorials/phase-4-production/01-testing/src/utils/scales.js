/**
 * Scale Utilities
 * Custom scale functions for genomic data visualization
 */

/**
 * Create a linear scale
 * @param {Array} domain - [min, max] input values
 * @param {Array} range - [min, max] output values
 * @returns {Function} Scale function
 */
export function linearScale(domain, range) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const domainSpan = d1 - d0;
  const rangeSpan = r1 - r0;
  
  const scale = (value) => {
    if (domainSpan === 0) return r0;
    return r0 + ((value - d0) / domainSpan) * rangeSpan;
  };
  
  scale.invert = (value) => {
    if (rangeSpan === 0) return d0;
    return d0 + ((value - r0) / rangeSpan) * domainSpan;
  };
  
  scale.domain = () => [...domain];
  scale.range = () => [...range];
  
  return scale;
}

/**
 * Create a log scale (base 10)
 * @param {Array} domain - [min, max] input values (must be positive)
 * @param {Array} range - [min, max] output values
 * @returns {Function} Scale function
 */
export function logScale(domain, range) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  
  if (d0 <= 0 || d1 <= 0) {
    throw new Error('Log scale domain must be positive');
  }
  
  const logD0 = Math.log10(d0);
  const logD1 = Math.log10(d1);
  const logSpan = logD1 - logD0;
  const rangeSpan = r1 - r0;
  
  const scale = (value) => {
    if (value <= 0) return r0;
    if (logSpan === 0) return r0;
    return r0 + ((Math.log10(value) - logD0) / logSpan) * rangeSpan;
  };
  
  scale.invert = (value) => {
    if (rangeSpan === 0) return d0;
    const logValue = logD0 + ((value - r0) / rangeSpan) * logSpan;
    return Math.pow(10, logValue);
  };
  
  scale.domain = () => [...domain];
  scale.range = () => [...range];
  
  return scale;
}

/**
 * Create a chromosome position scale
 * Maps genomic coordinates to pixel positions
 * @param {Array} chromosomes - Array of { name, length } objects
 * @param {number} width - Total width in pixels
 * @param {number} gap - Gap between chromosomes in pixels
 * @returns {Object} Scale with position and chromosome lookup methods
 */
export function chromosomeScale(chromosomes, width, gap = 2) {
  const totalLength = chromosomes.reduce((sum, chr) => sum + chr.length, 0);
  const totalGaps = (chromosomes.length - 1) * gap;
  const availableWidth = width - totalGaps;
  
  // Pre-calculate chromosome offsets
  const offsets = [];
  let currentOffset = 0;
  
  for (const chr of chromosomes) {
    const chrWidth = (chr.length / totalLength) * availableWidth;
    offsets.push({
      name: chr.name,
      length: chr.length,
      pixelStart: currentOffset,
      pixelEnd: currentOffset + chrWidth,
      scale: linearScale([0, chr.length], [currentOffset, currentOffset + chrWidth])
    });
    currentOffset += chrWidth + gap;
  }
  
  return {
    /**
     * Convert genomic position to pixel position
     * @param {string} chromosome - Chromosome name
     * @param {number} position - Base pair position
     * @returns {number} Pixel position
     */
    toPixel(chromosome, position) {
      const chr = offsets.find(o => o.name === chromosome);
      if (!chr) return null;
      return chr.scale(position);
    },
    
    /**
     * Convert pixel position to genomic position
     * @param {number} pixel - Pixel position
     * @returns {Object} { chromosome, position }
     */
    toGenome(pixel) {
      const chr = offsets.find(o => pixel >= o.pixelStart && pixel <= o.pixelEnd);
      if (!chr) return null;
      return {
        chromosome: chr.name,
        position: Math.round(chr.scale.invert(pixel))
      };
    },
    
    /**
     * Get chromosome info
     * @param {string} name - Chromosome name
     * @returns {Object} Chromosome offset info
     */
    getChromosome(name) {
      return offsets.find(o => o.name === name);
    },
    
    /**
     * Get all chromosomes
     * @returns {Array} All chromosome offsets
     */
    chromosomes() {
      return offsets;
    }
  };
}

/**
 * Create a color scale
 * @param {Array} domain - Input values
 * @param {Array} colors - Output colors
 * @param {string} interpolation - 'linear' or 'discrete'
 * @returns {Function} Color scale function
 */
export function colorScale(domain, colors, interpolation = 'linear') {
  if (interpolation === 'discrete') {
    // Discrete color mapping
    // Domain contains thresholds, colors has len(domain)+1 entries
    return (value) => {
      for (let i = 0; i < domain.length; i++) {
        if (value < domain[i]) return colors[i];
      }
      return colors[colors.length - 1];
    };
  }
  
  // Linear interpolation
  const [d0, d1] = domain;
  const span = d1 - d0;
  
  return (value) => {
    if (span === 0) return colors[0];
    
    const t = Math.max(0, Math.min(1, (value - d0) / span));
    const i = t * (colors.length - 1);
    const lower = Math.floor(i);
    const upper = Math.min(lower + 1, colors.length - 1);
    const f = i - lower;
    
    // Parse colors and interpolate
    const c1 = parseColor(colors[lower]);
    const c2 = parseColor(colors[upper]);
    
    const r = Math.round(c1.r + (c2.r - c1.r) * f);
    const g = Math.round(c1.g + (c2.g - c1.g) * f);
    const b = Math.round(c1.b + (c2.b - c1.b) * f);
    
    return `rgb(${r}, ${g}, ${b})`;
  };
}

/**
 * Parse color string to RGB object
 * @param {string} color - Hex or rgb color string
 * @returns {Object} { r, g, b }
 */
export function parseColor(color) {
  // Hex color
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const fullHex = hex.length === 3
      ? hex.split('').map(c => c + c).join('')
      : hex;
    
    return {
      r: parseInt(fullHex.slice(0, 2), 16),
      g: parseInt(fullHex.slice(2, 4), 16),
      b: parseInt(fullHex.slice(4, 6), 16)
    };
  }
  
  // RGB color
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10)
    };
  }
  
  // Default fallback
  return { r: 0, g: 0, b: 0 };
}
