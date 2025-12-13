/**
 * Tutorial 2.3: Parsing Genomic File Formats
 * 
 * Express server with file parsing endpoints for:
 * - VCF (Variant Call Format)
 * - GFF3 (General Feature Format)
 * - BED (Browser Extensible Data)
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import parseRouter from './routes/parse.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3003;

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(compression());
app.use(express.json());

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    supportedFormats: ['VCF', 'GFF3', 'BED']
  });
});

// API overview
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Genomic File Parsing API',
    version: '1.0.0',
    endpoints: {
      parse: {
        vcf: 'POST /api/parse/vcf (upload file)',
        gff: 'POST /api/parse/gff (upload file)',
        bed: 'POST /api/parse/bed (upload file)',
        sampleVcf: 'GET /api/parse/sample/vcf',
        sampleGff: 'GET /api/parse/sample/gff',
        sampleBed: 'GET /api/parse/sample/bed'
      }
    },
    supportedFormats: {
      VCF: 'Variant Call Format (v4.x) - genomic variants',
      GFF3: 'General Feature Format v3 - gene annotations',
      BED: 'Browser Extensible Data (BED3-BED12) - genomic intervals'
    }
  });
});

// Mount parser routes
app.use('/api/parse', parseRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({
    success: false,
    error: err.name || 'Error',
    message: err.message
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🧬 Genomic File Parsing API');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Server running at: http://localhost:${PORT}`);
  console.log(`  API Documentation: http://localhost:${PORT}/api`);
  console.log('───────────────────────────────────────────────────────────');
  console.log('  Supported Formats:');
  console.log('    • VCF - Variant Call Format');
  console.log('    • GFF3 - Gene Annotations');
  console.log('    • BED - Genomic Intervals');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  Sample Data Endpoints:');
  console.log(`    • GET http://localhost:${PORT}/api/parse/sample/vcf`);
  console.log(`    • GET http://localhost:${PORT}/api/parse/sample/gff`);
  console.log(`    • GET http://localhost:${PORT}/api/parse/sample/bed`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
});

export default app;
