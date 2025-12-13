/**
 * BED (Browser Extensible Data) Parser
 * 
 * Parses BED files (BED3, BED6, BED12) commonly used for genomic intervals.
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';

/**
 * Detect BED format type based on column count
 */
function detectBedFormat(columnCount) {
  if (columnCount >= 12) return 'BED12';
  if (columnCount >= 6) return 'BED6';
  if (columnCount >= 4) return 'BED4';
  if (columnCount >= 3) return 'BED3';
  return 'unknown';
}

/**
 * Parse a single BED line
 */
function parseBedLine(line, lineNumber) {
  const fields = line.split('\t');
  
  if (fields.length < 3) {
    throw new Error(`Line ${lineNumber}: BED requires at least 3 columns`);
  }
  
  const [chrom, chromStart, chromEnd, name, score, strand, 
         thickStart, thickEnd, itemRgb, blockCount, blockSizes, blockStarts] = fields;
  
  const region = {
    chromosome: chrom,
    start: parseInt(chromStart),  // 0-based
    end: parseInt(chromEnd),      // exclusive
    // Computed fields
    length: parseInt(chromEnd) - parseInt(chromStart)
  };
  
  // BED4+
  if (fields.length >= 4 && name !== undefined) {
    region.name = name === '.' ? null : name;
  }
  
  // BED5+
  if (fields.length >= 5 && score !== undefined) {
    region.score = score === '.' ? null : parseInt(score);
  }
  
  // BED6+
  if (fields.length >= 6 && strand !== undefined) {
    region.strand = strand === '.' ? null : strand;
  }
  
  // BED9+ (thick regions, typically for CDS)
  if (fields.length >= 8) {
    region.thickStart = thickStart === '.' ? null : parseInt(thickStart);
    region.thickEnd = thickEnd === '.' ? null : parseInt(thickEnd);
  }
  
  // BED9+ RGB color
  if (fields.length >= 9 && itemRgb !== undefined) {
    region.color = itemRgb === '.' || itemRgb === '0' ? null : itemRgb;
  }
  
  // BED12 (block structure for exons)
  if (fields.length >= 12) {
    const count = parseInt(blockCount);
    const sizes = blockSizes.split(',').filter(s => s).map(Number);
    const starts = blockStarts.split(',').filter(s => s).map(Number);
    
    region.blocks = [];
    for (let i = 0; i < count; i++) {
      region.blocks.push({
        start: region.start + starts[i],
        end: region.start + starts[i] + sizes[i],
        size: sizes[i]
      });
    }
  }
  
  return region;
}

/**
 * Parse BED file and return structured data
 * @param {string} filePath - Path to BED file
 * @param {Object} options - Parser options
 * @returns {Promise<Object>} Parsed BED data
 */
export async function parseBed(filePath, options = {}) {
  const {
    region = null,     // Filter by region {chromosome, start, end}
    names = null,      // Filter by names (array)
    minScore = null,   // Filter by minimum score
    onRegion = null    // Streaming callback
  } = options;
  
  return new Promise((resolve, reject) => {
    const result = {
      format: null,
      trackLine: null,
      browserLines: [],
      regions: [],
      byChromosome: {}
    };
    
    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity
    });
    
    let lineNumber = 0;
    
    rl.on('line', (line) => {
      lineNumber++;
      
      // Skip empty lines
      if (!line.trim()) return;
      
      // Comment lines
      if (line.startsWith('#')) return;
      
      // Browser lines
      if (line.startsWith('browser')) {
        result.browserLines.push(line);
        return;
      }
      
      // Track line
      if (line.startsWith('track')) {
        result.trackLine = parseTrackLine(line);
        return;
      }
      
      // Data line
      try {
        const bedRegion = parseBedLine(line, lineNumber);
        
        // Detect format from first data line
        if (!result.format) {
          result.format = detectBedFormat(line.split('\t').length);
        }
        
        // Apply region filter
        if (region) {
          if (bedRegion.chromosome !== region.chromosome) return;
          if (bedRegion.end <= region.start || bedRegion.start >= region.end) return;
        }
        
        // Apply name filter
        if (names && bedRegion.name && !names.includes(bedRegion.name)) return;
        
        // Apply score filter
        if (minScore !== null && (bedRegion.score === null || bedRegion.score < minScore)) return;
        
        // Streaming callback
        if (onRegion) {
          onRegion(bedRegion);
        }
        
        result.regions.push(bedRegion);
        
        // Index by chromosome
        if (!result.byChromosome[bedRegion.chromosome]) {
          result.byChromosome[bedRegion.chromosome] = [];
        }
        result.byChromosome[bedRegion.chromosome].push(bedRegion);
        
      } catch (error) {
        console.warn(`Line ${lineNumber}:`, error.message);
      }
    });
    
    rl.on('close', () => {
      // Sort regions by position within each chromosome
      for (const chrom of Object.keys(result.byChromosome)) {
        result.byChromosome[chrom].sort((a, b) => a.start - b.start);
      }
      
      resolve(result);
    });
    
    rl.on('error', reject);
  });
}

/**
 * Parse track line attributes
 */
function parseTrackLine(line) {
  const attrs = {};
  const regex = /(\w+)=(?:"([^"]*)"|(\S+))/g;
  let match;
  
  while ((match = regex.exec(line)) !== null) {
    attrs[match[1]] = match[2] || match[3];
  }
  
  return attrs;
}

/**
 * Find overlapping regions
 */
export function findOverlaps(bedData, query) {
  const { chromosome, start, end } = query;
  const chromRegions = bedData.byChromosome[chromosome] || [];
  
  return chromRegions.filter(region => 
    region.end > start && region.start < end
  );
}

/**
 * Merge overlapping regions
 */
export function mergeRegions(regions) {
  if (regions.length === 0) return [];
  
  // Sort by start position
  const sorted = [...regions].sort((a, b) => a.start - b.start);
  const merged = [{ ...sorted[0] }];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    
    if (current.chromosome === last.chromosome && current.start <= last.end) {
      // Overlapping - merge
      last.end = Math.max(last.end, current.end);
      last.length = last.end - last.start;
    } else {
      // Non-overlapping - add new region
      merged.push({ ...current });
    }
  }
  
  return merged;
}

/**
 * Convert BED region to 1-based coordinates (common for display)
 */
export function toOneBased(region) {
  return {
    ...region,
    start: region.start + 1,  // Convert to 1-based
    // end stays the same (becomes inclusive)
  };
}

/**
 * Convert to visualization track format
 */
export function regionToTrack(region) {
  return {
    id: region.name || `${region.chromosome}:${region.start}-${region.end}`,
    chromosome: region.chromosome,
    start: region.start + 1,  // 1-based for display
    end: region.end,
    name: region.name,
    strand: region.strand,
    score: region.score,
    color: region.color
  };
}

export default { parseBed, findOverlaps, mergeRegions, toOneBased, regionToTrack };
