/**
 * GFF/GFF3 (General Feature Format) Parser
 * 
 * Parses GFF3 files commonly used for gene annotations.
 * Supports hierarchical feature structures (gene → mRNA → exon/CDS).
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';

/**
 * Parse GFF3 attributes field (tag=value pairs separated by ;)
 */
function parseAttributes(attrStr) {
  if (attrStr === '.') return {};
  
  const attrs = {};
  const pairs = attrStr.split(';');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      // URL decode and handle multiple values
      const decodedValue = decodeURIComponent(value);
      attrs[key] = decodedValue.includes(',') 
        ? decodedValue.split(',') 
        : decodedValue;
    }
  }
  
  return attrs;
}

/**
 * Parse a single GFF3 feature line
 */
function parseFeatureLine(line) {
  const fields = line.split('\t');
  
  if (fields.length !== 9) {
    throw new Error(`Invalid GFF3 line: expected 9 fields, got ${fields.length}`);
  }
  
  const [seqid, source, type, start, end, score, strand, phase, attributes] = fields;
  
  const feature = {
    seqid,
    source,
    type,
    start: parseInt(start),
    end: parseInt(end),
    score: score === '.' ? null : parseFloat(score),
    strand: strand === '.' ? null : strand,
    phase: phase === '.' ? null : parseInt(phase),
    attributes: parseAttributes(attributes)
  };
  
  // Add computed fields
  feature.length = feature.end - feature.start + 1;
  feature.id = feature.attributes.ID || null;
  feature.name = feature.attributes.Name || null;
  feature.parent = feature.attributes.Parent || null;
  
  return feature;
}

/**
 * Build hierarchical feature structure
 */
function buildHierarchy(features) {
  const byId = new Map();
  const roots = [];
  
  // Index features by ID
  for (const feature of features) {
    if (feature.id) {
      byId.set(feature.id, { ...feature, children: [] });
    }
  }
  
  // Build parent-child relationships
  for (const feature of features) {
    const indexed = feature.id ? byId.get(feature.id) : { ...feature, children: [] };
    
    if (feature.parent) {
      // Handle multiple parents
      const parents = Array.isArray(feature.parent) ? feature.parent : [feature.parent];
      for (const parentId of parents) {
        const parent = byId.get(parentId);
        if (parent) {
          parent.children.push(indexed);
        }
      }
    } else {
      roots.push(indexed);
    }
  }
  
  return roots;
}

/**
 * Group features by type
 */
function groupByType(features) {
  const grouped = {};
  
  for (const feature of features) {
    if (!grouped[feature.type]) {
      grouped[feature.type] = [];
    }
    grouped[feature.type].push(feature);
  }
  
  return grouped;
}

/**
 * Parse GFF3 file and return structured data
 * @param {string} filePath - Path to GFF3 file
 * @param {Object} options - Parser options
 * @returns {Promise<Object>} Parsed GFF3 data
 */
export async function parseGff(filePath, options = {}) {
  const {
    buildTree = true,  // Build hierarchical structure
    types = null,      // Filter by feature types
    region = null,     // Filter by region {seqid, start, end}
    onFeature = null   // Streaming callback
  } = options;
  
  return new Promise((resolve, reject) => {
    const result = {
      pragmas: [],
      sequenceRegions: [],
      features: [],
      byType: {},
      hierarchy: []
    };
    
    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity
    });
    
    rl.on('line', (line) => {
      // Skip empty lines
      if (!line.trim()) return;
      
      // Pragma/directive lines
      if (line.startsWith('##')) {
        if (line.startsWith('##gff-version')) {
          result.version = line.split(' ')[1];
        } else if (line.startsWith('##sequence-region')) {
          const parts = line.split(' ');
          result.sequenceRegions.push({
            seqid: parts[1],
            start: parseInt(parts[2]),
            end: parseInt(parts[3])
          });
        } else {
          result.pragmas.push(line);
        }
        return;
      }
      
      // Comment lines
      if (line.startsWith('#')) return;
      
      // FASTA section marker
      if (line === '##FASTA' || line.startsWith('>')) {
        // Stop parsing at FASTA section
        rl.close();
        return;
      }
      
      // Feature line
      try {
        const feature = parseFeatureLine(line);
        
        // Apply type filter
        if (types && !types.includes(feature.type)) return;
        
        // Apply region filter
        if (region) {
          if (feature.seqid !== region.seqid) return;
          if (feature.end < region.start || feature.start > region.end) return;
        }
        
        // Streaming callback
        if (onFeature) {
          onFeature(feature);
        }
        
        result.features.push(feature);
      } catch (error) {
        console.warn('Failed to parse line:', error.message);
      }
    });
    
    rl.on('close', () => {
      // Group by type
      result.byType = groupByType(result.features);
      
      // Build hierarchy if requested
      if (buildTree) {
        result.hierarchy = buildHierarchy(result.features);
      }
      
      resolve(result);
    });
    
    rl.on('error', reject);
  });
}

/**
 * Extract genes with their transcripts and exons
 */
export function extractGenes(gffData) {
  const genes = [];
  
  for (const feature of gffData.hierarchy) {
    if (feature.type === 'gene') {
      const gene = {
        id: feature.id,
        symbol: feature.name,
        chromosome: feature.seqid,
        start: feature.start,
        end: feature.end,
        strand: feature.strand,
        biotype: feature.attributes.biotype,
        description: feature.attributes.description,
        transcripts: []
      };
      
      // Extract transcripts (mRNA, transcript)
      for (const child of feature.children) {
        if (child.type === 'mRNA' || child.type === 'transcript') {
          const transcript = {
            id: child.id,
            name: child.name,
            start: child.start,
            end: child.end,
            exons: [],
            cds: []
          };
          
          // Extract exons and CDS
          for (const subChild of child.children) {
            if (subChild.type === 'exon') {
              transcript.exons.push({
                id: subChild.id,
                start: subChild.start,
                end: subChild.end,
                number: subChild.attributes.exon_number
              });
            } else if (subChild.type === 'CDS') {
              transcript.cds.push({
                id: subChild.id,
                start: subChild.start,
                end: subChild.end,
                phase: subChild.phase
              });
            }
          }
          
          // Sort by position
          transcript.exons.sort((a, b) => a.start - b.start);
          transcript.cds.sort((a, b) => a.start - b.start);
          
          gene.transcripts.push(transcript);
        }
      }
      
      genes.push(gene);
    }
  }
  
  return genes;
}

/**
 * Convert to visualization-friendly format
 */
export function featureToTrack(feature) {
  return {
    id: feature.id,
    name: feature.name,
    chromosome: feature.seqid,
    start: feature.start,
    end: feature.end,
    strand: feature.strand,
    type: feature.type,
    score: feature.score
  };
}

export default { parseGff, extractGenes, featureToTrack };
