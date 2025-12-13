import express from 'express';
import { variants, genes } from '../data/genomicData.js';

const router = express.Router();

/**
 * @route   GET /api/variants
 * @desc    Get all variants with filtering
 * @query   gene - Filter by gene symbol
 * @query   chromosome - Filter by chromosome
 * @query   type - Filter by variant type (missense, nonsense, frameshift, etc.)
 * @query   significance - Filter by clinical significance
 * @query   minFreq - Minimum allele frequency
 * @query   maxFreq - Maximum allele frequency
 * @query   limit - Limit results (default: 100)
 * @query   offset - Offset for pagination (default: 0)
 */
router.get('/', (req, res) => {
  try {
    let result = [...variants];
    
    // Filter by gene symbol
    if (req.query.gene) {
      const gene = req.query.gene.toUpperCase();
      result = result.filter(v => v.geneSymbol.toUpperCase() === gene);
    }
    
    // Filter by chromosome
    if (req.query.chromosome) {
      const chr = req.query.chromosome.toLowerCase();
      result = result.filter(v => v.chromosome.toLowerCase() === chr);
    }
    
    // Filter by variant type
    if (req.query.type) {
      const type = req.query.type.toLowerCase();
      result = result.filter(v => v.type.toLowerCase() === type);
    }
    
    // Filter by clinical significance
    if (req.query.significance) {
      const sig = req.query.significance.toLowerCase();
      result = result.filter(v => v.clinicalSignificance.toLowerCase() === sig);
    }
    
    // Filter by frequency range
    if (req.query.minFreq) {
      const minFreq = parseFloat(req.query.minFreq);
      result = result.filter(v => v.frequency >= minFreq);
    }
    
    if (req.query.maxFreq) {
      const maxFreq = parseFloat(req.query.maxFreq);
      result = result.filter(v => v.frequency <= maxFreq);
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
      error: 'Failed to fetch variants',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/variants/stats
 * @desc    Get variant statistics (counts by type, gene, significance)
 */
router.get('/stats', (req, res) => {
  try {
    // Count by type
    const byType = variants.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {});
    
    // Count by gene
    const byGene = variants.reduce((acc, v) => {
      acc[v.geneSymbol] = (acc[v.geneSymbol] || 0) + 1;
      return acc;
    }, {});
    
    // Count by clinical significance
    const bySignificance = variants.reduce((acc, v) => {
      acc[v.clinicalSignificance] = (acc[v.clinicalSignificance] || 0) + 1;
      return acc;
    }, {});
    
    // Count by consequence
    const byConsequence = variants.reduce((acc, v) => {
      acc[v.consequence] = (acc[v.consequence] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        total: variants.length,
        byType,
        byGene,
        bySignificance,
        byConsequence
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variant statistics',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/variants/:id
 * @desc    Get a single variant by ID
 * @param   id - Variant ID
 */
router.get('/:id', (req, res) => {
  try {
    const variant = variants.find(v => v.id === req.params.id);
    
    if (!variant) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
        message: `No variant found with ID: ${req.params.id}`
      });
    }
    
    // Enrich with gene information
    const gene = genes.find(g => g.symbol === variant.geneSymbol);
    
    res.json({
      success: true,
      data: {
        ...variant,
        gene: gene || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch variant',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/variants/region/:chromosome/:start-:end
 * @desc    Get variants in a genomic region
 * @param   chromosome - Chromosome
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
    
    const result = variants.filter(v => 
      v.chromosome.toLowerCase() === chromosome.toLowerCase() &&
      v.position >= startPos &&
      v.position <= endPos
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
      error: 'Failed to fetch variants in region',
      message: error.message
    });
  }
});

export default router;
