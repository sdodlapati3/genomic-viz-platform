import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import { parseVcf, variantToVisualization } from '../parsers/vcfParser.js';
import { parseGff, extractGenes } from '../parsers/gffParser.js';
import { parseBed, findOverlaps } from '../parsers/bedParser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: join(__dirname, '../../uploads/'),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * @route   POST /api/parse/vcf
 * @desc    Parse uploaded VCF file
 */
router.post('/vcf', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const options = {
      limit: parseInt(req.query.limit) || 1000
    };
    
    const vcfData = await parseVcf(req.file.path, options);
    
    res.json({
      success: true,
      data: {
        header: {
          fileformat: vcfData.header.fileformat,
          samples: vcfData.header.samples,
          infoFields: Object.keys(vcfData.header.info),
          formatFields: Object.keys(vcfData.header.format)
        },
        variants: vcfData.variants.map(variantToVisualization),
        count: vcfData.variants.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/parse/gff
 * @desc    Parse uploaded GFF3 file
 */
router.post('/gff', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const options = {
      types: req.query.types ? req.query.types.split(',') : null
    };
    
    const gffData = await parseGff(req.file.path, options);
    const genes = extractGenes(gffData);
    
    res.json({
      success: true,
      data: {
        version: gffData.version,
        featureCount: gffData.features.length,
        featureTypes: Object.keys(gffData.byType),
        genes: genes,
        geneCount: genes.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/parse/bed
 * @desc    Parse uploaded BED file
 */
router.post('/bed', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const bedData = await parseBed(req.file.path);
    
    res.json({
      success: true,
      data: {
        format: bedData.format,
        regionCount: bedData.regions.length,
        chromosomes: Object.keys(bedData.byChromosome),
        regions: bedData.regions.map(r => ({
          chromosome: r.chromosome,
          start: r.start + 1, // Convert to 1-based
          end: r.end,
          name: r.name,
          score: r.score,
          strand: r.strand
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/parse/sample/vcf
 * @desc    Parse sample VCF file
 */
router.get('/sample/vcf', async (req, res, next) => {
  try {
    const samplePath = join(__dirname, '../../data/sample.vcf');
    const vcfData = await parseVcf(samplePath);
    
    res.json({
      success: true,
      data: {
        header: {
          fileformat: vcfData.header.fileformat,
          samples: vcfData.header.samples
        },
        variants: vcfData.variants.map(variantToVisualization),
        count: vcfData.variants.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/parse/sample/gff
 * @desc    Parse sample GFF3 file
 */
router.get('/sample/gff', async (req, res, next) => {
  try {
    const samplePath = join(__dirname, '../../data/sample.gff3');
    const gffData = await parseGff(samplePath);
    const genes = extractGenes(gffData);
    
    res.json({
      success: true,
      data: {
        featureTypes: Object.fromEntries(
          Object.entries(gffData.byType).map(([k, v]) => [k, v.length])
        ),
        genes: genes,
        geneCount: genes.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/parse/sample/bed
 * @desc    Parse sample BED file
 */
router.get('/sample/bed', async (req, res, next) => {
  try {
    const samplePath = join(__dirname, '../../data/sample.bed');
    const bedData = await parseBed(samplePath);
    
    res.json({
      success: true,
      data: {
        format: bedData.format,
        regionCount: bedData.regions.length,
        byChromosome: Object.fromEntries(
          Object.entries(bedData.byChromosome).map(([k, v]) => [k, v.length])
        ),
        regions: bedData.regions.map(r => ({
          chromosome: r.chromosome,
          start: r.start + 1,
          end: r.end,
          name: r.name,
          score: r.score
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
