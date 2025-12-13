/**
 * JavaScript VCF Parser Implementation
 * 
 * Pure JavaScript implementation for benchmarking against Rust
 */

/**
 * Parse VCF header
 * @param {string[]} lines - Header lines
 * @returns {Object} Parsed header
 */
export function parseHeader(lines) {
  const header = {
    fileFormat: '4.2',
    reference: null,
    contigs: [],
    infoFields: [],
    formatFields: [],
    filters: [],
    samples: [],
    metaLines: []
  };

  for (const line of lines) {
    if (line.startsWith('##')) {
      header.metaLines.push(line);
      
      const content = line.slice(2);
      const eqIdx = content.indexOf('=');
      
      if (eqIdx > 0) {
        const key = content.slice(0, eqIdx);
        const value = content.slice(eqIdx + 1);

        switch (key) {
          case 'fileformat':
            header.fileFormat = value;
            break;
          case 'reference':
            header.reference = value;
            break;
          case 'contig':
            header.contigs.push(parseStructuredField(value));
            break;
          case 'INFO':
            header.infoFields.push(parseStructuredField(value));
            break;
          case 'FORMAT':
            header.formatFields.push(parseStructuredField(value));
            break;
          case 'FILTER':
            header.filters.push(parseStructuredField(value));
            break;
        }
      }
    } else if (line.startsWith('#CHROM')) {
      const fields = line.split('\t');
      if (fields.length > 9) {
        header.samples = fields.slice(9);
      }
    }
  }

  return header;
}

/**
 * Parse structured field like <ID=XX,Number=1,Type=Integer,Description="...">
 * @param {string} value - Field value
 * @returns {Object} Parsed fields
 */
function parseStructuredField(value) {
  if (!value.startsWith('<') || !value.endsWith('>')) {
    return {};
  }

  const inner = value.slice(1, -1);
  const fields = {};
  let currentKey = '';
  let currentValue = '';
  let inQuotes = false;
  let inValue = false;

  for (const ch of inner) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === '=' && !inQuotes) {
      inValue = true;
    } else if (ch === ',' && !inQuotes) {
      if (currentKey) {
        fields[currentKey] = currentValue;
      }
      currentKey = '';
      currentValue = '';
      inValue = false;
    } else {
      if (inValue) {
        currentValue += ch;
      } else {
        currentKey += ch;
      }
    }
  }

  if (currentKey) {
    fields[currentKey] = currentValue;
  }

  return fields;
}

/**
 * Parse a single VCF record
 * @param {string} line - VCF record line
 * @param {string[]} sampleNames - Sample names from header
 * @param {Object} options - Parser options
 * @returns {Object} Parsed record
 */
export function parseRecord(line, sampleNames = [], options = {}) {
  const { parseInfo = true, parseSamples = true } = options;
  const fields = line.split('\t');

  if (fields.length < 8) {
    throw new Error(`Invalid VCF record: expected at least 8 fields, got ${fields.length}`);
  }

  const record = {
    chrom: fields[0],
    pos: parseInt(fields[1], 10),
    id: fields[2] === '.' ? null : fields[2],
    reference: fields[3],
    alternate: fields[4] === '.' ? [] : fields[4].split(','),
    qual: fields[5] === '.' ? null : parseFloat(fields[5]),
    filter: parseFilter(fields[6]),
    info: parseInfo ? parseInfoField(fields[7]) : {},
    samples: []
  };

  // Parse samples if present
  if (parseSamples && fields.length > 9) {
    record.samples = parseSampleFields(fields.slice(8), sampleNames);
  }

  // Add variant type helpers
  record.variantType = getVariantType(record);
  record.isSnp = isSnp(record);
  record.isInsertion = isInsertion(record);
  record.isDeletion = isDeletion(record);

  return record;
}

/**
 * Parse FILTER field
 */
function parseFilter(value) {
  if (value === '.') return { status: 'missing', filters: [] };
  if (value === 'PASS') return { status: 'pass', filters: [] };
  return { status: 'failed', filters: value.split(';') };
}

/**
 * Parse INFO field
 */
function parseInfoField(value) {
  const info = {};
  
  if (value === '.') return info;

  for (const item of value.split(';')) {
    const eqIdx = item.indexOf('=');
    if (eqIdx > 0) {
      const key = item.slice(0, eqIdx);
      const val = item.slice(eqIdx + 1);
      info[key] = parseInfoValue(val);
    } else {
      info[item] = true; // Flag
    }
  }

  return info;
}

