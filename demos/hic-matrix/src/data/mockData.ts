/**
 * Generate mock Hi-C contact matrix data
 */

import type { HicMatrix, HicBin, TAD } from '../types';

/**
 * Generate simulated Hi-C contact matrix with realistic patterns
 */
export function generateHicMatrix(
  region: string,
  resolution: number,
  normalization: string
): HicMatrix {
  // Parse region (e.g., "chr1:1-50")
  const [chr, range] = region.split(':');
  const [startMb, endMb] = range.split('-').map(Number);
  const startPos = startMb * 1e6;
  const endPos = endMb * 1e6;

  // Calculate number of bins
  const regionSize = endPos - startPos;
  const numBins = Math.floor(regionSize / resolution);

  const bins: HicBin[] = [];
  let maxValue = 0;
  let minValue = Infinity;

  // Generate contact frequencies
  // Hi-C matrices have characteristic patterns:
  // 1. High values on diagonal (nearby loci interact frequently)
  // 2. TAD structure (blocks of high interaction)
  // 3. Decreasing interaction with distance

  // Simulate TAD boundaries
  const tadBoundaries = generateTADBoundaries(numBins);

  for (let i = 0; i < numBins; i++) {
    for (let j = i; j < numBins; j++) {
      // Only upper triangle (symmetric matrix)
      const distance = j - i;

      // Base interaction: exponential decay with distance
      let value = Math.exp(-distance * 0.1) * 100;

      // Add noise
      value *= 0.8 + Math.random() * 0.4;

      // Boost if in same TAD
      const sameTAD = areSameTAD(i, j, tadBoundaries);
      if (sameTAD) {
        value *= 1.5 + Math.random() * 0.5;
      }

      // Strong diagonal
      if (distance === 0) {
        value *= 3;
      }

      // Apply normalization factor
      if (normalization === 'VC') {
        value *= 0.8 + Math.random() * 0.4;
      } else if (normalization === 'VC_SQRT') {
        value = Math.sqrt(value) * 10;
      } else if (normalization === 'NONE') {
        value *= 1 + Math.random() * 2;
      }

      // Ensure positive
      value = Math.max(0, value);

      if (value > 0) {
        bins.push({
          row: i,
          col: j,
          value,
          startRow: startPos + i * resolution,
          endRow: startPos + (i + 1) * resolution,
          startCol: startPos + j * resolution,
          endCol: startPos + (j + 1) * resolution,
        });

        if (value > maxValue) maxValue = value;
        if (value < minValue) minValue = value;
      }
    }
  }

  return {
    region,
    chromosome: chr,
    startPos,
    endPos,
    resolution,
    normalization,
    bins,
    numBins,
    maxValue,
    minValue,
  };
}

/**
 * Generate TAD boundaries
 */
function generateTADBoundaries(numBins: number): number[] {
  const boundaries: number[] = [0];
  let pos = 0;

  while (pos < numBins) {
    // TAD size varies from 5-15 bins
    const tadSize = Math.floor(5 + Math.random() * 10);
    pos += tadSize;
    if (pos < numBins) {
      boundaries.push(pos);
    }
  }

  boundaries.push(numBins);
  return boundaries;
}

/**
 * Check if two bins are in the same TAD
 */
function areSameTAD(i: number, j: number, boundaries: number[]): boolean {
  for (let k = 0; k < boundaries.length - 1; k++) {
    if (
      i >= boundaries[k] &&
      i < boundaries[k + 1] &&
      j >= boundaries[k] &&
      j < boundaries[k + 1]
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Extract TADs from the matrix
 */
export function extractTADs(numBins: number): TAD[] {
  const boundaries = generateTADBoundaries(numBins);
  const tads: TAD[] = [];

  for (let k = 0; k < boundaries.length - 1; k++) {
    tads.push({
      start: boundaries[k],
      end: boundaries[k + 1],
      startBin: boundaries[k],
      endBin: boundaries[k + 1],
    });
  }

  return tads;
}

/**
 * Parse resolution string to number
 */
export function parseResolution(resolution: string): number {
  const match = resolution.match(/(\d+)(kb|mb)/i);
  if (!match) return 500000;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  return unit === 'mb' ? value * 1e6 : value * 1e3;
}
