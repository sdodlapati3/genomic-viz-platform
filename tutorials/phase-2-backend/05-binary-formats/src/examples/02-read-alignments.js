/**
 * Example 2: Reading Alignments from BAM
 *
 * This example shows how to query reads from a specific
 * genomic region and understand alignment information.
 *
 * Run: node src/examples/02-read-alignments.js
 */

import { createBamParser } from '../parsers/bamParser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BAM_FILE = path.join(__dirname, '../../data/sample.bam');

// TP53 gene region (commonly mutated in cancer)
const REGION = {
  chromosome: 'chr17',
  start: 7668402,
  end: 7687550,
  gene: 'TP53',
};

async function exploreReadAlignments() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Example 2: Reading Alignments from BAM');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const parser = await createBamParser(BAM_FILE);

    console.log(`📍 Query Region: ${REGION.chromosome}:${REGION.start}-${REGION.end}`);
    console.log(`   Gene: ${REGION.gene}\n`);

    // Get reads in region
    console.log('🔍 Fetching reads...');
    const reads = await parser.getReadsInRegion(REGION.chromosome, REGION.start, REGION.end, {
      maxRecords: 100,
      includeSequence: true,
    });

    console.log(`\n📊 Found ${reads.length} reads in region\n`);

    // Show first 5 reads
    console.log('📝 Sample Reads:');
    console.log('─────────────────────────────────────────────────────────────');

    reads.slice(0, 5).forEach((read, i) => {
      console.log(`\n  Read ${i + 1}: ${read.readName}`);
      console.log(`    Position: ${read.chromosome}:${read.start}-${read.end}`);
      console.log(`    Strand: ${read.strand}`);
      console.log(`    MAPQ: ${read.mapq}`);
      console.log(`    CIGAR: ${read.cigar}`);
      console.log(
        `    Sequence: ${read.sequence ? read.sequence.substring(0, 30) + '...' : 'N/A'}`
      );
    });

    // Explain key concepts
    console.log('\n\n📚 Understanding Alignment Fields:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`
  MAPQ (Mapping Quality):
  - Score 0-60 indicating confidence in alignment
  - MAPQ 60: Very confident (unique mapping)
  - MAPQ 0: Read maps equally well to multiple places
  
  CIGAR String:
  - Describes how the read aligns to reference
  - M = Match/Mismatch
  - I = Insertion in read
  - D = Deletion in read
  - S = Soft clipping
  - Example: "75M" = 75 bases match
  - Example: "30M2I43M" = 30 match, 2 insert, 43 match
  
  FLAG Field (binary flags):
  - 0x1: Paired-end read
  - 0x4: Read unmapped
  - 0x10: Read reverse strand
  - 0x40: First in pair
  - 0x80: Second in pair
    `);

    // Calculate some statistics
    console.log('\n📈 Read Statistics:');
    console.log('─────────────────────────────────────────────────────────────');

    const forwardStrand = reads.filter((r) => r.strand === '+').length;
    const reverseStrand = reads.filter((r) => r.strand === '-').length;
    const avgMapQ = reads.reduce((sum, r) => sum + r.mapq, 0) / reads.length;

    console.log(`  Total reads: ${reads.length}`);
    console.log(`  Forward strand (+): ${forwardStrand}`);
    console.log(`  Reverse strand (-): ${reverseStrand}`);
    console.log(`  Average MAPQ: ${avgMapQ.toFixed(1)}`);

    parser.close();
    console.log('\n✅ Example complete!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Make sure sample.bam exists in the data/ directory\n');
  }
}

exploreReadAlignments();
