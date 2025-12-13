/**
 * File Upload API Router
 */

import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { UploadService } from '../services/UploadService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const uploadRouter = express.Router();
const uploadService = new UploadService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.vcf', '.maf', '.csv', '.tsv', '.json'];
  const ext = extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not supported. Allowed: ${allowedTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

/**
 * POST /api/upload
 * Upload a single file
 */
uploadRouter.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await uploadService.processFile(req.file);
    
    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: result.id,
        originalName: req.file.originalname,
        size: req.file.size,
        type: result.type,
        recordCount: result.recordCount
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/upload/batch
 * Upload multiple files
 */
uploadRouter.post('/batch', upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = await Promise.all(
      req.files.map(file => uploadService.processFile(file))
    );

    res.status(201).json({
      message: `${results.length} files uploaded successfully`,
      files: results.map((result, i) => ({
        id: result.id,
        originalName: req.files[i].originalname,
        size: req.files[i].size,
        type: result.type,
        recordCount: result.recordCount
      }))
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/upload/status/:id
 * Get upload processing status
 */
uploadRouter.get('/status/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = await uploadService.getProcessingStatus(id);
    
    if (!status) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    
    res.json(status);
  } catch (error) {
    next(error);
  }
});
