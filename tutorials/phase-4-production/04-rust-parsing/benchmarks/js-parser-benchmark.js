/**
 * JavaScript VCF Parser Benchmark
 * 
 * Benchmark the pure JavaScript VCF parser implementation
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseVcf, calculateStats } from './js-vcf-parser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Format milliseconds
 */
function formatTime(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(2)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Run benchmark for a single file
 */
function benchmarkFile(filePath, iterations = 5) {
  const content = readFileSync(filePath, 'utf-8');
  const fileSize = statSync(filePath).size;
  
  console.log(`\n  File: ${filePath}`);
  console.log(`  Size: ${formatBytes(fileSize)}`);

  const times = [];
  let result;

  // Warmup
  parseVcf(content, { skipInvalid: true });

  // Benchmark iterations
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = parseVcf(content, { skipInvalid: true });
    const elapsed = performance.now() - start;
    times.push(elapsed);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const throughput = (fileSize / 1024 / 1024) / (avgTime / 1000); // MB/s

  const stats = calculateStats(result.records);

  console.log(`  Records: ${stats.totalRecords}`);
  console.log(`  Samples: ${result.header.samples.length}`);
  console.log(`  Parse time (avg): ${formatTime(avgTime)}`);
  console.log(`  Parse time (min): ${formatTime(minTime)}`);
  console.log(`  Parse time (max): ${formatTime(maxTime)}`);
  console.log(`  Throughput: ${throughput.toFixed(2)} MB/s`);
  console.log(`  Stats:`);
  console.log(`    SNPs: ${stats.snps}`);
  console.log(`    Insertions: ${stats.insertions}`);
  console.log(`    Deletions: ${stats.deletions}`);
  console.log(`    Passed filter: ${stats.passedFilter}`);
  console.log(`    Chromosomes: ${stats.chromosomes.length}`);

  return {
    file: filePath,
    fileSize,
    records: stats.totalRecords,
    avgTime,
    minTime,
    maxTime,
    throughput,
    stats
  };
}

/**
 * Run all benchmarks
 */
function main() {
  console.log('='.repeat(60));
  console.log('JavaScript VCF Parser Benchmark');
  console.log('='.repeat(60));

  const dataDir = join(__dirname, 'data');
  let files;
  
  try {
    files = readdirSync(dataDir)
      .filter(f => f.endsWith('.vcf'))
      .map(f => join(dataDir, f))
      .sort((a, b) => statSync(a).size - statSync(b).size);
  } catch (e) {
    console.log('\nNo test data found. Run `npm run generate` first.');
    console.log('Example: node generate-test-data.js\n');
    
    // Generate sample data inline
    console.log('Generating sample data inline...\n');
    const sampleVcf = `##fileformat=VCFv4.2
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE1
chr1\t100\trs123\tA\tG\t30\tPASS\tDP=50\tGT\t0/1
chr1\t200\t.\tAT\tA\t40\tPASS\tDP=60\tGT\t1/1
chr2\t300\trs456\tC\tT,G\t50\tq10\tDP=70\tGT\t0/1`;

    const iterations = 1000;
    console.log(`Running ${iterations} iterations on inline sample...`);
    
    const times = [];
    let result;
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      result = parseVcf(sampleVcf, { skipInvalid: true });
      times.push(performance.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`\nResults:`);
    console.log(`  Records: ${result.records.length}`);
    console.log(`  Average parse time: ${formatTime(avgTime)}`);
    console.log(`  Ops/sec: ${Math.floor(1000 / avgTime)}`);
    
    return;
  }

  if (files.length === 0) {
    console.log('\nNo VCF files found in data directory.');
    console.log('Run `npm run generate` to create test files.\n');
    return;
  }

  const results = [];
  
  for (const file of files) {
    results.push(benchmarkFile(file));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log('\n| File | Size | Records | Avg Time | Throughput |');
  console.log('|------|------|---------|----------|------------|');
  
  for (const r of results) {
    const name = r.file.split('/').pop();
    console.log(`| ${name} | ${formatBytes(r.fileSize)} | ${r.records} | ${formatTime(r.avgTime)} | ${r.throughput.toFixed(2)} MB/s |`);
  }

  // Performance characteristics
  if (results.length >= 2) {
    const scaling = results[results.length - 1].avgTime / results[0].avgTime;
    const sizeRatio = results[results.length - 1].records / results[0].records;
    console.log(`\nScaling factor: ${scaling.toFixed(2)}x time for ${sizeRatio}x records`);
    console.log(`Linear scaling would be: ${sizeRatio.toFixed(2)}x`);
    console.log(`Efficiency: ${((sizeRatio / scaling) * 100).toFixed(1)}%`);
  }
}

main();
