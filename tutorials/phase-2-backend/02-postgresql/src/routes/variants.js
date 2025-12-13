import express from 'express';
import { query } from '../db/connection.js';

const router = express.Router();

/**
 * @route   GET /api/variants
 * @desc    Get all variants with filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { 
      gene, chromosome, type, significance, 
      minFreq, maxFreq, limit = 100, offset = 0 
    } = req.query;
    
    let sql = `
      SELECT v.*, g.symbol as gene_symbol, g.name as gene_name
      FROM variants v
      LEFT JOIN genes g ON v.gene_id = g.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (gene) {
      sql += ` AND UPPER(g.symbol) = UPPER($${paramIndex})`;
      params.push(gene);
      paramIndex++;
    }
    
    if (chromosome) {
      sql += ` AND v.chromosome = $${paramIndex}`;
      params.push(chromosome);
      paramIndex++;
    }
    
    if (type) {
      sql += ` AND v.variant_type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (significance) {
      sql += ` AND v.clinical_significance = $${paramIndex}`;
      params.push(significance);
      paramIndex++;
    }
    
    if (minFreq) {
      sql += ` AND v.allele_frequency >= $${paramIndex}`;
      params.push(parseFloat(minFreq));
      paramIndex++;
    }
    
    if (maxFreq) {
      sql += ` AND v.allele_frequency <= $${paramIndex}`;
      params.push(parseFloat(maxFreq));
      paramIndex++;
    }
    
    // Get total count
    const countSql = sql.replace(/SELECT v\.\*, g\.symbol as gene_symbol, g\.name as gene_name/, 'SELECT COUNT(*)');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add pagination
    sql += ` ORDER BY v.chromosome, v.position LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
 * @route   GET /api/variants/stats
 * @desc    Get variant statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    // Total count
    const totalResult = await query('SELECT COUNT(*) FROM variants');
    
    // By type
    const byTypeResult = await query(`
      SELECT variant_type, COUNT(*) as count 
      FROM variants 
      GROUP BY variant_type 
      ORDER BY count DESC
    `);
    
    // By gene
    const byGeneResult = await query(`
      SELECT g.symbol, COUNT(*) as count 
      FROM variants v
      JOIN genes g ON v.gene_id = g.id
      GROUP BY g.symbol 
      ORDER BY count DESC
    `);
    
    // By significance
    const bySignificanceResult = await query(`
      SELECT clinical_significance, COUNT(*) as count 
      FROM variants 
      GROUP BY clinical_significance 
      ORDER BY count DESC
    `);
    
    // By consequence
    const byConsequenceResult = await query(`
      SELECT consequence, COUNT(*) as count 
      FROM variants 
      GROUP BY consequence 
      ORDER BY count DESC
    `);
    
    res.json({
      success: true,
      data: {
        total: parseInt(totalResult.rows[0].count),
        byType: Object.fromEntries(byTypeResult.rows.map(r => [r.variant_type, parseInt(r.count)])),
        byGene: Object.fromEntries(byGeneResult.rows.map(r => [r.symbol, parseInt(r.count)])),
        bySignificance: Object.fromEntries(bySignificanceResult.rows.map(r => [r.clinical_significance, parseInt(r.count)])),
        byConsequence: Object.fromEntries(byConsequenceResult.rows.map(r => [r.consequence, parseInt(r.count)]))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/variants/:id
 * @desc    Get a single variant by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT v.*, g.symbol as gene_symbol, g.name as gene_name, g.ensembl_id
      FROM variants v
      LEFT JOIN genes g ON v.gene_id = g.id
      WHERE v.variant_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Variant not found',
        message: `No variant found with ID: ${id}`
      });
    }
    
    // Get samples with this variant
    const samplesResult = await query(`
      SELECT s.sample_id, s.project, s.cancer_type, sv.vaf, sv.depth
      FROM sample_variants sv
      JOIN samples s ON sv.sample_id = s.id
      JOIN variants v ON sv.variant_id = v.id
      WHERE v.variant_id = $1
    `, [id]);
    
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        samples: samplesResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/variants/region/:chromosome/:start-:end
 * @desc    Get variants in a genomic region
 */
router.get('/region/:chromosome/:start-:end', async (req, res, next) => {
  try {
    const { chromosome, start, end } = req.params;
    
    const result = await query(`
      SELECT v.*, g.symbol as gene_symbol
      FROM variants v
      LEFT JOIN genes g ON v.gene_id = g.id
      WHERE v.chromosome = $1 
        AND v.position >= $2 
        AND v.position <= $3
      ORDER BY v.position
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
