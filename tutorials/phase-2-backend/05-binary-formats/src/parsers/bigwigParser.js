/**
 * BigWig Parser Module
 *
 * Parses BigWig files using @gmod/bbi
 * BigWig is a binary format for storing dense, continuous data
 * like coverage, ChIP-seq signal, or conservation scores.
 *
 * @module parsers/bigwigParser
 */

import { BigWig } from '@gmod/bbi';
import { LocalFile, RemoteFile } from 'generic-filehandle';
import path from 'path';

/**
 * BigWig Parser class for reading signal/coverage data
 *
 * BigWig files contain pre-computed signal values at various zoom levels,
 * allowing fast random access to coverage data for any genomic region.
 *
 * @example
 * const parser = new BigWigParser('./data/sample.bw');
 * await parser.open();
 * const signal = await parser.getSignal('chr17', 7668402, 7687550);
 */
export class BigWigParser {
  /**
   * Create a BigWig parser instance
   * @param {string} bigwigPath - Path to BigWig file (local or URL)
   */
  constructor(bigwigPath) {
    this.bigwigPath = bigwigPath;
    this.bigwig = null;
    this.isOpen = false;
    this._header = null;
  }

  /**
   * Open the BigWig file
   * Must be called before any other operations
   *
   * @returns {Promise<void>}
   * @throws {Error} If BigWig file cannot be opened
   */
  async open() {
    try {
      const isRemote =
        this.bigwigPath.startsWith('http://') || this.bigwigPath.startsWith('https://');

      const filehandle = isRemote
        ? new RemoteFile(this.bigwigPath)
        : new LocalFile(this.bigwigPath);

      this.bigwig = new BigWig({
        filehandle,
      });

      // Load header on open
      this._header = await this.bigwig.getHeader();

      this.isOpen = true;
      console.log(`✓ BigWig file opened: ${path.basename(this.bigwigPath)}`);
    } catch (error) {
      throw new Error(`Failed to open BigWig file: ${error.message}`);
    }
  }

  /**
   * Ensure the BigWig file is open
   * @private
   */
  _checkOpen() {
    if (!this.isOpen) {
      throw new Error('BigWig file not open. Call open() first.');
    }
  }

  /**
   * Get BigWig file header information
   *
   * @returns {Promise<Object>} Header object with format details
   */
  async getHeader() {
    this._checkOpen();
    return this._header;
  }

  /**
   * Get list of chromosomes in the BigWig file
   *
   * @returns {Promise<Array<{name: string, length: number}>>}
   * @example
   * const chroms = await parser.getChromosomes();
   * // [{name: 'chr1', length: 248956422}, {name: 'chr2', length: 242193529}, ...]
   */
  async getChromosomes() {
    this._checkOpen();

    const chroms = [];
    const refSeqs = this._header.refsByName;

    for (const [name, info] of Object.entries(refSeqs)) {
      chroms.push({
        name,
        id: info.id,
        length: info.length,
      });
    }

    // Sort by chromosome number/name
    chroms.sort((a, b) => {
      const aNum = parseInt(a.name.replace(/^chr/, ''), 10);
      const bNum = parseInt(b.name.replace(/^chr/, ''), 10);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.name.localeCompare(b.name);
    });

    return chroms;
  }

  /**
   * Get signal values for a genomic region
   *
   * Returns raw signal values at base-pair resolution
   * (or the closest available zoom level)
   *
   * @param {string} chromosome - Chromosome name (e.g., 'chr17')
   * @param {number} start - Start position (0-based)
   * @param {number} end - End position (exclusive)
   * @param {Object} [options] - Query options
   * @param {number} [options.basesPerPixel=1] - Resolution (bases per data point)
   * @returns {Promise<Array<{start: number, end: number, score: number}>>}
   *
   * @example
   * const signal = await parser.getSignal('chr17', 7668402, 7687550);
   * // [{start: 7668402, end: 7668403, score: 45.2}, ...]
   */
  async getSignal(chromosome, start, end, options = {}) {
    this._checkOpen();

    const { basesPerPixel = 1 } = options;

    try {
      const features = await this.bigwig.getFeatures(chromosome, start, end, {
        basesPerSpan: basesPerPixel,
      });

      return features.map((f) => ({
        start: f.start,
        end: f.end,
        score: f.score,
      }));
    } catch (error) {
      console.error(`Error getting signal for ${chromosome}:${start}-${end}:`, error.message);
      return [];
    }
  }

