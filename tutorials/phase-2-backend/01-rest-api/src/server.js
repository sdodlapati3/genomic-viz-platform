/**
 * Tutorial 2.1: Node.js REST API for Genomics
 * 
 * This Express server provides REST API endpoints for:
 * - Genes: Query gene information
 * - Variants: Query genomic variants/mutations
 * - Samples: Query patient/sample data
 * 
 * Learning objectives:
 * - Express.js server setup
 * - RESTful API design patterns
 * - Route organization and modularization
 * - Error handling middleware
 * - CORS configuration for frontend integration
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';

// Import routes
import genesRouter from './routes/genes.js';
import variantsRouter from './routes/variants.js';
import samplesRouter from './routes/samples.js';

// Import middleware
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler.js';

// Import data for stats
import { genes, variants, samples } from './data/genomicData.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Enable CORS for frontend access
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compress responses
app.use(compression());

// Parse JSON request bodies
app.use(express.json());

// Request logging
app.use(requestLogger);

// =============================================================================
// API ROUTES
// =============================================================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// API overview endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Genomic Visualization Platform API',
    version: '1.0.0',
    endpoints: {
      genes: {
        list: 'GET /api/genes',
        get: 'GET /api/genes/:symbol',
        domains: 'GET /api/genes/:symbol/domains',
        region: 'GET /api/genes/region/:chromosome/:start-:end'
      },
      variants: {
        list: 'GET /api/variants',
        stats: 'GET /api/variants/stats',
        get: 'GET /api/variants/:id',
        region: 'GET /api/variants/region/:chromosome/:start-:end'
      },
      samples: {
        list: 'GET /api/samples',
        stats: 'GET /api/samples/stats',
        get: 'GET /api/samples/:id',
        variants: 'GET /api/samples/:id/variants'
      }
    },
    dataStats: {
      genes: genes.length,
      variants: variants.length,
      samples: samples.length
    }
  });
});

// Mount route handlers
app.use('/api/genes', genesRouter);
app.use('/api/variants', variantsRouter);
app.use('/api/samples', samplesRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🧬 Genomic Visualization Platform - REST API');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Server running at: http://localhost:${PORT}`);
  console.log(`  API Documentation: http://localhost:${PORT}/api`);
  console.log(`  Health Check:      http://localhost:${PORT}/api/health`);
  console.log('───────────────────────────────────────────────────────────');
  console.log('  Available Endpoints:');
  console.log('    • GET /api/genes          - List all genes');
  console.log('    • GET /api/genes/:symbol  - Get gene by symbol');
  console.log('    • GET /api/variants       - List all variants');
  console.log('    • GET /api/variants/stats - Variant statistics');
  console.log('    • GET /api/samples        - List all samples');
  console.log('    • GET /api/samples/stats  - Sample statistics');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Data loaded: ${genes.length} genes, ${variants.length} variants, ${samples.length} samples`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

export default app;
