/**
 * Fusion Parser Utility
 *
 * Parse various fusion detection tool output formats:
 * - STAR-Fusion
 * - Arriba
 * - FusionCatcher
 * - Generic TSV
 */

/**
 * Parse fusion data from various formats
 *
 * @class FusionParser
 */
export class FusionParser {
  /**
   * Auto-detect format and parse
   * @param {string} content - File content
   * @param {string} filename - Filename for format hint
   * @returns {Array} Array of fusion objects
   */
  static parse(content, filename = '') {
    const format = this.detectFormat(content, filename);

    switch (format) {
      case 'star-fusion':
        return this.parseStarFusion(content);
      case 'arriba':
        return this.parseArriba(content);
      case 'fusioncatcher':
        return this.parseFusionCatcher(content);
      default:
        return this.parseGenericTsv(content);
    }
  }

  /**
   * Detect file format
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @returns {string} Format identifier
   */
  static detectFormat(content, filename) {
    const lines = content.trim().split('\n');
    const header = lines[0]?.toLowerCase() || '';

    // Check filename
    if (filename.includes('star-fusion') || filename.includes('starfusion')) {
      return 'star-fusion';
    }
    if (filename.includes('arriba')) {
      return 'arriba';
    }
    if (filename.includes('fusioncatcher')) {
      return 'fusioncatcher';
    }

    // Check header content
    if (header.includes('#fusionname') || header.includes('junctionreadcount')) {
      return 'star-fusion';
    }
    if (header.includes('gene1') && header.includes('gene2') && header.includes('strand1')) {
      return 'arriba';
    }
    if (header.includes('gene_1_symbol') || header.includes('spanning_unique_reads')) {
      return 'fusioncatcher';
    }

    return 'generic';
  }

  /**
   * Parse STAR-Fusion output
   * @param {string} content - File content
   * @returns {Array} Parsed fusions
   */
  static parseStarFusion(content) {
    const lines = content.trim().split('\n');
    const fusions = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;

      const fields = line.split('\t');
      if (fields.length < 6) continue;

      const fusionName = fields[0];
      const [gene5Name, gene3Name] = fusionName.split('--');

      // Parse breakpoint info
      const leftBreak = fields[5]?.match(/(\w+):(\d+):([\+\-])/);
      const rightBreak = fields[7]?.match(/(\w+):(\d+):([\+\-])/);

      fusions.push({
        id: `fusion_${i}`,
        gene5: {
          name: gene5Name,
          chromosome: leftBreak ? `chr${leftBreak[1]}` : '',
          strand: leftBreak ? leftBreak[3] : '+',
        },
        gene3: {
          name: gene3Name,
          chromosome: rightBreak ? `chr${rightBreak[1]}` : '',
          strand: rightBreak ? rightBreak[3] : '+',
        },
        chr5: leftBreak ? `chr${leftBreak[1]}` : '',
        chr3: rightBreak ? `chr${rightBreak[1]}` : '',
        breakpoint5: leftBreak ? parseInt(leftBreak[2]) : 0,
        breakpoint3: rightBreak ? parseInt(rightBreak[2]) : 0,
        reads: parseInt(fields[1]) || 0,
        spanningReads: parseInt(fields[2]) || 0,
        confidence: 'high',
        callers: ['STAR-Fusion'],
        type: this._classifyFusion(leftBreak?.[1], rightBreak?.[1]),
        raw: fields,
      });
    }

