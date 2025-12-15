/**
 * Example 1: Understanding BAM File Structure
 *
 * This example explores the structure of BAM files
 * without diving into complex parsing.
 *
 * Run: node src/examples/01-bam-structure.js
 */

import { createBamParser } from '../parsers/bamParser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BAM_FILE = path.join(__dirname, '../../data/sample.bam');

async function exploreBamStructure() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Example 1: Understanding BAM File Structure');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // Open BAM file
    console.log('📂 Opening BAM file...');
    const parser = await createBamParser(BAM_FILE);

    // Get header information
    console.log('\n📋 BAM Header Information:');
    console.log('─────────────────────────────────────────────────────────────');
    const header = await parser.getHeader();

    console.log(`\n  Format Version: ${header.version || 'unknown'}`);
    console.log(`  Sort Order: ${header.sortOrder || 'unknown'}`);

    // Reference sequences
    console.log(`\n📊 Reference Sequences (${header.references.length} total):`);
    console.log('─────────────────────────────────────────────────────────────');

    // Show first 10 references
    const refsToShow = header.references.slice(0, 10);
    refsToShow.forEach((ref, i) => {
      console.log(`  ${i + 1}. ${ref.name.padEnd(10)} - ${ref.length.toLocaleString()} bp`);
    });

    if (header.references.length > 10) {
      console.log(`  ... and ${header.references.length - 10} more`);
    }

    // Read groups
    if (header.readGroups.length > 0) {
      console.log(`\n👥 Read Groups (${header.readGroups.length} total):`);
      console.log('─────────────────────────────────────────────────────────────');
      header.readGroups.forEach((rg, i) => {
        console.log(`  ${i + 1}. ID: ${rg.id}, Sample: ${rg.sample || 'N/A'}`);
      });
    }

    // Key concepts explanation
    console.log('\n📚 Key Concepts:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`
  BAM File Structure:
  ┌─────────────────────────────────────────────────────────┐
  │ HEADER                                                   │
  │ ├── @HD  Version and sort order                         │
  │ ├── @SQ  Reference sequences (chromosomes)              │
  │ ├── @RG  Read groups (sample information)               │
  │ └── @PG  Programs used to generate this file            │
  ├─────────────────────────────────────────────────────────┤
  │ ALIGNMENT RECORDS                                        │
  │ ├── Compressed in BGZF blocks                           │
  │ ├── Each record has: read name, flag, position, CIGAR   │
  │ └── Optional tags: read group, MD string, etc.          │
  └─────────────────────────────────────────────────────────┘
  
  Why BGZF Compression?
  - Block-based gzip allows random access
  - Each block can be independently decompressed
  - Index (BAI) stores block offsets for each region
  `);

    parser.close();
    console.log('\n✅ Example complete!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Make sure sample.bam exists in the data/ directory');
    console.log('   Run: npm run download-samples\n');
  }
}

exploreBamStructure();
