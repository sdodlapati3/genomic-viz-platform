/**
 * Example 3: Working with BigWig Signal Data
 *
 * This example shows how to read coverage/signal data
 * from BigWig files and prepare it for visualization.
 *
 * Run: node src/examples/03-bigwig-signals.js
 */

import { createBigWigParser } from '../parsers/bigwigParser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIGWIG_FILE = path.join(__dirname, '../../data/sample.bw');

// Region to query
const REGION = {
  chromosome: 'chr17',
  start: 7668402,
  end: 7687550,
  gene: 'TP53',
};

async function exploreBigWigSignals() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Example 3: Working with BigWig Signal Data');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const parser = await createBigWigParser(BIGWIG_FILE);

    // Get chromosomes
    console.log('📋 Chromosomes in BigWig file:');
    console.log('─────────────────────────────────────────────────────────────');
    const chromosomes = await parser.getChromosomes();

    chromosomes.slice(0, 5).forEach((chrom) => {
      console.log(`  ${chrom.name}: ${chrom.length.toLocaleString()} bp`);
    });
    if (chromosomes.length > 5) {
      console.log(`  ... and ${chromosomes.length - 5} more`);
    }

    // Get signal for region
    console.log(`\n📍 Query Region: ${REGION.chromosome}:${REGION.start}-${REGION.end}`);
    console.log('─────────────────────────────────────────────────────────────');

    const signal = await parser.getSignal(REGION.chromosome, REGION.start, REGION.end);

    console.log(`\n  Raw signal points: ${signal.length}`);

    // Get binned data for visualization
    console.log('\n📊 Binned Signal (for visualization):');
    console.log('─────────────────────────────────────────────────────────────');

    const binned = await parser.getBinnedSignal(
      REGION.chromosome,
      REGION.start,
      REGION.end,
      { numBins: 50 } // 50 bins for ASCII visualization
    );

    console.log(`  Number of bins: ${binned.numBins}`);
    console.log(`  Bases per bin: ${binned.basesPerBin.toLocaleString()}`);
    console.log(`  Min value: ${binned.stats.min.toFixed(2)}`);
    console.log(`  Max value: ${binned.stats.max.toFixed(2)}`);
    console.log(`  Mean value: ${binned.stats.mean.toFixed(2)}`);

    // ASCII visualization
    console.log('\n📈 Signal Profile (ASCII):');
    console.log('─────────────────────────────────────────────────────────────');

    const maxHeight = 10;
    const maxVal = binned.stats.max || 1;

    for (let row = maxHeight; row >= 0; row--) {
      let line =
        row === maxHeight
          ? `${maxVal.toFixed(0).padStart(5)} │`
          : row === 0
            ? '    0 │'
            : '      │';

      for (const bin of binned.bins) {
        const normalizedHeight = (bin.value / maxVal) * maxHeight;
        if (normalizedHeight >= row) {
          line += '█';
        } else {
          line += ' ';
        }
      }
      console.log(line);
    }
    console.log('      └' + '─'.repeat(binned.bins.length));
    console.log(
      `       ${REGION.start.toLocaleString()}${' '.repeat(Math.max(0, binned.bins.length - 25))}${REGION.end.toLocaleString()}`
    );

    // Get statistics
    console.log('\n📊 Region Statistics:');
    console.log('─────────────────────────────────────────────────────────────');
    const stats = await parser.getStats(REGION.chromosome, REGION.start, REGION.end);
    console.log(`  Data points: ${stats.count}`);
    console.log(`  Sum: ${stats.sum.toFixed(2)}`);
    console.log(`  Mean: ${stats.mean.toFixed(2)}`);
    console.log(`  Std Dev: ${stats.std.toFixed(2)}`);

    // Explain concepts
    console.log('\n\n📚 BigWig Key Concepts:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`
  BigWig File Structure:
  ┌─────────────────────────────────────────────────────────┐
  │ HEADER                                                   │
  │ ├── Magic number, version                               │
  │ └── Chromosome tree (B+ tree)                           │
  ├─────────────────────────────────────────────────────────┤
  │ ZOOM LEVELS (pre-computed summaries)                    │
  │ ├── Level 0: Full resolution                            │
  │ ├── Level 1: 4x summary                                 │
  │ ├── Level 2: 16x summary                                │
  │ └── ...                                                 │
  ├─────────────────────────────────────────────────────────┤
  │ R-TREE INDEX (spatial index)                            │
  │ └── Enables fast region queries                         │
  ├─────────────────────────────────────────────────────────┤
  │ DATA BLOCKS (compressed signal values)                  │
  └─────────────────────────────────────────────────────────┘

  Zoom Levels:
  - Pre-aggregated data at different resolutions
  - Automatically chosen based on query region size
  - Makes whole-chromosome views as fast as small regions
    `);

    parser.close();
    console.log('\n✅ Example complete!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Make sure sample.bw exists in the data/ directory\n');
  }
}

exploreBigWigSignals();
