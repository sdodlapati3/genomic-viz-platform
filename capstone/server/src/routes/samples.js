/**
 * Samples API Router
 */

import express from 'express';
import { SampleService } from '../services/SampleService.js';

export const samplesRouter = express.Router();
const sampleService = new SampleService();

/**
 * GET /api/samples
 * Get all samples with optional filtering
 */
samplesRouter.get('/', async (req, res, next) => {
  try {
    const { cancerType, page = 1, limit = 100 } = req.query;
    
    const filters = {
      ...(cancerType && { cancerType })
    };

    const result = await sampleService.getSamples(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/samples/stats
 * Get sample statistics
 */
samplesRouter.get('/stats', async (req, res, next) => {
  try {
    const stats = await sampleService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/samples/:id
 * Get specific sample details
 */
samplesRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const sample = await sampleService.getSampleById(id);
    
    if (!sample) {
      return res.status(404).json({ error: 'Sample not found' });
    }
    
    res.json(sample);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/samples/cancer-types
 * Get cancer type distribution
 */
samplesRouter.get('/stats/cancer-types', async (req, res, next) => {
  try {
    const distribution = await sampleService.getCancerTypeDistribution();
    res.json(distribution);
  } catch (error) {
    next(error);
  }
});
