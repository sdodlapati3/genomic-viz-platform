/**
 * BigWig Routes
 *
 * API endpoints for BigWig file operations
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { BigWigParser } from '../parsers/bigwigParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Default BigWig file path
const DEFAULT_BIGWIG = path.join(__dirname, '../../data/sample.bw');

// Cache parser instances
const parserCache = new Map();

/**
 * Get or create a BigWig parser for the given file
 */
async function getParser(bigwigPath) {
  if (!parserCache.has(bigwigPath)) {
    const parser = new BigWigParser(bigwigPath);
    await parser.open();
    parserCache.set(bigwigPath, parser);
  }
  return parserCache.get(bigwigPath);
}

/**
 * GET /api/bigwig/header
 * Get BigWig file header information
 */
router.get('/header', async (req, res) => {
  try {
    const bigwigPath = req.query.file || DEFAULT_BIGWIG;
    const parser = await getParser(bigwigPath);
    const header = await parser.getHeader();

    res.json({
      success: true,
      file: path.basename(bigwigPath),
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
 * GET /api/bigwig/chromosomes
 * Get list of chromosomes in the BigWig file
 */
router.get('/chromosomes', async (req, res) => {
  try {
    const bigwigPath = req.query.file || DEFAULT_BIGWIG;
    const parser = await getParser(bigwigPath);
    const chromosomes = await parser.getChromosomes();

    res.json({
      success: true,
      count: chromosomes.length,
      chromosomes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bigwig/signal/:chromosome/:start/:end
 * Get signal values for a genomic region
 *
 * Path params:
 *   chromosome - Chromosome name (e.g., 'chr17')
 *   start - Start position (0-based)
 *   end - End position (exclusive)
 *
 * Query params:
 *   file - Path to BigWig file
 *   basesPerPixel - Resolution (default: auto-calculated)
 */
router.get('/signal/:chromosome/:start/:end', async (req, res) => {
  try {
    const { chromosome, start, end } = req.params;
    const bigwigPath = req.query.file || DEFAULT_BIGWIG;
    const basesPerPixel = parseInt(req.query.basesPerPixel, 10) || 1;

    const startPos = parseInt(start, 10);
    const endPos = parseInt(end, 10);

    // Validation
    if (isNaN(startPos) || isNaN(endPos)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start or end position',
      });
    }

    if (endPos - startPos > 100000000) {
      return res.status(400).json({
        success: false,
        error: 'Region too large. Maximum 100MB per query.',
      });
    }

    const parser = await getParser(bigwigPath);
    const signal = await parser.getSignal(chromosome, startPos, endPos, {
      basesPerPixel,
    });

    res.json({
      success: true,
      region: { chromosome, start: startPos, end: endPos },
      count: signal.length,
      signal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bigwig/binned/:chromosome/:start/:end
 * Get binned signal data for visualization
 *
 * Path params:
 *   chromosome - Chromosome name
 *   start - Start position
 *   end - End position
 *
 * Query params:
 *   file - Path to BigWig file
 *   numBins - Number of bins (default: 500)
 */
router.get('/binned/:chromosome/:start/:end', async (req, res) => {
  try {
    const { chromosome, start, end } = req.params;
    const bigwigPath = req.query.file || DEFAULT_BIGWIG;
    const numBins = parseInt(req.query.numBins, 10) || 500;

    const startPos = parseInt(start, 10);
    const endPos = parseInt(end, 10);

    // Validation
    if (isNaN(startPos) || isNaN(endPos)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid start or end position',
      });
    }

    if (numBins > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 5000 bins per query.',
      });
    }

    const parser = await getParser(bigwigPath);
    const binned = await parser.getBinnedSignal(chromosome, startPos, endPos, {
      numBins,
    });

    res.json({
      success: true,
      ...binned,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/bigwig/stats/:chromosome/:start/:end
 * Get summary statistics for a region
 */
router.get('/stats/:chromosome/:start/:end', async (req, res) => {
  try {
    const { chromosome, start, end } = req.params;
    const bigwigPath = req.query.file || DEFAULT_BIGWIG;

    const parser = await getParser(bigwigPath);
    const stats = await parser.getStats(chromosome, parseInt(start, 10), parseInt(end, 10));

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

/**
 * GET /api/bigwig/zoom-levels
 * Get available zoom levels
 */
router.get('/zoom-levels', async (req, res) => {
  try {
    const bigwigPath = req.query.file || DEFAULT_BIGWIG;
    const parser = await getParser(bigwigPath);
    const zoomLevels = await parser.getZoomLevels();

    res.json({
      success: true,
      count: zoomLevels.length,
      zoomLevels,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