/**
 * Parse INFO value
 */
function parseInfoValue(value) {
  // Array value
  if (value.includes(',')) {
    const parts = value.split(',');
    
    // Try integers
    const ints = parts.map(p => parseInt(p, 10));
    if (ints.every(n => !isNaN(n))) return ints;
    
    // Try floats
    const floats = parts.map(p => parseFloat(p));
    if (floats.every(n => !isNaN(n))) return floats;
    
    return parts;
  }

  // Single value
  const asInt = parseInt(value, 10);
  if (!isNaN(asInt) && String(asInt) === value) return asInt;
  
  const asFloat = parseFloat(value);
  if (!isNaN(asFloat)) return asFloat;

  return value;
}

/**
 * Parse sample columns
 */
function parseSampleFields(fields, sampleNames) {
  if (fields.length === 0) return [];

  const formatKeys = fields[0].split(':');
  const samples = [];

  for (let i = 1; i < fields.length; i++) {
    const values = fields[i].split(':');
    const sample = {
      name: sampleNames[i - 1] || `SAMPLE_${i - 1}`,
      genotype: null,
      fields: {}
    };

    for (let j = 0; j < formatKeys.length; j++) {
      const key = formatKeys[j];
      const value = values[j] || '.';

      if (key === 'GT') {
        sample.genotype = parseGenotype(value);
      } else {
        sample.fields[key] = value;
      }
    }

    samples.push(sample);
  }

  return samples;
}

/**
 * Parse genotype string
 */
function parseGenotype(value) {
  if (value === '.' || value === './.' || value === '.|.') {
    return null;
  }

  const phased = value.includes('|');
  const separator = phased ? '|' : '/';
  const alleles = value.split(separator).map(a => 
    a === '.' ? null : parseInt(a, 10)
  );

  return { alleles, phased };
}

/**
 * Check if variant is SNP
 */
function isSnp(record) {
  return record.reference.length === 1 && 
         record.alternate.every(a => a.length === 1 && a !== '*');
}

/**
 * Check if variant is insertion
 */
function isInsertion(record) {
  return record.alternate.some(a => a.length > record.reference.length);
}

/**
 * Check if variant is deletion
 */
function isDeletion(record) {
  return record.alternate.some(a => a.length < record.reference.length);
}

/**
 * Get variant type
 */
function getVariantType(record) {
  if (isSnp(record)) return 'SNP';
  if (isInsertion(record) && isDeletion(record)) return 'COMPLEX';
  if (isInsertion(record)) return 'INS';
  if (isDeletion(record)) return 'DEL';
  return 'OTHER';
}

/**
 * Parse VCF content
 * @param {string} content - VCF file content
 * @param {Object} options - Parser options
 * @returns {Object} Parsed VCF data
 */
export function parseVcf(content, options = {}) {
  const lines = content.split('\n');
  const headerLines = [];
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith('#')) {
      headerLines.push(line);
    } else if (line.trim()) {
      dataLines.push(line);
    }
  }

  const header = parseHeader(headerLines);
  const records = [];

  for (const line of dataLines) {
    try {
      records.push(parseRecord(line, header.samples, options));
    } catch (e) {
      if (!options.skipInvalid) throw e;
    }
  }

  return { header, records };
}

/**
 * Calculate statistics from records
 */
export function calculateStats(records) {
  const stats = {
    totalRecords: records.length,
    snps: 0,
    insertions: 0,
    deletions: 0,
    complex: 0,
    passedFilter: 0,
    failedFilter: 0,
    chromosomes: new Set()
  };

  for (const record of records) {
    switch (record.variantType) {
      case 'SNP':
        stats.snps++;
        break;
      case 'INS':
        stats.insertions++;
        break;
      case 'DEL':
        stats.deletions++;
        break;
      case 'COMPLEX':
        stats.complex++;
        break;
    }

    if (record.filter.status === 'pass') {
      stats.passedFilter++;
    } else if (record.filter.status === 'failed') {
      stats.failedFilter++;
    }

    stats.chromosomes.add(record.chrom);
  }

  stats.chromosomes = Array.from(stats.chromosomes);
  return stats;
}

export default {
  parseVcf,
  parseHeader,
  parseRecord,
  calculateStats
};
