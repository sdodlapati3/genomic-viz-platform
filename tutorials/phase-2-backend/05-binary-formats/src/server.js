/**
 * Binary Formats Tutorial Server
 *
 * Tutorial 2.5: Binary Genomic File Formats
 *
 * This server provides API endpoints for:
 * - BAM file parsing (reads, coverage)
 * - BigWig file parsing (signal data)
 * - Indexed file access
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import bamRoutes from './routes/bam.js';
import bigwigRoutes from './routes/bigwig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from data directory
app.use('/data', express.static(path.join(__dirname, '../data')));

// API Routes
app.use('/api/bam', bamRoutes);
app.use('/api/bigwig', bigwigRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Binary Formats Tutorial Server',
    version: '1.0.0',
    tutorial: '2.5 - Binary Genomic File Formats',
    endpoints: {
      bam: {
        '/api/bam/header': 'GET - BAM file header',
        '/api/bam/references': 'GET - Reference sequences',
        '/api/bam/reads/:chr/:start/:end': 'GET - Reads in region',
        '/api/bam/coverage/:chr/:start/:end': 'GET - Coverage data',
        '/api/bam/stats/:chr/:start/:end': 'GET - Region statistics',
      },
      bigwig: {
        '/api/bigwig/header': 'GET - BigWig file header',
        '/api/bigwig/chromosomes': 'GET - Chromosome list',
        '/api/bigwig/signal/:chr/:start/:end': 'GET - Signal data',
        '/api/bigwig/binned/:chr/:start/:end': 'GET - Binned data',
        '/api/bigwig/stats/:chr/:start/:end': 'GET - Region statistics',
        '/api/bigwig/zoom-levels': 'GET - Available zoom levels',
      },
    },
    examples: {
      'BAM reads': 'GET /api/bam/reads/chr17/7668402/7687550',
      'BAM coverage': 'GET /api/bam/coverage/chr17/7668402/7687550?binSize=100',
      'BigWig signal': 'GET /api/bigwig/signal/chr17/7668402/7687550',
      'BigWig binned': 'GET /api/bigwig/binned/chr17/7668402/7687550?numBins=200',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.url}`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  🧬 Binary Formats Tutorial Server                       ║
║  Tutorial 2.5: Binary Genomic File Formats               ║
╠══════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                ║
║                                                          ║
║  BAM Endpoints:                                          ║
║    GET /api/bam/header          - File header            ║
║    GET /api/bam/reads/:chr/:s/:e - Reads in region       ║
║    GET /api/bam/coverage/:chr/:s/:e - Coverage data      ║
║                                                          ║
║  BigWig Endpoints:                                       ║
║    GET /api/bigwig/chromosomes  - Chromosome list        ║
║    GET /api/bigwig/signal/:chr/:s/:e - Signal data       ║
║    GET /api/bigwig/binned/:chr/:s/:e - Binned data       ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
