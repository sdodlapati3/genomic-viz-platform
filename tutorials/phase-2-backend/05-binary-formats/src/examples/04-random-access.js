/**
 * Example 4: Random Access Patterns
 *
 * This example demonstrates how indexed binary files
 * enable fast random access to any genomic region.
 *
 * Run: node src/examples/04-random-access.js
 */

import { createBamParser } from '../parsers/bamParser.js';
import { createBigWigParser } from '../parsers/bigwigParser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BAM_FILE = path.join(__dirname, '../../data/sample.bam');
const BIGWIG_FILE = path.join(__dirname, '../../data/sample.bw');

// Multiple regions to query (simulate user browsing)
const REGIONS = [
  { chr: 'chr17', start: 7668402, end: 7687550, name: 'TP53' },
  { chr: 'chr13', start: 32889617, end: 32973809, name: 'BRCA2' },
  { chr: 'chr7', start: 55019017, end: 55211628, name: 'EGFR' },
  { chr: 'chr12', start: 25204789, end: 25250936, name: 'KRAS' },
  { chr: 'chr3', start: 178866311, end: 178952497, name: 'PIK3CA' },
];

async function demonstrateRandomAccess() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Example 4: Random Access Patterns');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📚 Why Random Access Matters:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`
  Without indexing (text files):
  ┌─────────────────────────────────────────────────────────┐
  │  To find chr17:7,668,402 in a 50GB BAM file...         │
  │  • Must scan from beginning                             │
  │  • Read all chromosomes 1-16                            │
  │  • Read chr17 until position 7,668,402                  │
  │  • Time: Minutes to hours                               │
  └─────────────────────────────────────────────────────────┘

  With indexing (BAM + BAI):
  ┌─────────────────────────────────────────────────────────┐
  │  To find chr17:7,668,402 in a 50GB BAM file...         │
  │  • Lookup chr17:7,668,402 in index                      │
  │  • Seek directly to that position                       │
  │  • Time: Milliseconds                                   │
  └─────────────────────────────────────────────────────────┘
  `);

  try {
    // Open files once
    console.log('📂 Opening files...');
    const bamParser = await createBamParser(BAM_FILE);
    const bigwigParser = await createBigWigParser(BIGWIG_FILE);

    console.log('\n🔍 Querying multiple regions (simulating genome browser):\n');
    console.log('─────────────────────────────────────────────────────────────');

    for (const region of REGIONS) {
      const startTime = performance.now();

      // Query both files for this region
      let bamCount = 0;
      let bigwigMean = 0;

      try {
        const reads = await bamParser.getReadsInRegion(region.chr, region.start, region.end, {
          maxRecords: 100,
          includeSequence: false,
        });
        bamCount = reads.length;
      } catch (e) {
        bamCount = 'N/A';
      }

      try {
        const stats = await bigwigParser.getStats(region.chr, region.start, region.end);
        bigwigMean = stats.mean.toFixed(2);
      } catch (e) {
        bigwigMean = 'N/A';
      }

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      console.log(`  ${region.name.padEnd(8)} (${region.chr}:${region.start.toLocaleString()})`);
      console.log(`    BAM reads: ${bamCount}, BigWig mean: ${bigwigMean}, Time: ${duration}ms`);
    }

    // Explain the index structure
    console.log('\n\n📋 Index File Structure (BAI):');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`
  BAI (BAM Index) Structure:
  ┌─────────────────────────────────────────────────────────┐
  │ For each reference sequence (chromosome):               │
  │                                                         │
  │   BINS (hierarchical intervals)                         │
  │   ├── Bin 0: Entire chromosome                         │
  │   ├── Bin 1-8: 512Mb chunks                            │
  │   ├── Bin 9-72: 64Mb chunks                            │
  │   ├── Bin 73-584: 8Mb chunks                           │
  │   ├── ...                                              │
  │   └── Bin 4681-37448: 16kb chunks                      │
  │                                                         │
  │   Each bin contains:                                    │
  │   • Virtual file offset (BGZF block + offset)          │
  │   • List of chunks pointing to alignments              │
  │                                                         │
  │   LINEAR INDEX (16kb bins)                              │
  │   • Quick lookup for specific positions                │
  └─────────────────────────────────────────────────────────┘

  Query Process:
  1. Calculate which bins overlap the query region
  2. Load chunk offsets from those bins
  3. Seek to the BGZF blocks containing data
  4. Decompress only necessary blocks
  5. Filter reads that actually overlap region
    `);

    bamParser.close();
    bigwigParser.close();
    console.log('\n✅ Example complete!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Make sure sample files exist in the data/ directory\n');
  }
}

demonstrateRandomAccess();
