/**
 * Benchmark Comparison: JavaScript vs Rust (WASM) VCF Parser
 * 
 * This benchmark compares parsing performance between:
 * 1. Pure JavaScript implementation
 * 2. Rust compiled to WebAssembly
 * 
 * Run after building WASM with: wasm-pack build --target web
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Import JavaScript parser
import { parseVcf as parseVcfJs, calculateStats } from './js-vcf-parser.js';

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
 * Calculate statistics
 */
function calcStats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  
  return {
    avg: sum / times.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)]
  };
}

/**
 * Benchmark JavaScript parser
 */
function benchmarkJs(content, iterations = 10) {
  // Warmup
  parseVcfJs(content, { skipInvalid: true });
  
  const times = [];
  let result;
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = parseVcfJs(content, { skipInvalid: true });
    times.push(performance.now() - start);
  }
  
  return {
    times,
    stats: calcStats(times),
    records: result.records.length
  };
}

/**
 * Benchmark WASM parser (if available)
 */
async function benchmarkWasm(content, iterations = 10) {
  const wasmPath = join(__dirname, '..', 'wasm', 'pkg');
  
  if (!existsSync(wasmPath)) {
    return null;
  }

  try {
    const wasm = await import(join(wasmPath, 'vcf_parser_wasm.js'));
    await wasm.default();
    
    // Warmup
    wasm.parseVcf(content);
    
    const times = [];
    let result;
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      result = wasm.parseVcf(content);
      times.push(performance.now() - start);
    }
    
    return {
      times,
      stats: calcStats(times),
      records: result.records.length
    };
  } catch (e) {
    console.log(`WASM not available: ${e.message}`);
    return null;
  }
}

/**
 * Compare benchmark results
 */
function compareResults(jsResult, wasmResult, fileSize) {
  const jsThroughput = (fileSize / 1024 / 1024) / (jsResult.stats.avg / 1000);
  
  console.log('\n  JavaScript:');
  console.log(`    Average: ${formatTime(jsResult.stats.avg)}`);
  console.log(`    Min: ${formatTime(jsResult.stats.min)}`);
  console.log(`    Max: ${formatTime(jsResult.stats.max)}`);
  console.log(`    Median: ${formatTime(jsResult.stats.median)}`);
  console.log(`    Throughput: ${jsThroughput.toFixed(2)} MB/s`);
  
  if (wasmResult) {
    const wasmThroughput = (fileSize / 1024 / 1024) / (wasmResult.stats.avg / 1000);
    const speedup = jsResult.stats.avg / wasmResult.stats.avg;
    
    console.log('\n  Rust (WASM):');
    console.log(`    Average: ${formatTime(wasmResult.stats.avg)}`);
    console.log(`    Min: ${formatTime(wasmResult.stats.min)}`);
    console.log(`    Max: ${formatTime(wasmResult.stats.max)}`);
    console.log(`    Median: ${formatTime(wasmResult.stats.median)}`);
    console.log(`    Throughput: ${wasmThroughput.toFixed(2)} MB/s`);
    
    console.log('\n  Comparison:');
    console.log(`    Speedup: ${speedup.toFixed(2)}x faster`);
    console.log(`    Throughput improvement: ${(wasmThroughput / jsThroughput * 100 - 100).toFixed(1)}%`);
    
    return { speedup, jsThroughput, wasmThroughput };
  }
  
  return { speedup: null, jsThroughput, wasmThroughput: null };
}

/**
 * Run benchmarks
 */
async function main() {
  console.log('='.repeat(70));
  console.log('VCF Parser Benchmark: JavaScript vs Rust (WASM)');
  console.log('='.repeat(70));

  const dataDir = join(__dirname, 'data');
  let files = [];
  
  try {
    files = readdirSync(dataDir)
      .filter(f => f.endsWith('.vcf'))
      .map(f => join(dataDir, f))
      .sort((a, b) => statSync(a).size - statSync(b).size);
  } catch (e) {
    // No data files
  }

  // If no data files, create inline test
  if (files.length === 0) {
    console.log('\nNo test data found. Running with inline sample...');
    console.log('Run `npm run generate` to create larger test files.\n');
    
    const sampleVcf = generateSampleVcf(1000);
    const fileSize = Buffer.byteLength(sampleVcf, 'utf8');
    
    console.log(`Sample: ${formatBytes(fileSize)}`);
    
    const jsResult = benchmarkJs(sampleVcf, 20);
    const wasmResult = await benchmarkWasm(sampleVcf, 20);
    
    compareResults(jsResult, wasmResult, fileSize);
    return;
  }

  const allResults = [];
  
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const fileSize = statSync(file).size;
    const fileName = file.split('/').pop();
    
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`File: ${fileName} (${formatBytes(fileSize)})`);
    console.log('─'.repeat(70));
    
    const jsResult = benchmarkJs(content);
    const wasmResult = await benchmarkWasm(content);
    
    const comparison = compareResults(jsResult, wasmResult, fileSize);
    
    allResults.push({
      file: fileName,
      fileSize,
      records: jsResult.records,
      ...comparison
    });
  }

  // Summary table
  console.log('\n' + '='.repeat(70));
  console.log('Summary');
  console.log('='.repeat(70));
  console.log('\n| File | Size | Records | JS | WASM | Speedup |');
  console.log('|------|------|---------|-------|-------|---------|');
  
  for (const r of allResults) {
    const wasmStr = r.wasmThroughput ? `${r.wasmThroughput.toFixed(1)} MB/s` : 'N/A';
    const speedupStr = r.speedup ? `${r.speedup.toFixed(1)}x` : 'N/A';
    console.log(`| ${r.file} | ${formatBytes(r.fileSize)} | ${r.records} | ${r.jsThroughput.toFixed(1)} MB/s | ${wasmStr} | ${speedupStr} |`);
  }

  // Average speedup
  const speedups = allResults.filter(r => r.speedup).map(r => r.speedup);
  if (speedups.length > 0) {
    const avgSpeedup = speedups.reduce((a, b) => a + b, 0) / speedups.length;
    console.log(`\nAverage speedup: ${avgSpeedup.toFixed(2)}x`);
  }
  
  // Build instructions
  const wasmPkg = join(__dirname, '..', 'wasm', 'pkg');
  if (!existsSync(wasmPkg)) {
    console.log('\n' + '─'.repeat(70));
    console.log('To enable WASM benchmarks, build the Rust parser:');
    console.log('');
    console.log('  cd ../wasm');
    console.log('  wasm-pack build --target web');
    console.log('─'.repeat(70));
  }
}

/**
 * Generate sample VCF content
 */
function generateSampleVcf(numRecords) {
  const header = `##fileformat=VCFv4.2
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE1\tSAMPLE2`;

  const bases = ['A', 'C', 'G', 'T'];
  const lines = [header];

  for (let i = 0; i < numRecords; i++) {
    const chrom = `chr${(i % 22) + 1}`;
    const pos = (i + 1) * 100;
    const ref = bases[i % 4];
    const alt = bases[(i + 1) % 4];
    lines.push(`${chrom}\t${pos}\t.\t${ref}\t${alt}\t30\tPASS\tDP=50\tGT\t0/1\t1/1`);
  }

  return lines.join('\n');
}

main().catch(console.error);
