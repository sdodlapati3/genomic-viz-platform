/**
 * Tutorial 2.4: R Integration for Statistical Analysis
 * Express server providing genomic statistical analysis APIs
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import analysisRoutes from './routes/analysis.js';
import { checkRAvailability } from './services/rService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/analysis', analysisRoutes);

// API documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'Genomic Statistical Analysis API',
    version: '1.0.0',
    description: 'R-integrated statistical analysis for genomic data',
    endpoints: {
      status: {
        method: 'GET',
        path: '/api/analysis/status',
        description: 'Check R availability and list analyses'
      },
      survival: {
        kaplanMeier: {
          method: 'GET',
          path: '/api/analysis/survival/kaplan-meier',
          query: { gene: 'Filter by gene (optional)' },
          description: 'Kaplan-Meier survival analysis'
        },
        cox: {
          method: 'GET',
          path: '/api/analysis/survival/cox',
          description: 'Cox proportional hazards regression'
        }
      },
      expression: {
        differential: {
          method: 'GET',
          path: '/api/analysis/expression/differential',
          description: 'Differential expression analysis'
        },
        volcano: {
          method: 'GET',
          path: '/api/analysis/expression/volcano',
          description: 'Volcano plot data'
        },
        correlation: {
          method: 'GET',
          path: '/api/analysis/expression/correlation',
          description: 'Gene correlation analysis'
        }
      },
      mutation: {
        enrichment: {
          method: 'GET',
          path: '/api/analysis/mutation/enrichment',
          description: 'Mutation enrichment by cancer type'
        },
        exclusivity: {
          method: 'GET',
          path: '/api/analysis/mutation/exclusivity',
          description: 'Mutual exclusivity analysis'
        }
      }
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.redirect('/api');
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
async function startServer() {
  // Check R availability
  const rStatus = await checkRAvailability();
  
  app.listen(PORT, () => {
    console.log(`
═══════════════════════════════════════════════════════════
  🧬 Genomic Statistical Analysis API
═══════════════════════════════════════════════════════════
  Server running at: http://localhost:${PORT}
  API Documentation: http://localhost:${PORT}/api
───────────────────────────────────────────────────────────
  R Status: ${rStatus.available ? `✓ Available (v${rStatus.version})` : '✗ Not available (using JS fallback)'}
───────────────────────────────────────────────────────────
  Survival Analysis:
    • GET http://localhost:${PORT}/api/analysis/survival/kaplan-meier
    • GET http://localhost:${PORT}/api/analysis/survival/cox
  
  Expression Analysis:
    • GET http://localhost:${PORT}/api/analysis/expression/differential
    • GET http://localhost:${PORT}/api/analysis/expression/volcano
    • GET http://localhost:${PORT}/api/analysis/expression/correlation
  
  Mutation Analysis:
    • GET http://localhost:${PORT}/api/analysis/mutation/enrichment
    • GET http://localhost:${PORT}/api/analysis/mutation/exclusivity
═══════════════════════════════════════════════════════════
`);
  });
}

startServer();
