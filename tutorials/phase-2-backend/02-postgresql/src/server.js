/**
 * Tutorial 2.2: PostgreSQL Database for Genomic Data
 * 
 * Express server with PostgreSQL backend for:
 * - Genes with protein domains
 * - Variants/mutations
 * - Patient samples with variant associations
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import genesRouter from './routes/genes.js';
import variantsRouter from './routes/variants.js';
import samplesRouter from './routes/samples.js';

// Import middleware
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler.js';

// Import database
import { testConnection, query } from './db/connection.js';

const app = express();
const PORT = process.env.PORT || 3002;

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(express.json());
app.use(requestLogger);

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await query('SELECT NOW() as time, version() as version');
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        time: dbResult.rows[0].time,
        version: dbResult.rows[0].version.split(' ')[0] + ' ' + dbResult.rows[0].version.split(' ')[1]
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: { connected: false, error: error.message }
    });
  }
});

// API overview
app.get('/api', async (req, res) => {
  let dbStats = { genes: 0, variants: 0, samples: 0 };
  
  try {
    const geneCount = await query('SELECT COUNT(*) FROM genes');
    const variantCount = await query('SELECT COUNT(*) FROM variants');
    const sampleCount = await query('SELECT COUNT(*) FROM samples');
    
    dbStats = {
      genes: parseInt(geneCount.rows[0].count),
      variants: parseInt(variantCount.rows[0].count),
      samples: parseInt(sampleCount.rows[0].count)
    };
  } catch (error) {
    // Database might not be initialized
  }
  
  res.json({
    success: true,
    message: 'Genomic Visualization Platform API (PostgreSQL)',
    version: '2.0.0',
    endpoints: {
      genes: {
        list: 'GET /api/genes',
        get: 'GET /api/genes/:symbol',
        domains: 'GET /api/genes/:symbol/domains',
        variants: 'GET /api/genes/:symbol/variants',
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
    dataStats: dbStats
  });
});

// Mount routes
app.use('/api/genes', genesRouter);
app.use('/api/variants', variantsRouter);
app.use('/api/samples', samplesRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// START SERVER
// =============================================================================

async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  
  app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🧬 Genomic Visualization Platform - PostgreSQL API');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Server running at: http://localhost:${PORT}`);
    console.log(`  API Documentation: http://localhost:${PORT}/api`);
    console.log(`  Health Check:      http://localhost:${PORT}/api/health`);
    console.log('───────────────────────────────────────────────────────────');
    console.log(`  Database: ${dbConnected ? '✅ Connected' : '❌ Not connected'}`);
    if (!dbConnected) {
      console.log('');
      console.log('  ⚠️  Run these commands to set up the database:');
      console.log('      createdb genomic_viz');
      console.log('      npm run db:init');
      console.log('      npm run db:seed');
    }
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
  });
}

startServer();

export default app;
