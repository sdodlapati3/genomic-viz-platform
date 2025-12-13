/**
 * Mutations API Router
 */

import express from 'express';
import { MutationService } from '../services/MutationService.js';

export const mutationsRouter = express.Router();
const mutationService = new MutationService();

/**
 * GET /api/mutations
 * Get all mutations with optional filtering
 */
mutationsRouter.get('/', async (req, res, next) => {
  try {
    const { 
      gene, 
      type, 
      sample, 
      cancerType,
      page = 1, 
      limit = 100 
    } = req.query;

    const filters = {
      ...(gene && { gene }),
      ...(type && { type }),
      ...(sample && { sample }),
      ...(cancerType && { cancerType })
    };

    const result = await mutationService.getMutations(filters, { 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mutations/stats
 * Get mutation statistics
 */
mutationsRouter.get('/stats', async (req, res, next) => {
  try {
    const stats = await mutationService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mutations/gene/:gene
 * Get mutations for a specific gene
 */
mutationsRouter.get('/gene/:gene', async (req, res, next) => {
  try {
    const { gene } = req.params;
    const mutations = await mutationService.getMutationsByGene(gene);
    res.json(mutations);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mutations/types
 * Get mutation type distribution
 */
mutationsRouter.get('/types', async (req, res, next) => {
  try {
    const distribution = await mutationService.getMutationTypeDistribution();
    res.json(distribution);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mutations/top-genes
 * Get top mutated genes
 */
mutationsRouter.get('/top-genes', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const topGenes = await mutationService.getTopMutatedGenes(parseInt(limit));
    res.json(topGenes);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mutations
 * Add new mutations (batch)
 */
mutationsRouter.post('/', async (req, res, next) => {
  try {
    const { mutations } = req.body;
    
    if (!Array.isArray(mutations)) {
      return res.status(400).json({ error: 'mutations must be an array' });
    }

    const result = await mutationService.addMutations(mutations);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
