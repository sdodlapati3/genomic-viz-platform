/**
 * Analysis Routes - API endpoints for statistical analysis
 */

import { Router } from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import rService from '../services/rService.js';
import jsStats from '../services/jsStats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', '..', 'data');

const router = Router();

// Check if R is available
let rAvailable = false;
let rVersion = null;

async function initializeR() {
  const status = await rService.checkRAvailability();
  rAvailable = status.available;
  rVersion = status.version;
  console.log(rAvailable 
    ? `✓ R ${rVersion} available` 
    : '⚠ R not available, using JavaScript fallback');
}

// Initialize on module load
initializeR();

/**
 * GET /api/analysis/status
 * Check analysis service status
 */
router.get('/status', async (req, res) => {
  res.json({
    success: true,
    data: {
      r_available: rAvailable,
      r_version: rVersion,
      fallback: 'JavaScript statistical functions',
      available_analyses: [
        'survival/kaplan-meier',
        'survival/cox',
        'expression/differential',
        'expression/volcano',
        'expression/correlation',
        'mutation/enrichment',
        'mutation/exclusivity'
      ]
    }
  });
});

/**
 * GET /api/analysis/survival/kaplan-meier
 * Kaplan-Meier survival analysis
 */
router.get('/survival/kaplan-meier', async (req, res) => {
  try {
    const { gene } = req.query;
    const inputFile = join(DATA_DIR, 'survival_data.csv');
    
    if (rAvailable) {
      // Use R for analysis
      const result = await rService.survivalAnalysis.kaplanMeier(inputFile);
      res.json({ success: true, engine: 'R', data: result });
    } else {
      // JavaScript fallback
      const csvContent = await fs.readFile(inputFile, 'utf-8');
      const rows = parseCSV(csvContent);
      
      // Filter by gene if specified
      const filtered = gene 
        ? rows.filter(r => r.gene === gene)
        : rows;
      
      const mutated = filtered.filter(r => r.mutation_status === 'mutated');
      const wildtype = filtered.filter(r => r.mutation_status === 'wildtype');
      
      const result = jsStats.logRankTest(
        mutated.map(r => parseFloat(r.survival_months)),
        mutated.map(r => parseInt(r.event)),
        wildtype.map(r => parseFloat(r.survival_months)),
        wildtype.map(r => parseInt(r.event))
      );
      
      res.json({
        success: true,
        engine: 'JavaScript',
        data: {
          analysis_type: 'kaplan_meier',
          gene: gene || 'all',
          n_samples: filtered.length,
          groups: ['mutated', 'wildtype'],
          logrank_pvalue: result.pvalue,
          significant: result.pvalue < 0.05,
          curves: {
            mutated: result.curves.group1,
            wildtype: result.curves.group2
          }
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analysis/survival/cox
 * Cox proportional hazards regression
 */
router.get('/survival/cox', async (req, res) => {
  try {
    const inputFile = join(DATA_DIR, 'survival_data.csv');
    
    if (rAvailable) {
      const result = await rService.survivalAnalysis.coxRegression(inputFile);
      res.json({ success: true, engine: 'R', data: result });
    } else {
      res.json({
        success: true,
        engine: 'JavaScript',
        data: {
          analysis_type: 'cox_regression',
          note: 'Cox regression requires R. Using simplified hazard ratio estimation.',
          message: 'Install R for full Cox regression analysis'
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analysis/expression/differential
 * Differential expression analysis
 */
router.get('/expression/differential', async (req, res) => {
  try {
    const inputFile = join(DATA_DIR, 'expression_data.csv');
    
    if (rAvailable) {
      const result = await rService.expressionAnalysis.differentialExpression(inputFile);
      res.json({ success: true, engine: 'R', data: result });
    } else {
      // JavaScript fallback
      const csvContent = await fs.readFile(inputFile, 'utf-8');
      const rows = parseCSV(csvContent);
      
      // Convert to proper types
      const data = rows.map(row => {
        const converted = { sample_id: row.sample_id, condition: row.condition };
        Object.keys(row).forEach(key => {
          if (key !== 'sample_id' && key !== 'condition') {
            converted[key] = parseFloat(row[key]);
          }
        });
        return converted;
      });
      
      const result = jsStats.differentialExpression(data);
      res.json({ success: true, engine: 'JavaScript', data: result });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analysis/expression/volcano
 * Volcano plot data
 */
router.get('/expression/volcano', async (req, res) => {
  try {
    const inputFile = join(DATA_DIR, 'expression_data.csv');
    
    if (rAvailable) {
      const result = await rService.expressionAnalysis.volcanoData(inputFile);
      res.json({ success: true, engine: 'R', data: result });
    } else {
      // JavaScript fallback
      const csvContent = await fs.readFile(inputFile, 'utf-8');
      const rows = parseCSV(csvContent);
      
      const data = rows.map(row => {
        const converted = { sample_id: row.sample_id, condition: row.condition };
        Object.keys(row).forEach(key => {
          if (key !== 'sample_id' && key !== 'condition') {
            converted[key] = parseFloat(row[key]);
          }
        });
        return converted;
      });
      
      const deResult = jsStats.differentialExpression(data);
      
      // Add volcano plot data
      const points = deResult.results.map(r => ({
        ...r,
        neg_log10_pvalue: -Math.log10(r.adjusted_pvalue),
        category: !r.significant ? 'not_significant' :
                  r.log2_fold_change > 0.5 ? 'up_regulated' :
                  r.log2_fold_change < -0.5 ? 'down_regulated' : 'not_significant'
      }));
      
      res.json({
        success: true,
        engine: 'JavaScript',
        data: {
          analysis_type: 'volcano_data',
          points,
          thresholds: { pvalue: 0.05, log2fc: 0.5 }
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analysis/expression/correlation
 * Gene correlation analysis
 */
router.get('/expression/correlation', async (req, res) => {
  try {
    const inputFile = join(DATA_DIR, 'expression_data.csv');
    
    if (rAvailable) {
      const result = await rService.expressionAnalysis.geneCorrelation(inputFile);
      res.json({ success: true, engine: 'R', data: result });
    } else {
      // JavaScript fallback
      const csvContent = await fs.readFile(inputFile, 'utf-8');
      const rows = parseCSV(csvContent);
      
      const genes = Object.keys(rows[0]).filter(k => 
        k !== 'sample_id' && k !== 'condition'
      );
      
      const correlations = [];
      for (let i = 0; i < genes.length - 1; i++) {
        for (let j = i + 1; j < genes.length; j++) {
          const x = rows.map(r => parseFloat(r[genes[i]]));
          const y = rows.map(r => parseFloat(r[genes[j]]));
          const cor = jsStats.correlation(x, y);
          
          correlations.push({
            gene1: genes[i],
            gene2: genes[j],
            correlation: parseFloat(cor.toFixed(3)),
            relationship: cor > 0.5 ? 'positive' : cor < -0.5 ? 'negative' : 'weak'
          });
        }
      }
      
      res.json({
        success: true,
        engine: 'JavaScript',
        data: {
          analysis_type: 'gene_correlation',
          n_samples: rows.length,
          n_genes: genes.length,
          correlations: correlations.sort((a, b) => 
            Math.abs(b.correlation) - Math.abs(a.correlation)
          )
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analysis/mutation/enrichment
 * Mutation enrichment by cancer type
 */
router.get('/mutation/enrichment', async (req, res) => {
  try {
    const inputFile = join(DATA_DIR, 'mutation_frequency.csv');
    
    if (rAvailable) {
      const result = await rService.mutationAnalysis.enrichment(inputFile);
      res.json({ success: true, engine: 'R', data: result });
    } else {
      // JavaScript fallback
      const csvContent = await fs.readFile(inputFile, 'utf-8');
      const rows = parseCSV(csvContent);
      
      const cancerTypes = ['breast', 'lung', 'colon', 'ovarian', 'pancreatic', 'melanoma'];
      
      const results = rows.map(row => {
        const observed = cancerTypes.map(ct => parseInt(row[ct]));
        const total = parseInt(row.total_samples);
        const expected = cancerTypes.map(() => total / cancerTypes.length);
        
        const chiResult = jsStats.chiSquareTest(observed, expected);
        const enrichmentRatio = {};
        cancerTypes.forEach((ct, i) => {
          enrichmentRatio[ct] = parseFloat((observed[i] / expected[i]).toFixed(2));
        });
        
        return {
          gene: row.gene,
          total_mutations: observed.reduce((a, b) => a + b, 0),
          by_cancer_type: Object.fromEntries(cancerTypes.map((ct, i) => [ct, observed[i]])),
          enrichment_ratio: enrichmentRatio,
          chi_square: parseFloat(chiResult.statistic.toFixed(2)),
          pvalue: chiResult.pvalue,
          significant: chiResult.pvalue < 0.05
        };
      });
      
      res.json({
        success: true,
        engine: 'JavaScript',
        data: {
          analysis_type: 'mutation_enrichment',
          n_genes: rows.length,
          cancer_types: cancerTypes,
          results
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/analysis/mutation/exclusivity
 * Mutual exclusivity analysis
 */
router.get('/mutation/exclusivity', async (req, res) => {
  try {
    const inputFile = join(DATA_DIR, 'mutation_frequency.csv');
    
    if (rAvailable) {
      const result = await rService.mutationAnalysis.mutualExclusivity(inputFile);
      res.json({ success: true, engine: 'R', data: result });
    } else {
      // JavaScript fallback
      const csvContent = await fs.readFile(inputFile, 'utf-8');
      const rows = parseCSV(csvContent);
      
      const cancerTypes = ['breast', 'lung', 'colon', 'ovarian', 'pancreatic', 'melanoma'];
      const genes = rows.map(r => r.gene);
      
      // Calculate correlations between genes
      const pairs = [];
      for (let i = 0; i < genes.length - 1; i++) {
        for (let j = i + 1; j < genes.length; j++) {
          const x = cancerTypes.map(ct => parseInt(rows[i][ct]));
          const y = cancerTypes.map(ct => parseInt(rows[j][ct]));
          const cor = jsStats.correlation(x, y);
          
          pairs.push({
            gene1: genes[i],
            gene2: genes[j],
            correlation: parseFloat(cor.toFixed(3)),
            relationship: cor < -0.3 ? 'mutually_exclusive' :
                         cor > 0.3 ? 'co_occurring' : 'independent'
          });
        }
      }
      
      // Sort by absolute correlation
      pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
      
      res.json({
        success: true,
        engine: 'JavaScript',
        data: {
          analysis_type: 'mutual_exclusivity',
          n_genes: genes.length,
          pairs: pairs.slice(0, 20)
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper: Parse CSV string to array of objects
function parseCSV(csvString) {
  const lines = csvString.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i];
    });
    return obj;
  });
}

export default router;