    return fusions;
  }

  /**
   * Parse Arriba output
   * @param {string} content - File content
   * @returns {Array} Parsed fusions
   */
  static parseArriba(content) {
    const lines = content.trim().split('\n');
    const fusions = [];

    // Parse header to get column indices
    const header = lines[0].split('\t').map((h) => h.toLowerCase().trim());
    const idx = {
      gene1: header.indexOf('gene1') >= 0 ? header.indexOf('gene1') : header.indexOf('#gene1'),
      gene2: header.indexOf('gene2'),
      strand1: header.indexOf('strand1(gene/fusion)'),
      strand2: header.indexOf('strand2(gene/fusion)'),
      breakpoint1: header.indexOf('breakpoint1'),
      breakpoint2: header.indexOf('breakpoint2'),
      type: header.indexOf('type'),
      confidence: header.indexOf('confidence'),
      splitReads: header.indexOf('split_reads1'),
      discordantReads: header.indexOf('discordant_mates'),
    };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split('\t');

      const gene1 = fields[idx.gene1 >= 0 ? idx.gene1 : 0] || '';
      const gene2 = fields[idx.gene2 >= 0 ? idx.gene2 : 1] || '';

      // Parse breakpoints (format: chr:position)
      const bp1 = fields[idx.breakpoint1]?.split(':') || [];
      const bp2 = fields[idx.breakpoint2]?.split(':') || [];

      // Parse strands (format: gene/fusion)
      const strand1 = fields[idx.strand1]?.split('/')[0] || '+';
      const strand2 = fields[idx.strand2]?.split('/')[0] || '+';

      fusions.push({
        id: `fusion_${i}`,
        gene5: {
          name: gene1,
          chromosome: bp1[0] || '',
          strand: strand1,
        },
        gene3: {
          name: gene2,
          chromosome: bp2[0] || '',
          strand: strand2,
        },
        chr5: bp1[0] || '',
        chr3: bp2[0] || '',
        breakpoint5: parseInt(bp1[1]) || 0,
        breakpoint3: parseInt(bp2[1]) || 0,
        reads: parseInt(fields[idx.splitReads]) || 0,
        type: fields[idx.type] || 'unknown',
        confidence: fields[idx.confidence] || 'medium',
        callers: ['Arriba'],
        raw: fields,
      });
    }

    return fusions;
  }

  /**
   * Parse FusionCatcher output
   * @param {string} content - File content
   * @returns {Array} Parsed fusions
   */
  static parseFusionCatcher(content) {
    const lines = content.trim().split('\n');
    const fusions = [];

    // Parse header
    const header = lines[0].split('\t').map((h) => h.toLowerCase().trim());
    const idx = {
      gene1: header.indexOf('gene_1_symbol(5end_fusion_partner)'),
      gene2: header.indexOf('gene_2_symbol(3end_fusion_partner)'),
      chr1: header.indexOf('gene_1_chromosome'),
      chr2: header.indexOf('gene_2_chromosome'),
      pos1: header.indexOf('fusion_point_for_gene_1'),
      pos2: header.indexOf('fusion_point_for_gene_2'),
      spanningReads: header.indexOf('spanning_unique_reads'),
      description: header.indexOf('description'),
    };

    // Fallback to positional parsing if headers not found
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split('\t');

      const gene1 = fields[idx.gene1 >= 0 ? idx.gene1 : 0] || '';
      const gene2 = fields[idx.gene2 >= 0 ? idx.gene2 : 1] || '';

      // Parse position (format: chr:position:strand)
      const pos1 = fields[idx.pos1]?.split(':') || fields[4]?.split(':') || [];
      const pos2 = fields[idx.pos2]?.split(':') || fields[5]?.split(':') || [];

      fusions.push({
        id: `fusion_${i}`,
        gene5: {
          name: gene1,
          chromosome: pos1[0] || fields[idx.chr1] || '',
          strand: pos1[2] || '+',
        },
        gene3: {
          name: gene2,
          chromosome: pos2[0] || fields[idx.chr2] || '',
          strand: pos2[2] || '+',
        },
        chr5: pos1[0] || fields[idx.chr1] || '',
        chr3: pos2[0] || fields[idx.chr2] || '',
        breakpoint5: parseInt(pos1[1]) || 0,
        breakpoint3: parseInt(pos2[1]) || 0,
        reads: parseInt(fields[idx.spanningReads]) || 0,
        type: 'unknown',
        confidence: 'medium',
        description: fields[idx.description] || '',
        callers: ['FusionCatcher'],
        raw: fields,
      });
    }

    return fusions;
  }

  /**
   * Parse generic TSV fusion format
   * @param {string} content - File content
   * @returns {Array} Parsed fusions
   */
  static parseGenericTsv(content) {
    const lines = content.trim().split('\n');
    const fusions = [];

    // Try to detect header
    const header = lines[0].split('\t').map((h) => h.toLowerCase().trim());
    const hasHeader = header.some(
      (h) => h.includes('gene') || h.includes('fusion') || h.includes('chr')
    );

    const startIdx = hasHeader ? 1 : 0;

    // Try to identify column indices from header
    const idx = {
      gene5: this._findColumnIndex(header, ['gene5', 'gene_5', '5_gene', 'gene1', 'gene_1']),
      gene3: this._findColumnIndex(header, ['gene3', 'gene_3', '3_gene', 'gene2', 'gene_2']),
      chr5: this._findColumnIndex(header, ['chr5', 'chr_5', 'chr1', 'chr_1', 'chrom1']),
      chr3: this._findColumnIndex(header, ['chr3', 'chr_3', 'chr2', 'chr_2', 'chrom2']),
      reads: this._findColumnIndex(header, ['reads', 'read_count', 'support', 'count']),
    };

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = line.split('\t');

      // Check if first field looks like "Gene1-Gene2" fusion format
      let gene5, gene3;
      if (fields[0].includes('-') && !fields[0].includes('chr')) {
        [gene5, gene3] = fields[0].split('-');
      } else {
        gene5 = fields[idx.gene5 >= 0 ? idx.gene5 : 0] || '';
        gene3 = fields[idx.gene3 >= 0 ? idx.gene3 : 1] || '';
      }

      fusions.push({
        id: `fusion_${i}`,
        gene5: { name: gene5, chromosome: fields[idx.chr5] || '', strand: '+' },
        gene3: { name: gene3, chromosome: fields[idx.chr3] || '', strand: '+' },
        chr5: fields[idx.chr5] || '',
        chr3: fields[idx.chr3] || '',
        reads: parseInt(fields[idx.reads]) || 0,
        type: 'unknown',
        confidence: 'low',
        callers: ['Generic'],
        raw: fields,
      });
    }

    return fusions;
  }

  /**
   * Find column index from possible names
   * @private
   */
  static _findColumnIndex(header, possibleNames) {
    for (const name of possibleNames) {
      const idx = header.findIndex((h) => h.includes(name));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  /**
   * Classify fusion type based on chromosomes
   * @private
   */
  static _classifyFusion(chr1, chr2) {
    if (!chr1 || !chr2) return 'unknown';
    if (chr1 === chr2) return 'intrachromosomal';
    return 'interchromosomal';
  }

  /**
   * Export fusions to TSV format
   * @param {Array} fusions - Fusion array
   * @returns {string} TSV content
   */
  static exportToTsv(fusions) {
    const header = [
      'fusion_name',
      'gene5',
      'gene3',
      'chr5',
      'chr3',
      'breakpoint5',
      'breakpoint3',
      'reads',
      'type',
      'confidence',
    ].join('\t');

    const rows = fusions.map((f) =>
      [
        `${f.gene5?.name || f.gene5}-${f.gene3?.name || f.gene3}`,
        f.gene5?.name || f.gene5,
        f.gene3?.name || f.gene3,
        f.chr5,
        f.chr3,
        f.breakpoint5,
        f.breakpoint3,
        f.reads,
        f.type,
        f.confidence,
      ].join('\t')
    );

    return [header, ...rows].join('\n');
  }

  /**
   * Validate fusion data
   * @param {Array} fusions - Fusion array
   * @returns {Object} Validation result
   */
  static validate(fusions) {
    const errors = [];
    const warnings = [];

    fusions.forEach((f, i) => {
      const name = `Fusion ${i + 1}`;

      // Check required fields
      if (!f.gene5?.name && !f.gene5) {
        errors.push(`${name}: Missing 5' gene`);
      }
      if (!f.gene3?.name && !f.gene3) {
        errors.push(`${name}: Missing 3' gene`);
      }

      // Check for suspicious patterns
      if (f.gene5 === f.gene3 || f.gene5?.name === f.gene3?.name) {
        warnings.push(`${name}: Same gene for both partners (read-through?)`);
      }

      if (f.reads && f.reads < 2) {
        warnings.push(`${name}: Low read support (${f.reads})`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: `${fusions.length} fusions, ${errors.length} errors, ${warnings.length} warnings`,
    };
  }
}

export default FusionParser;
