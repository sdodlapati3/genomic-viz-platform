/**
 * Upload Service
 * 
 * Business logic for file upload processing
 */

import { v4 as uuidv4 } from 'uuid';
import { readFile } from 'fs/promises';
import { extname } from 'path';
import { logger } from '../utils/logger.js';

export class UploadService {
  constructor() {
    this.uploads = new Map();
  }

  /**
   * Process uploaded file
   */
  async processFile(file) {
    const uploadId = uuidv4();
    const ext = extname(file.originalname).toLowerCase();

    // Store upload status
    this.uploads.set(uploadId, {
      id: uploadId,
      status: 'processing',
      filename: file.originalname,
      startTime: Date.now()
    });

    try {
      let result;

      switch (ext) {
        case '.vcf':
          result = await this.processVCF(file);
          break;
        case '.maf':
          result = await this.processMAF(file);
          break;
        case '.csv':
        case '.tsv':
          result = await this.processTabular(file, ext);
          break;
        case '.json':
          result = await this.processJSON(file);
          break;
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }

      // Update status
      this.uploads.set(uploadId, {
        ...this.uploads.get(uploadId),
        status: 'completed',
        endTime: Date.now(),
        ...result
      });

      return {
        id: uploadId,
        ...result
      };

    } catch (error) {
      logger.error(`File processing error: ${error.message}`);
      
      this.uploads.set(uploadId, {
        ...this.uploads.get(uploadId),
        status: 'error',
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Process VCF file
   */
  async processVCF(file) {
    const content = await readFile(file.path, 'utf-8');
    const lines = content.split('\n').filter(l => !l.startsWith('#') && l.trim());
    
    const mutations = lines.map(line => {
      const [chrom, pos, id, ref, alt, qual, filter, info] = line.split('\t');
      return { chrom, pos: parseInt(pos), id, ref, alt, qual, filter };
    });

    return {
      type: 'vcf',
      recordCount: mutations.length,
      data: mutations.slice(0, 100) // Return first 100 as preview
    };
  }

  /**
   * Process MAF file
   */
  async processMAF(file) {
    const content = await readFile(file.path, 'utf-8');
    const lines = content.split('\n').filter(l => !l.startsWith('#') && l.trim());
    
    const headers = lines[0].split('\t');
    const mutations = lines.slice(1).map(line => {
      const values = line.split('\t');
      const record = {};
      headers.forEach((h, i) => {
        record[h] = values[i];
      });
      return record;
    });

    return {
      type: 'maf',
      recordCount: mutations.length,
      columns: headers,
      data: mutations.slice(0, 100)
    };
  }

  /**
   * Process tabular file (CSV/TSV)
   */
  async processTabular(file, ext) {
    const content = await readFile(file.path, 'utf-8');
    const separator = ext === '.csv' ? ',' : '\t';
    const lines = content.split('\n').filter(l => l.trim());
    
    const headers = lines[0].split(separator);
    const records = lines.slice(1).map(line => {
      const values = line.split(separator);
      const record = {};
      headers.forEach((h, i) => {
        record[h.trim()] = values[i]?.trim();
      });
      return record;
    });

    return {
      type: ext.slice(1),
      recordCount: records.length,
      columns: headers,
      data: records.slice(0, 100)
    };
  }

  /**
   * Process JSON file
   */
  async processJSON(file) {
    const content = await readFile(file.path, 'utf-8');
    const data = JSON.parse(content);
    
    const isArray = Array.isArray(data);
    const recordCount = isArray ? data.length : 1;

    return {
      type: 'json',
      recordCount,
      data: isArray ? data.slice(0, 100) : data
    };
  }

  /**
   * Get upload processing status
   */
  async getProcessingStatus(id) {
    return this.uploads.get(id);
  }
}
