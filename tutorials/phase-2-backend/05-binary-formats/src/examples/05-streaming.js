/**
 * Example 5: Streaming Large Files
 *
 * This example demonstrates streaming patterns for
 * processing large genomic files without loading
 * everything into memory.
 *
 * Run: node src/examples/05-streaming.js
 */

import { createBamParser } from '../parsers/bamParser.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BAM_FILE = path.join(__dirname, '../../data/sample.bam');

// Large region to process
const LARGE_REGION = {
  chromosome: 'chr17',
  start: 0,
  end: 10000000, // 10 Mb
  chunkSize: 100000, // 100 kb chunks
};

async function demonstrateStreaming() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Example 5: Streaming Large Files');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📚 Memory-Efficient Processing:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`
  The Problem:
  ┌─────────────────────────────────────────────────────────┐
  │  Whole genome BAM file: 50-200 GB                       │
  │  Browser memory limit: ~4 GB (varies)                   │
  │  Loading everything = 💥 Memory crash                   │
  └─────────────────────────────────────────────────────────┘

  The Solution: Chunked Streaming
  ┌─────────────────────────────────────────────────────────┐
  │  1. Divide region into chunks (e.g., 100kb each)       │
  │  2. Process one chunk at a time                        │
  │  3. Aggregate results progressively                    │
  │  4. Release memory after each chunk                    │
  │                                                         │
  │  Memory used: ~size of one chunk (not whole file)      │
  └─────────────────────────────────────────────────────────┘
  `);

  try {
    const parser = await createBamParser(BAM_FILE);

    console.log('\n🔄 Streaming Coverage Calculation:');
    console.log(
      `   Region: ${LARGE_REGION.chromosome}:0-${(LARGE_REGION.end / 1000000).toFixed(0)}Mb`
    );
    console.log(`   Chunk size: ${(LARGE_REGION.chunkSize / 1000).toFixed(0)}kb`);
    console.log('─────────────────────────────────────────────────────────────\n');

    // Calculate number of chunks
    const numChunks = Math.ceil(LARGE_REGION.end / LARGE_REGION.chunkSize);

    // Streaming accumulators
    let totalReads = 0;
    let chunksProcessed = 0;
    const coverageHistogram = new Array(10).fill(0); // 10 bins for coverage distribution

    // Process in chunks
    console.log('   Processing chunks...\n');

    // In real scenario, we'd process all chunks. Here we do first 10 as demo.
    const maxChunks = Math.min(10, numChunks);

    for (let i = 0; i < maxChunks; i++) {
      const chunkStart = i * LARGE_REGION.chunkSize;
      const chunkEnd = Math.min(chunkStart + LARGE_REGION.chunkSize, LARGE_REGION.end);

      // Get coverage for this chunk
      try {
        const coverage = await parser.getCoverage(
          LARGE_REGION.chromosome,
          chunkStart,
          chunkEnd,
          { binSize: 1000 } // 1kb bins within chunk
        );

        totalReads += coverage.stats.totalReads;
        chunksProcessed++;

        // Update histogram
        for (const bin of coverage.bins) {
          const histBin = Math.min(9, Math.floor(bin.coverage / 10));
          coverageHistogram[histBin]++;
        }

        // Progress indicator
        const progress = Math.floor((i / maxChunks) * 20);
        const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);
        process.stdout.write(`\r   [${bar}] ${(((i + 1) / maxChunks) * 100).toFixed(0)}%`);
      } catch (e) {
        // Region might not have data
        chunksProcessed++;
      }
    }

    console.log('\n\n📊 Streaming Results:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`   Chunks processed: ${chunksProcessed}`);
    console.log(`   Total reads found: ${totalReads}`);

    // Show coverage distribution
    console.log('\n   Coverage Distribution:');
    const maxHist = Math.max(...coverageHistogram) || 1;
    coverageHistogram.forEach((count, i) => {
      const label = `   ${(i * 10).toString().padStart(3)}-${((i + 1) * 10 - 1).toString().padStart(3)}x:`;
      const barLen = Math.floor((count / maxHist) * 20);
      const bar = '▓'.repeat(barLen);
      console.log(`${label} ${bar} ${count}`);
    });

    // Explain streaming pattern
    console.log('\n\n📚 Streaming Pattern Implementation:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`
  async function* streamCoverage(parser, region, chunkSize) {
    const numChunks = Math.ceil(region.length / chunkSize);
    
    for (let i = 0; i < numChunks; i++) {
      const start = region.start + (i * chunkSize);
      const end = Math.min(start + chunkSize, region.end);
      
      // Fetch one chunk
      const coverage = await parser.getCoverage(
        region.chr, start, end
      );
      
      // Yield results (memory released after use)
      yield { chunk: i, coverage };
    }
  }
  
  // Usage:
  for await (const { chunk, coverage } of streamCoverage(parser, region, 100000)) {
    // Process each chunk
    updateVisualization(coverage);
    // Previous chunk's data is garbage collected
  }
    `);

    // Backpressure explanation
    console.log('\n⚠️  Backpressure Considerations:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`
  When streaming to a frontend:
  
  1. WebSocket with flow control
     - Server sends chunk
     - Waits for "ready" message before next chunk
     
  2. Server-Sent Events (SSE)
     - One-way streaming
     - Client processes events asynchronously
     
  3. Pagination API
     - Client requests chunks by number
     - Full control over timing
     
  Example SSE endpoint:
  
  app.get('/api/stream/coverage', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    
    const stream = streamCoverage(parser, region, chunkSize);
    
    for await (const chunk of stream) {
      res.write(\`data: \${JSON.stringify(chunk)}\\n\\n\`);
    }
    
    res.end();
  });
    `);

    parser.close();
    console.log('\n✅ Example complete!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tip: Make sure sample.bam exists in the data/ directory\n');
  }
}

demonstrateStreaming();
