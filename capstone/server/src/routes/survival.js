/**
 * Survival API Router
 */

import express from 'express';
import { SurvivalService } from '../services/SurvivalService.js';

export const survivalRouter = express.Router();
const survivalService = new SurvivalService();

/**
 * GET /api/survival
 * Get survival data
 */
survivalRouter.get('/', async (req, res, next) => {
  try {
    const { cancerType, mutation } = req.query;
    
    const filters = {
      ...(cancerType && { cancerType }),
      ...(mutation && { mutation })
    };

    const result = await survivalService.getSurvivalData(filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/survival/kaplan-meier
 * Get Kaplan-Meier curve data
 */
survivalRouter.get('/kaplan-meier', async (req, res, next) => {
  try {
    const { groupBy } = req.query;
    const curves = await survivalService.getKaplanMeierCurves(groupBy);
    res.json(curves);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/survival/summary
 * Get survival summary statistics
 */
survivalRouter.get('/summary', async (req, res, next) => {
  try {
    const summary = await survivalService.getSummaryStatistics();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/survival/hazard-ratios
 * Get hazard ratio forest plot data
 */
survivalRouter.get('/hazard-ratios', async (req, res, next) => {
  try {
    const hazardRatios = await survivalService.getHazardRatios();
    res.json(hazardRatios);
  } catch (error) {
    next(error);
  }
});
