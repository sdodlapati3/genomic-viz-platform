/**
 * BAM Parser Module
 *
 * Parses BAM (Binary Alignment Map) files using @gmod/bam
 * Provides methods for reading alignments, calculating coverage,
 * and extracting header information.
 *
 * @module parsers/bamParser
 */

import { BamFile } from '@gmod/bam';
import { LocalFile, RemoteFile } from 'generic-filehandle';
import path from 'path';

/**
 * BAM Parser class for reading binary alignment files
 *
 * BAM files contain aligned sequencing reads in a compressed binary format.
 * They use BGZF compression (blocked gzip) which allows random access.
 *
 * @example
 * const parser = new BamParser('./data/sample.bam');
 * await parser.open();
 * const header = await parser.getHeader();
 * const reads = await parser.getReadsInRegion('chr17', 7668402, 7687550);
 */
export class BamParser {
  /**
   * Create a BAM parser instance
   * @param {string} bamPath - Path to BAM file (local or URL)
   * @param {string} [indexPath] - Path to BAI index file (optional, defaults to bamPath + '.bai')
   */
  constructor(bamPath, indexPath = null) {
    this.bamPath = bamPath;
    this.indexPath = indexPath || `${bamPath}.bai`;
    this.bam = null;
    this.isOpen = false;
  }

  /**
   * Open the BAM file and load the index
   * Must be called before any other operations
   *
   * @returns {Promise<void>}
   * @throws {Error} If BAM or index file cannot be opened
   */
  async open() {
    try {
      // Determine if local or remote file
      const isRemote = this.bamPath.startsWith('http://') || this.bamPath.startsWith('https://');

      const bamFilehandle = isRemote ? new RemoteFile(this.bamPath) : new LocalFile(this.bamPath);

      const indexFilehandle = isRemote
        ? new RemoteFile(this.indexPath)
        : new LocalFile(this.indexPath);

      this.bam = new BamFile({
        bamFilehandle,
        baiFilehandle: indexFilehandle,
      });

      this.isOpen = true;
      console.log(`✓ BAM file opened: ${path.basename(this.bamPath)}`);
    } catch (error) {
      throw new Error(`Failed to open BAM file: ${error.message}`);
    }
  }

  /**
   * Ensure the BAM file is open
   * @private
   */
  _checkOpen() {
    if (!this.isOpen) {
      throw new Error('BAM file not open. Call open() first.');
    }
  }

  /**
   * Get BAM file header information
   *
   * Returns the SAM header containing:
   * - @HD: Header line (version, sort order)
   * - @SQ: Reference sequences (chromosomes)
   * - @RG: Read groups
   * - @PG: Programs used
   *
   * @returns {Promise<Object>} Parsed header object
   * @example
   * const header = await parser.getHeader();
   * console.log(header.references); // [{name: 'chr1', length: 248956422}, ...]
   */
  async getHeader() {
    this._checkOpen();

    const header = await this.bam.getHeader();

    // Parse header text into structured object
    const parsed = {
      raw: header,
      references: [],
      readGroups: [],
      programs: [],
      version: null,
      sortOrder: null,
    };

    // Parse @SQ lines for reference sequences
    const sqMatches = header.matchAll(/@SQ\s+SN:(\S+)\s+LN:(\d+)/g);
    for (const match of sqMatches) {
      parsed.references.push({
        name: match[1],
        length: parseInt(match[2], 10),
      });
    }

    // Parse @HD line for header info
    const hdMatch = header.match(/@HD\s+VN:(\S+)(?:\s+SO:(\S+))?/);
    if (hdMatch) {
      parsed.version = hdMatch[1];
      parsed.sortOrder = hdMatch[2] || 'unknown';
    }

    // Parse @RG lines for read groups
    const rgMatches = header.matchAll(/@RG\s+ID:(\S+)(?:\s+SM:(\S+))?/g);
    for (const match of rgMatches) {
      parsed.readGroups.push({
        id: match[1],
        sample: match[2] || null,
      });
    }

    return parsed;
  }

  /**
   * Get reference sequences (chromosomes) from BAM header
   *
   * @returns {Promise<Array<{name: string, length: number}>>}
   */
  async getReferences() {
    const header = await this.getHeader();
    return header.references;
  }

