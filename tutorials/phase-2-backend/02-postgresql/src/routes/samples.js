import express from 'express';
import { query } from '../db/connection.js';

const router = express.Router();

/**
 * @route   GET /api/samples
 * @desc    Get all samples with filtering
 */
router.get('/', async (req, res, next) => {
  try {
    const { 
      project, cancerType, sex, minAge, maxAge, stage, gene,
      limit = 100, offset = 0 
    } = req.query;
    
    let sql = 'SELECT * FROM samples WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (project) {
      sql += ` AND project ILIKE $${paramIndex}`;
      params.push(`%${project}%`);
      paramIndex++;
    }
    
    if (cancerType) {
      sql += ` AND cancer_type ILIKE $${paramIndex}`;
      params.push(`%${cancerType}%`);
      paramIndex++;
    }
    
    if (sex) {
      sql += ` AND sex = $${paramIndex}`;
      params.push(sex);
      paramIndex++;
    }
    
    if (minAge) {
      sql += ` AND age >= $${paramIndex}`;
      params.push(parseInt(minAge));
      paramIndex++;
    }
    
    if (maxAge) {
      sql += ` AND age <= $${paramIndex}`;
      params.push(parseInt(maxAge));
      paramIndex++;
    }
    
    if (stage) {
      sql += ` AND stage = $${paramIndex}`;
      params.push(stage);
      paramIndex++;
    }
    
    // Filter by gene (samples with variants in this gene)
    if (gene) {
      sql = `
        SELECT DISTINCT s.* FROM samples s
        JOIN sample_variants sv ON s.id = sv.sample_id
        JOIN variants v ON sv.variant_id = v.id
        JOIN genes g ON v.gene_id = g.id
        WHERE UPPER(g.symbol) = UPPER($${paramIndex})
      `;
      params.push(gene);
      paramIndex++;
    }
    
    // Get total count
    const countResult = await query(sql.replace(/SELECT \*|SELECT DISTINCT s\.\*/, 'SELECT COUNT(DISTINCT s.id)').replace('SELECT DISTINCT s.*', 'SELECT COUNT(*)'), params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add pagination
    sql += ` ORDER BY sample_id LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
 * @route   GET /api/samples/stats
 * @desc    Get sample statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    // Total count
    const totalResult = await query('SELECT COUNT(*) FROM samples');
    
    // By project
    const byProjectResult = await query(`
      SELECT project, COUNT(*) as count 
      FROM samples 
      GROUP BY project 
      ORDER BY count DESC
    `);
    
    // By cancer type
    const byCancerTypeResult = await query(`
      SELECT cancer_type, COUNT(*) as count 
      FROM samples 
      GROUP BY cancer_type 
      ORDER BY count DESC
    `);
    
    // By sex
    const bySexResult = await query(`
      SELECT sex, COUNT(*) as count 
      FROM samples 
      GROUP BY sex
    `);
    
    // By stage
    const byStageResult = await query(`
      SELECT stage, COUNT(*) as count 
      FROM samples 
      GROUP BY stage 
      ORDER BY stage
    `);
    
    // Age statistics
    const ageStatsResult = await query(`
      SELECT 
        MIN(age) as min,
        MAX(age) as max,
        ROUND(AVG(age)) as mean,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY age) as median
      FROM samples
    `);
    
    res.json({
      success: true,
      data: {
        total: parseInt(totalResult.rows[0].count),
        byProject: Object.fromEntries(byProjectResult.rows.map(r => [r.project, parseInt(r.count)])),
        byCancerType: Object.fromEntries(byCancerTypeResult.rows.map(r => [r.cancer_type, parseInt(r.count)])),
        bySex: Object.fromEntries(bySexResult.rows.map(r => [r.sex, parseInt(r.count)])),
        byStage: Object.fromEntries(byStageResult.rows.map(r => [r.stage, parseInt(r.count)])),
        ageStats: {
          min: parseInt(ageStatsResult.rows[0].min),
          max: parseInt(ageStatsResult.rows[0].max),
          mean: parseInt(ageStatsResult.rows[0].mean),
          median: parseInt(ageStatsResult.rows[0].median)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/samples/:id
 * @desc    Get a single sample with enriched variant/gene data
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT * FROM samples WHERE sample_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sample not found',
        message: `No sample found with ID: ${id}`
      });
    }
    
    // Get variants for this sample
    const variantsResult = await query(`
      SELECT v.*, g.symbol as gene_symbol, sv.vaf, sv.depth
      FROM sample_variants sv
      JOIN variants v ON sv.variant_id = v.id
      LEFT JOIN genes g ON v.gene_id = g.id
      WHERE sv.sample_id = $1
      ORDER BY g.symbol, v.position
    `, [result.rows[0].id]);
    
    // Get affected genes
    const genesResult = await query(`
      SELECT DISTINCT g.*
      FROM sample_variants sv
      JOIN variants v ON sv.variant_id = v.id
      JOIN genes g ON v.gene_id = g.id
      WHERE sv.sample_id = $1
    `, [result.rows[0].id]);
    
    res.json({
      success: true,
      data: {
        ...result.rows[0],
        variants: variantsResult.rows,
        genes: genesResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/samples/:id/variants
 * @desc    Get variants for a specific sample
 */
router.get('/:id/variants', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First check if sample exists
    const sampleResult = await query(
      'SELECT id FROM samples WHERE sample_id = $1',
      [id]
    );
    
    if (sampleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sample not found',
        message: `No sample found with ID: ${id}`
      });
    }
    
    const result = await query(`
      SELECT 
        v.variant_id, v.chromosome, v.position, v.ref_allele, v.alt_allele,
        v.variant_type, v.aa_change, v.consequence, v.clinical_significance,
        g.symbol as gene_symbol, g.name as gene_name,
        sv.vaf, sv.depth
      FROM sample_variants sv
      JOIN variants v ON sv.variant_id = v.id
      LEFT JOIN genes g ON v.gene_id = g.id
      WHERE sv.sample_id = $1
      ORDER BY v.chromosome, v.position
    `, [sampleResult.rows[0].id]);
    
    res.json({
      success: true,
      data: {
        sampleId: id,
        variants: result.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