  /**
   * Get binned signal data for visualization
   *
   * Returns data suitable for direct plotting, with one value per bin.
   * Uses BigWig's internal zoom levels for efficient access.
   *
   * @param {string} chromosome - Chromosome name
   * @param {number} start - Start position
   * @param {number} end - End position
   * @param {Object} [options] - Binning options
   * @param {number} [options.numBins=500] - Number of bins to return
   * @returns {Promise<Object>} Binned signal data
   *
   * @example
   * const binned = await parser.getBinnedSignal('chr17', 7668402, 7687550, { numBins: 200 });
   * // { bins: [{pos: 7668402, value: 45.2}, ...], min: 0, max: 120 }
   */
  async getBinnedSignal(chromosome, start, end, options = {}) {
    this._checkOpen();

    const { numBins = 500 } = options;
    const regionLength = end - start;
    const basesPerBin = Math.max(1, Math.floor(regionLength / numBins));

    // Get features at appropriate resolution
    const features = await this.bigwig.getFeatures(chromosome, start, end, {
      basesPerSpan: basesPerBin,
    });

    // Create bins
    const bins = [];
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;

    // Initialize bins with null
    for (let i = 0; i < numBins; i++) {
      bins.push({
        pos: start + i * basesPerBin,
        value: null,
        count: 0,
      });
    }

    // Fill bins with feature data
    for (const feature of features) {
      const binIndex = Math.floor((feature.start - start) / basesPerBin);
      if (binIndex >= 0 && binIndex < numBins) {
        if (bins[binIndex].value === null) {
          bins[binIndex].value = feature.score;
          bins[binIndex].count = 1;
        } else {
          // Average multiple values in same bin
          const oldSum = bins[binIndex].value * bins[binIndex].count;
          bins[binIndex].count++;
          bins[binIndex].value = (oldSum + feature.score) / bins[binIndex].count;
        }

        if (feature.score < min) min = feature.score;
        if (feature.score > max) max = feature.score;
        sum += feature.score;
      }
    }

    // Clean up bins (remove count, handle nulls)
    const cleanedBins = bins.map((b) => ({
      pos: b.pos,
      value: b.value !== null ? b.value : 0,
    }));

    return {
      chromosome,
      start,
      end,
      basesPerBin,
      numBins,
      bins: cleanedBins,
      stats: {
        min: min === Infinity ? 0 : min,
        max: max === -Infinity ? 0 : max,
        mean: features.length ? sum / features.length : 0,
        nonZeroBins: bins.filter((b) => b.value !== null && b.value !== 0).length,
      },
    };
  }

  /**
   * Get summary statistics for a region
   *
   * @param {string} chromosome - Chromosome name
   * @param {number} start - Start position
   * @param {number} end - End position
   * @returns {Promise<Object>} Summary statistics
   */
  async getStats(chromosome, start, end) {
    this._checkOpen();

    const features = await this.bigwig.getFeatures(chromosome, start, end);

    if (features.length === 0) {
      return {
        region: { chromosome, start, end },
        count: 0,
        min: 0,
        max: 0,
        mean: 0,
        sum: 0,
        std: 0,
      };
    }

    const scores = features.map((f) => f.score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = sum / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;

    return {
      region: { chromosome, start, end },
      count: features.length,
      min: Math.min(...scores),
      max: Math.max(...scores),
      mean: mean,
      sum: sum,
      std: Math.sqrt(variance),
    };
  }

  /**
   * Get zoom levels available in the BigWig file
   *
   * BigWig files contain pre-computed summaries at different resolutions.
   * Each zoom level represents data at a different aggregation level.
   *
   * @returns {Promise<Array<{reductionLevel: number, dataOffset: number}>>}
   */
  async getZoomLevels() {
    this._checkOpen();

    const header = await this.getHeader();
    return header.zoomLevels || [];
  }

  /**
   * Close the BigWig file
   */
  close() {
    this.bigwig = null;
    this._header = null;
    this.isOpen = false;
    console.log('✓ BigWig file closed');
  }
}

/**
 * Create and open a BigWig parser in one step
 *
 * @param {string} bigwigPath - Path to BigWig file
 * @returns {Promise<BigWigParser>} Ready-to-use parser
 */
export async function createBigWigParser(bigwigPath) {
  const parser = new BigWigParser(bigwigPath);
  await parser.open();
  return parser;
}

export default BigWigParser;