  /**
   * Get reads overlapping a genomic region
   *
   * @param {string} chromosome - Chromosome name (e.g., 'chr17' or '17')
   * @param {number} start - Start position (0-based)
   * @param {number} end - End position (exclusive)
   * @param {Object} [options] - Query options
   * @param {number} [options.maxRecords=10000] - Maximum records to return
   * @param {boolean} [options.includeSequence=true] - Include read sequence
   * @returns {Promise<Array>} Array of alignment records
   *
   * @example
   * // Get reads in TP53 region
   * const reads = await parser.getReadsInRegion('chr17', 7668402, 7687550);
   * console.log(`Found ${reads.length} reads`);
   */
  async getReadsInRegion(chromosome, start, end, options = {}) {
    this._checkOpen();

    const { maxRecords = 10000, includeSequence = true } = options;
    const reads = [];

    // Use the BAM file's getRecordsForRange method
    const records = await this.bam.getRecordsForRange(chromosome, start, end);

    for (const record of records) {
      if (reads.length >= maxRecords) break;

      const alignment = {
        // Core alignment info
        readName: record.get('name'),
        chromosome: record.get('seq_id'),
        start: record.get('start'),
        end: record.get('end'),

        // Alignment quality
        mapq: record.get('mq'),
        flag: record.get('flags'),

        // CIGAR string (alignment operations)
        cigar: record.get('cigar'),

        // Strand
        strand: record.get('strand') === 1 ? '+' : '-',

        // Mate pair info
        mateChromosome: record.get('next_segment_position')?.ref,
        mateStart: record.get('next_segment_position')?.pos,
        templateLength: record.get('template_length'),
      };

      // Optionally include sequence
      if (includeSequence) {
        alignment.sequence = record.get('seq');
        alignment.quality = record.get('qual');
      }

      reads.push(alignment);
    }

    return reads;
  }

  /**
   * Calculate coverage for a genomic region
   *
   * Returns binned coverage values for visualization
   *
   * @param {string} chromosome - Chromosome name
   * @param {number} start - Start position (0-based)
   * @param {number} end - End position (exclusive)
   * @param {Object} [options] - Coverage options
   * @param {number} [options.binSize=100] - Size of each bin in base pairs
   * @returns {Promise<Object>} Coverage data
   *
   * @example
   * const coverage = await parser.getCoverage('chr17', 7668402, 7687550, { binSize: 100 });
   * // { bins: [{pos: 7668402, coverage: 45}, ...], maxCoverage: 120, mean: 78.5 }
   */
  async getCoverage(chromosome, start, end, options = {}) {
    this._checkOpen();

    const { binSize = 100 } = options;
    const regionLength = end - start;
    const numBins = Math.ceil(regionLength / binSize);

    // Initialize coverage array
    const coverage = new Uint32Array(numBins);

    // Get all reads in region
    const records = await this.bam.getRecordsForRange(chromosome, start, end);

    for (const record of records) {
      const readStart = record.get('start');
      const readEnd = record.get('end');

      // Calculate which bins this read overlaps
      const binStart = Math.max(0, Math.floor((readStart - start) / binSize));
      const binEnd = Math.min(numBins - 1, Math.floor((readEnd - start) / binSize));

      // Increment coverage for overlapping bins
      for (let i = binStart; i <= binEnd; i++) {
        coverage[i]++;
      }
    }

    // Convert to array of objects
    const bins = [];
    let sum = 0;
    let max = 0;

    for (let i = 0; i < numBins; i++) {
      const pos = start + i * binSize;
      const cov = coverage[i];
      bins.push({ pos, coverage: cov });
      sum += cov;
      if (cov > max) max = cov;
    }

    return {
      chromosome,
      start,
      end,
      binSize,
      numBins,
      bins,
      stats: {
        maxCoverage: max,
        meanCoverage: sum / numBins,
        totalReads: records.length,
      },
    };
  }

  /**
   * Get summary statistics for a region
   *
   * @param {string} chromosome - Chromosome name
   * @param {number} start - Start position
   * @param {number} end - End position
   * @returns {Promise<Object>} Statistics
   */
  async getRegionStats(chromosome, start, end) {
    this._checkOpen();

    const records = await this.bam.getRecordsForRange(chromosome, start, end);

    let totalMapQ = 0;
    let forwardStrand = 0;
    let reverseStrand = 0;
    const readLengths = [];

    for (const record of records) {
      totalMapQ += record.get('mq') || 0;
      readLengths.push(record.get('end') - record.get('start'));

      if (record.get('strand') === 1) {
        forwardStrand++;
      } else {
        reverseStrand++;
      }
    }

    return {
      region: { chromosome, start, end },
      totalReads: records.length,
      averageMapQ: records.length ? (totalMapQ / records.length).toFixed(2) : 0,
      strandBalance: {
        forward: forwardStrand,
        reverse: reverseStrand,
        ratio: forwardStrand / (reverseStrand || 1),
      },
      readLength: {
        mean: readLengths.length
          ? (readLengths.reduce((a, b) => a + b, 0) / readLengths.length).toFixed(1)
          : 0,
        min: Math.min(...readLengths) || 0,
        max: Math.max(...readLengths) || 0,
      },
    };
  }

  /**
   * Close the BAM file
   */
  close() {
    this.bam = null;
    this.isOpen = false;
    console.log('✓ BAM file closed');
  }
}

/**
 * Create and open a BAM parser in one step
 *
 * @param {string} bamPath - Path to BAM file
 * @param {string} [indexPath] - Path to index file
 * @returns {Promise<BamParser>} Ready-to-use parser
 *
 * @example
 * const parser = await createBamParser('./data/sample.bam');
 * const reads = await parser.getReadsInRegion('chr17', 7668402, 7687550);
 */
export async function createBamParser(bamPath, indexPath = null) {
  const parser = new BamParser(bamPath, indexPath);
  await parser.open();
  return parser;
}

export default BamParser;
