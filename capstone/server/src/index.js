/**
 * Mini-ProteinPaint API Server
 * 
 * Express.js backend for genomic data API
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { mutationsRouter } from './routes/mutations.js';
import { expressionRouter } from './routes/expression.js';
import { survivalRouter } from './routes/survival.js';
import { samplesRouter } from './routes/samples.js';
import { uploadRouter } from './routes/upload.js';
import { chatRouter } from './routes/chat.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/mutations', mutationsRouter);
app.use('/api/expression', expressionRouter);
app.use('/api/survival', survivalRouter);
app.use('/api/samples', samplesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/chat', chatRouter);

// Static files for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../../client/dist/index.html'));
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Mini-ProteinPaint API server running on port ${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`   API docs: http://localhost:${PORT}/api/health`);
});

export { app };
