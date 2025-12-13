import express from 'express';
import { query } from '../db/connection.js';

const router = express.Router();

/**
 * @route   GET /api/genes
 * @desc    Get all genes with optional filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { symbol, chromosome, biotype, limit = 100, offset = 0 } = req.query;
    
    let sql = 'SELECT * FROM genes WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (symbol) {
      sql += ` AND (symbol ILIKE $${paramIndex} OR name ILIKE $${paramIndex})`;
      params.push(`%${symbol}%`);
      paramIndex++;
    }
    
    if (chromosome) {
      sql += ` AND chromosome = $${paramIndex}`;
      params.push(chromosome);
      paramIndex++;
    }
    
    if (biotype) {
      sql += ` AND biotype = $${paramIndex}`;
      params.push(biotype);
      paramIndex++;
    }
    
    // Get total count
    const countResult = await query(sql.replace('SELECT *', 'SELECT COUNT(*)'), params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add pagination
    sql += ` ORDER BY symbol LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < total
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/genes/:symbol
 * @desc    Get a single gene by symbol
 */
router.get('/:symbol', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    const result = await query(
      'SELECT * FROM genes WHERE UPPER(symbol) = UPPER($1)',
      [symbol]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Gene not found',
        message: `No gene found with symbol: ${symbol}`
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/genes/:symbol/domains
 * @desc    Get protein domains for a gene
 */
router.get('/:symbol/domains', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    const result = await query(`
      SELECT pd.* 
      FROM protein_domains pd
      JOIN genes g ON pd.gene_id = g.id
      WHERE UPPER(g.symbol) = UPPER($1)
      ORDER BY pd.start_pos
    `, [symbol]);
    
    res.json({
      success: true,
      data: {
        gene: symbol.toUpperCase(),
        domains: result.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/genes/:symbol/variants
 * @desc    Get all variants for a gene
 */
router.get('/:symbol/variants', async (req, res, next) => {
  try {
    const { symbol } = req.params;
    
    const result = await query(`
      SELECT v.* 
      FROM variants v
      JOIN genes g ON v.gene_id = g.id
      WHERE UPPER(g.symbol) = UPPER($1)
      ORDER BY v.position
    `, [symbol]);
    
    res.json({
      success: true,
      data: {
        gene: symbol.toUpperCase(),
        variants: result.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/genes/region/:chromosome/:start-:end
 * @desc    Get genes in a genomic region
 */
router.get('/region/:chromosome/:start-:end', async (req, res, next) => {
  try {
    const { chromosome, start, end } = req.params;
    
    const result = await query(`
      SELECT * FROM genes 
      WHERE chromosome = $1 
        AND end_pos >= $2 
        AND start_pos <= $3
      ORDER BY start_pos
    `, [chromosome, parseInt(start), parseInt(end)]);
    
    res.json({
      success: true,
      data: result.rows,
      query: { chromosome, start: parseInt(start), end: parseInt(end) }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
