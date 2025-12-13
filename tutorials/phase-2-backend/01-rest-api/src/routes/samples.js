import express from 'express';
import { samples, variants, genes } from '../data/genomicData.js';

const router = express.Router();

/**
 * @route   GET /api/samples
 * @desc    Get all samples with filtering
 * @query   project - Filter by project (e.g., TCGA-BRCA)
 * @query   cancerType - Filter by cancer type
 * @query   sex - Filter by sex (Male/Female)
 * @query   minAge - Minimum age
 * @query   maxAge - Maximum age
 * @query   stage - Filter by cancer stage
 * @query   gene - Filter by samples containing variants in a specific gene
 * @query   limit - Limit results (default: 100)
 * @query   offset - Offset for pagination (default: 0)
 */
router.get('/', (req, res) => {
  try {
    let result = [...samples];
    
    // Filter by project
    if (req.query.project) {
      result = result.filter(s => 
        s.project.toLowerCase().includes(req.query.project.toLowerCase())
      );
    }
    
    // Filter by cancer type
    if (req.query.cancerType) {
      const type = req.query.cancerType.toLowerCase();
      result = result.filter(s => 
        s.cancerType.toLowerCase().includes(type)
      );
    }
    
    // Filter by sex
    if (req.query.sex) {
      result = result.filter(s => 
        s.sex.toLowerCase() === req.query.sex.toLowerCase()
      );
    }
    
    // Filter by age range
    if (req.query.minAge) {
      const minAge = parseInt(req.query.minAge);
      result = result.filter(s => s.age >= minAge);
    }
    
    if (req.query.maxAge) {
      const maxAge = parseInt(req.query.maxAge);
      result = result.filter(s => s.age <= maxAge);
    }
    
    // Filter by stage
    if (req.query.stage) {
      result = result.filter(s => s.stage === req.query.stage);
    }
    
    // Filter by gene (samples containing variants in a specific gene)
    if (req.query.gene) {
      const geneSymbol = req.query.gene.toUpperCase();
      const geneVariantIds = variants
        .filter(v => v.geneSymbol === geneSymbol)
        .map(v => v.id);
      
      result = result.filter(s => 
        s.variantIds.some(vId => geneVariantIds.includes(vId))
      );
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
      error: 'Failed to fetch samples',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/samples/stats
 * @desc    Get sample statistics
 */
router.get('/stats', (req, res) => {
  try {
    // Count by project
    const byProject = samples.reduce((acc, s) => {
      acc[s.project] = (acc[s.project] || 0) + 1;
      return acc;
    }, {});
    
    // Count by cancer type
    const byCancerType = samples.reduce((acc, s) => {
      acc[s.cancerType] = (acc[s.cancerType] || 0) + 1;
      return acc;
    }, {});
    
    // Count by sex
    const bySex = samples.reduce((acc, s) => {
      acc[s.sex] = (acc[s.sex] || 0) + 1;
      return acc;
    }, {});
    
    // Count by stage
    const byStage = samples.reduce((acc, s) => {
      acc[s.stage] = (acc[s.stage] || 0) + 1;
      return acc;
    }, {});
    
    // Age distribution
    const ages = samples.map(s => s.age);
    const ageStats = {
      min: Math.min(...ages),
      max: Math.max(...ages),
      mean: Math.round(ages.reduce((a, b) => a + b, 0) / ages.length),
      median: ages.sort((a, b) => a - b)[Math.floor(ages.length / 2)]
    };
    
    res.json({
      success: true,
      data: {
        total: samples.length,
        byProject,
        byCancerType,
        bySex,
        byStage,
        ageStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sample statistics',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/samples/:id
 * @desc    Get a single sample by ID with enriched variant/gene data
 * @param   id - Sample ID
 */
router.get('/:id', (req, res) => {
  try {
    const sample = samples.find(s => s.id === req.params.id);
    
    if (!sample) {
      return res.status(404).json({
        success: false,
        error: 'Sample not found',
        message: `No sample found with ID: ${req.params.id}`
      });
    }
    
    // Enrich with variant details
    const sampleVariants = variants.filter(v => 
      sample.variantIds.includes(v.id)
    );
    
    // Get unique genes for this sample
    const sampleGenes = [...new Set(sampleVariants.map(v => v.geneSymbol))];
    const geneDetails = genes.filter(g => sampleGenes.includes(g.symbol));
    
    res.json({
      success: true,
      data: {
        ...sample,
        variants: sampleVariants,
        genes: geneDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sample',
      message: error.message
    });
  }
});

/**
 * @route   GET /api/samples/:id/variants
 * @desc    Get variants for a specific sample
 * @param   id - Sample ID
 */
router.get('/:id/variants', (req, res) => {
  try {
    const sample = samples.find(s => s.id === req.params.id);
    
    if (!sample) {
      return res.status(404).json({
        success: false,
        error: 'Sample not found',
        message: `No sample found with ID: ${req.params.id}`
      });
    }
    
    const sampleVariants = variants.filter(v => 
      sample.variantIds.includes(v.id)
    ).map(variant => {
      const gene = genes.find(g => g.symbol === variant.geneSymbol);
      return { ...variant, gene };
    });
    
    res.json({
      success: true,
      data: {
        sampleId: sample.id,
        variants: sampleVariants
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sample variants',
      message: error.message
    });
  }
});

export default router;
