/**
 * BAM Routes
 *
 * API endpoints for BAM file operations
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { BamParser } from '../parsers/bamParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Default BAM file path (can be overridden with query param)
const DEFAULT_BAM = path.join(__dirname, '../../data/sample.bam');

// Cache parser instances
const parserCache = new Map();

/**
 * Get or create a BAM parser for the given file
 */
async function getParser(bamPath) {
  if (!parserCache.has(bamPath)) {
    const parser = new BamParser(bamPath);
    await parser.open();
    parserCache.set(bamPath, parser);
  }
  return parserCache.get(bamPath);
}

/**
 * GET /api/bam/header
 * Get BAM file header information
 *
 * Query params:
 *   file - Path to BAM file (optional, uses default if not provided)
 *
 * Returns: Header object with references, version, etc.
 */
router.get('/header', async (req, res) => {
  try {
    const bamPath = req.query.file || DEFAULT_BAM;
    const parser = await getParser(bamPath);
    const header = await parser.getHeader();

    res.json({
      success: true,
      file: path.basename(bamPath),
      header,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bam/references
 * Get list of reference sequences (chromosomes)
 */
router.get('/references', async (req, res) => {
  try {
    const bamPath = req.query.file || DEFAULT_BAM;
    const parser = await getParser(bamPath);
    const references = await parser.getReferences();

    res.json({
      success: true,
      count: references.length,
      references,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bam/reads/:chromosome/:start/:end
 * Get reads overlapping a genomic region
 *
 * Path params:
 *   chromosome - Chromosome name (e.g., 'chr17')
 *   start - Start position (0-based)
 *   end - End position (exclusive)
 *
 * Query params:
 *   file - Path to BAM file
 *   maxRecords - Maximum number of reads to return (default: 1000)
 *   includeSequence - Include read sequence (default: true)
 */
router.get('/reads/:chromosome/:start/:end', async (req, res) => {
  try {
    const { chromosome, start, end } = req.params;
    const bamPath = req.query.file || DEFAULT_BAM;
    const maxRecords = parseInt(req.query.maxRecords, 10) || 1000;
    const includeSequence = req.query.includeSequence !== 'false';

    const startPos = parseInt(start, 10);
    const endPos = parseInt(end, 10);

    // Validation
    if (isNaN(startPos) || isNaN(endPos)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start or end position',
      });
    }

    if (endPos - startPos > 1000000) {
      return res.status(400).json({
        success: false,
        error: 'Region too large. Maximum 1MB per query.',
      });
    }

    const parser = await getParser(bamPath);
    const reads = await parser.getReadsInRegion(chromosome, startPos, endPos, {
      maxRecords,
      includeSequence,
    });

    res.json({
      success: true,
      region: { chromosome, start: startPos, end: endPos },
      count: reads.length,
      truncated: reads.length >= maxRecords,
      reads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bam/coverage/:chromosome/:start/:end
 * Get coverage data for a genomic region
 *
 * Path params:
 *   chromosome - Chromosome name
 *   start - Start position
 *   end - End position
 *
 * Query params:
 *   file - Path to BAM file
 *   binSize - Size of each bin in bp (default: 100)
 */
router.get('/coverage/:chromosome/:start/:end', async (req, res) => {
  try {
    const { chromosome, start, end } = req.params;
    const bamPath = req.query.file || DEFAULT_BAM;
    const binSize = parseInt(req.query.binSize, 10) || 100;

    const startPos = parseInt(start, 10);
    const endPos = parseInt(end, 10);

    // Validation
    if (isNaN(startPos) || isNaN(endPos)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start or end position',
      });
    }

    if (endPos - startPos > 10000000) {
      return res.status(400).json({
        success: false,
        error: 'Region too large. Maximum 10MB per query.',
      });
    }

    const parser = await getParser(bamPath);
    const coverage = await parser.getCoverage(chromosome, startPos, endPos, { binSize });

    res.json({
      success: true,
      ...coverage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bam/stats/:chromosome/:start/:end
 * Get summary statistics for a region
 */
router.get('/stats/:chromosome/:start/:end', async (req, res) => {
  try {
    const { chromosome, start, end } = req.params;
    const bamPath = req.query.file || DEFAULT_BAM;

    const parser = await getParser(bamPath);
    const stats = await parser.getRegionStats(chromosome, parseInt(start, 10), parseInt(end, 10));

    res.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
