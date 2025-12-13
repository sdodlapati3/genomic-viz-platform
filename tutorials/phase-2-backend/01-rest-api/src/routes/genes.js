import express from 'express';
import { genes, domains } from '../data/genomicData.js';

const router = express.Router();

/**
 * @route   GET /api/genes
 * @desc    Get all genes with optional filtering
 * @query   symbol - Filter by gene symbol (partial match)
 * @query   chromosome - Filter by chromosome
 * @query   biotype - Filter by biotype
 * @query   limit - Limit results (default: 100)
 * @query   offset - Offset for pagination (default: 0)
 */
router.get('/', (req, res) => {
  try {
    let result = [...genes];
    
    // Filter by symbol (case-insensitive partial match)
    if (req.query.symbol) {
      const symbol = req.query.symbol.toLowerCase();
      result = result.filter(g => 
        g.symbol.toLowerCase().includes(symbol) ||
        g.name.toLowerCase().includes(symbol)
      );
    }
    
    // Filter by chromosome
    if (req.query.chromosome) {
      const chr = req.query.chromosome.toLowerCase();
      result = result.filter(g => g.chromosome.toLowerCase() === chr);
    }
    
    // Filter by biotype
    if (req.query.biotype) {
      result = result.filter(g => g.biotype === req.query.biotype);
    }
    
    // Pagination
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const total = result.length;
    
    result = result.slice(offset, offset + limit);
    
    res.json({
      success: true,
      data: result,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch genes',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/genes/:symbol
 * @desc    Get a single gene by symbol
 * @param   symbol - Gene symbol (e.g., TP53, KRAS)
 */
router.get('/:symbol', (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const gene = genes.find(g => g.symbol.toUpperCase() === symbol);
    
    if (!gene) {
      return res.status(404).json({
        success: false,
        error: 'Gene not found',
        message: `No gene found with symbol: ${req.params.symbol}`
      });
    }
    
    res.json({
      success: true,
      data: gene
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gene',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/genes/:symbol/domains
 * @desc    Get protein domains for a gene
 * @param   symbol - Gene symbol
 */
router.get('/:symbol/domains', (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const gene = genes.find(g => g.symbol.toUpperCase() === symbol);
    
    if (!gene) {
      return res.status(404).json({
        success: false,
        error: 'Gene not found',
        message: `No gene found with symbol: ${req.params.symbol}`
      });
    }
    
    const geneDomains = domains[symbol] || [];
    
    res.json({
      success: true,
      data: {
        gene: symbol,
        domains: geneDomains
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch domains',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/genes/region/:chromosome/:start-:end
 * @desc    Get genes in a genomic region
 * @param   chromosome - Chromosome (e.g., chr17)
 * @param   start - Start position
 * @param   end - End position
 */
router.get('/region/:chromosome/:start-:end', (req, res) => {
  try {
    const { chromosome, start, end } = req.params;
    const startPos = parseInt(start);
    const endPos = parseInt(end);
    
    if (isNaN(startPos) || isNaN(endPos)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
        message: 'Start and end must be valid numbers'
      });
    }
    
    const result = genes.filter(g => 
      g.chromosome.toLowerCase() === chromosome.toLowerCase() &&
      g.end >= startPos &&
      g.start <= endPos
    );
    
    res.json({
      success: true,
      data: result,
      query: {
        chromosome,
        start: startPos,
        end: endPos
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch genes in region',
      message: error.message
    });
  }
});

export default router;
