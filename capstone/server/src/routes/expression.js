/**
 * Expression API Router
 */

import express from 'express';
import { ExpressionService } from '../services/ExpressionService.js';

export const expressionRouter = express.Router();
const expressionService = new ExpressionService();

/**
 * GET /api/expression
 * Get expression matrix
 */
expressionRouter.get('/', async (req, res, next) => {
  try {
    const { genes, samples } = req.query;
    
    const filters = {
      genes: genes ? genes.split(',') : null,
      samples: samples ? samples.split(',') : null
    };

    const result = await expressionService.getExpressionMatrix(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expression/genes
 * Get list of available genes
 */
expressionRouter.get('/genes', async (req, res, next) => {
  try {
    const genes = await expressionService.getGeneList();
    res.json(genes);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expression/gene/:gene
 * Get expression for specific gene across samples
 */
expressionRouter.get('/gene/:gene', async (req, res, next) => {
  try {
    const { gene } = req.params;
    const expression = await expressionService.getGeneExpression(gene);
    res.json(expression);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expression/differential
 * Get differential expression results
 */
expressionRouter.get('/differential', async (req, res, next) => {
  try {
    const { group1, group2, threshold = 0.05 } = req.query;
    
    const results = await expressionService.getDifferentialExpression(
      group1, 
      group2, 
      parseFloat(threshold)
    );
    
    res.json(results);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/expression/umap
 * Get UMAP coordinates for samples
 */
expressionRouter.get('/umap', async (req, res, next) => {
  try {
    const coordinates = await expressionService.getUMAPCoordinates();
    res.json(coordinates);
  } catch (error) {
    next(error);
  }
});
