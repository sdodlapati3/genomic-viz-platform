/**
 * VCF (Variant Call Format) Parser
 * 
 * Parses VCF files commonly used for storing genomic variants.
 * Supports VCF 4.x format with INFO, FORMAT, and sample columns.
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';

/**
 * Parse VCF metadata line (##key=value or ##key=<...>)
 */
function parseMetaLine(line) {
  const match = line.match(/^##(\w+)=<?(.+?)>?$/);
  if (!match) return null;
  
  const [, key, value] = match;
  
  // Parse structured metadata (INFO, FORMAT, FILTER, etc.)
  if (value.startsWith('ID=')) {
    const fields = {};
    const regex = /(\w+)=([^,>]+|"[^"]*")/g;
    let fieldMatch;
    while ((fieldMatch = regex.exec(value)) !== null) {
      let fieldValue = fieldMatch[2];
      // Remove quotes
      if (fieldValue.startsWith('"') && fieldValue.endsWith('"')) {
        fieldValue = fieldValue.slice(1, -1);
      }
      fields[fieldMatch[1]] = fieldValue;
    }
    return { type: key, ...fields };
  }
  
  return { type: key, value };
}

/**
 * Parse INFO field (key=value pairs separated by ;)
 */
function parseInfoField(infoStr, infoMeta = {}) {
  if (infoStr === '.') return {};
  
  const info = {};
  const pairs = infoStr.split(';');
  
  for (const pair of pairs) {
    if (pair.includes('=')) {
      const [key, value] = pair.split('=');
      // Try to convert numeric values
      const meta = infoMeta[key];
      if (meta?.Type === 'Integer') {
        info[key] = parseInt(value);
      } else if (meta?.Type === 'Float') {
        info[key] = parseFloat(value);
      } else {
        info[key] = value;
      }
    } else {
      // Flag type (no value)
      info[pair] = true;
    }
  }
  
  return info;
}

/**
 * Parse FORMAT and sample fields
 */
function parseSamples(formatStr, sampleStrs, sampleNames) {
  const formats = formatStr.split(':');
  const samples = {};
  
  sampleStrs.forEach((sampleStr, i) => {
    const values = sampleStr.split(':');
    const sampleData = {};
    
    formats.forEach((format, j) => {
      let value = values[j] || '.';
      
      // Parse specific format fields
      if (format === 'GT') {
        sampleData.genotype = value;
        sampleData.isHeterozygous = value.includes('/') ? 
          value.split('/')[0] !== value.split('/')[1] : false;
        sampleData.isHomozygousAlt = value === '1/1' || value === '1|1';
      } else if (format === 'DP') {
        sampleData.depth = value === '.' ? null : parseInt(value);
      } else if (format === 'AD') {
        sampleData.allelicDepth = value === '.' ? null : value.split(',').map(Number);
      } else if (format === 'GQ') {
        sampleData.genotypeQuality = value === '.' ? null : parseInt(value);
      } else {
        sampleData[format] = value;
      }
    });
    
    samples[sampleNames[i]] = sampleData;
  });
  
  return samples;
}

/**
 * Parse a single VCF variant line
 */
function parseVariantLine(line, header, infoMeta) {
  const fields = line.split('\t');
  
  if (fields.length < 8) {
    throw new Error('Invalid VCF line: insufficient fields');
  }
  
  const [chrom, pos, id, ref, alt, qual, filter, info, format, ...sampleData] = fields;
  
  const variant = {
    chromosome: chrom,
    position: parseInt(pos),
    id: id === '.' ? null : id,
    ref,
    alt: alt.split(','),
    quality: qual === '.' ? null : parseFloat(qual),
    filter: filter === '.' ? null : filter === 'PASS' ? 'PASS' : filter.split(';'),
    info: parseInfoField(info, infoMeta)
  };
  
  // Parse samples if present
  if (format && sampleData.length > 0) {
    variant.samples = parseSamples(format, sampleData, header.samples);
  }
  
  // Add computed fields for convenience
  variant.isSnp = ref.length === 1 && variant.alt.every(a => a.length === 1);
  variant.isIndel = !variant.isSnp;
  variant.isDeletion = variant.alt.some(a => a.length < ref.length);
  variant.isInsertion = variant.alt.some(a => a.length > ref.length);
  
  return variant;
}

/**
 * Parse VCF file and return structured data
 * @param {string} filePath - Path to VCF file
 * @param {Object} options - Parser options
 * @returns {Promise<Object>} Parsed VCF data
 */
export async function parseVcf(filePath, options = {}) {
  const {
    onVariant = null,  // Callback for streaming processing
    filter = null,     // Filter function for variants
    limit = Infinity   // Max variants to return
  } = options;
  
  return new Promise((resolve, reject) => {
    const result = {
      header: {
        fileformat: null,
        metadata: [],
        info: {},
        format: {},
        filter: {},
        contig: {},
        samples: []
      },
      variants: []
    };
    
    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity
    });
    
    let variantCount = 0;
    
    rl.on('line', (line) => {
      // Skip empty lines
      if (!line.trim()) return;
      
      // Metadata lines
      if (line.startsWith('##')) {
        const meta = parseMetaLine(line);
        if (meta) {
          if (meta.type === 'fileformat') {
            result.header.fileformat = meta.value;
          } else if (meta.type === 'INFO' && meta.ID) {
            result.header.info[meta.ID] = meta;
          } else if (meta.type === 'FORMAT' && meta.ID) {
            result.header.format[meta.ID] = meta;
          } else if (meta.type === 'FILTER' && meta.ID) {
            result.header.filter[meta.ID] = meta;
          } else if (meta.type === 'contig' && meta.ID) {
            result.header.contig[meta.ID] = meta;
          } else {
            result.header.metadata.push(meta);
          }
        }
        return;
      }
      
      // Header line with column names
      if (line.startsWith('#CHROM')) {
        const columns = line.substring(1).split('\t');
        result.header.samples = columns.slice(9);
        return;
      }
      
      // Variant line
      if (variantCount >= limit) return;
      
      try {
        const variant = parseVariantLine(line, result.header, result.header.info);
        
        // Apply filter if provided
        if (filter && !filter(variant)) return;
        
        variantCount++;
        
        // Streaming callback
        if (onVariant) {
          onVariant(variant);
        }
        
        result.variants.push(variant);
      } catch (error) {
        console.warn('Failed to parse line:', error.message);
      }
    });
    
    rl.on('close', () => resolve(result));
    rl.on('error', reject);
  });
}

/**
 * Stream VCF file for memory-efficient processing
 * @param {string} filePath - Path to VCF file
 * @param {Function} callback - Called for each variant
 */
export async function streamVcf(filePath, callback) {
  return parseVcf(filePath, { onVariant: callback });
}

/**
 * Convert variant to a simplified format for visualization
 */
export function variantToVisualization(variant) {
  return {
    chromosome: variant.chromosome,
    position: variant.position,
    id: variant.id,
    ref: variant.ref,
    alt: variant.alt[0],
    type: variant.isSnp ? 'SNV' : variant.isDeletion ? 'deletion' : 'insertion',
    gene: variant.info.GENE || null,
    aaChange: variant.info.AA || null,
    impact: variant.info.IMPACT || null,
    consequence: variant.info.CONSEQUENCE || null,
    quality: variant.quality,
    filter: variant.filter,
    alleleFrequency: variant.info.AF || null
  };
}

export default { parseVcf, streamVcf, variantToVisualization };
