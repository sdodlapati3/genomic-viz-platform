/**
 * Mutation Analysis Example
 * Demonstrates mutation enrichment and pattern analysis
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import jsStats from '../services/jsStats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', '..', 'data');

async function mutationAnalysisExample() {
  console.log(`
═══════════════════════════════════════════════════════════
  Mutation Analysis Example
═══════════════════════════════════════════════════════════
`);

  // Load mutation frequency data (skip comment lines)
  const csvContent = await fs.readFile(join(DATA_DIR, 'mutation_frequency.csv'), 'utf-8');
  const lines = csvContent.trim().split('\n').filter(line => line.trim() && !line.startsWith('#'));
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = h === 'gene' ? values[i].trim() : parseInt(values[i]);
    });
    return obj;
  });

  const cancerTypes = ['breast', 'lung', 'colon', 'ovarian', 'pancreatic', 'melanoma'];

  console.log('📊 Data Summary:');
  console.log('─'.repeat(60));
  console.log(`  Genes analyzed: ${data.length}`);
  console.log(`  Cancer types: ${cancerTypes.join(', ')}`);

  // Mutation Enrichment Analysis
  console.log('\n📍 Mutation Enrichment by Cancer Type:');
  console.log('─'.repeat(60));
  
  for (const row of data.slice(0, 5)) {
    const observed = cancerTypes.map(ct => row[ct]);
    const total = row.total_samples;
    const expected = cancerTypes.map(() => total / cancerTypes.length);
    
    const chiResult = jsStats.chiSquareTest(observed, expected);
    
    // Find enriched types
    const enriched = cancerTypes.filter((ct, i) => observed[i] / expected[i] > 1.5);
    
    console.log(`\n  ${row.gene}:`);
    console.log(`    Total mutations: ${observed.reduce((a, b) => a + b, 0)}`);
    console.log(`    Chi-square: ${chiResult.statistic.toFixed(2)}, p-value: ${chiResult.pvalue.toExponential(2)}`);
    console.log(`    Enriched in: ${enriched.length > 0 ? enriched.join(', ') : 'none'}`);
    
    // Show breakdown
    console.log('    Breakdown:');
    cancerTypes.forEach((ct, i) => {
      const ratio = (observed[i] / expected[i]).toFixed(2);
      const bar = '█'.repeat(Math.min(Math.round(observed[i] / 20), 20));
      const marker = ratio > 1.5 ? '↑' : ratio < 0.5 ? '↓' : ' ';
      console.log(`      ${ct.padEnd(11)}: ${observed[i].toString().padStart(3)} ${bar} ${marker}`);
    });
  }

  // Mutation Pattern Heatmap Data
  console.log('\n📍 Mutation Frequency Heatmap:');
  console.log('─'.repeat(60));
  console.log('\n  Mutation frequency (per 1000 samples):');
  console.log('  ' + ''.padStart(10) + cancerTypes.map(ct => ct.slice(0, 6).padStart(8)).join(''));
  console.log('  ' + '─'.repeat(10 + cancerTypes.length * 8));
  
  for (const row of data) {
    const values = cancerTypes.map(ct => {
      const freq = (row[ct] / row.total_samples * 1000).toFixed(0);
      return freq.padStart(8);
    });
    console.log(`  ${row.gene.padEnd(10)}${values.join('')}`);
  }

  // Mutual Exclusivity Analysis
  console.log('\n📍 Mutual Exclusivity / Co-occurrence Analysis:');
  console.log('─'.repeat(60));
  
  const genes = data.map(d => d.gene);
  const pairs = [];
  
  for (let i = 0; i < genes.length - 1; i++) {
    for (let j = i + 1; j < genes.length; j++) {
      const x = cancerTypes.map(ct => data[i][ct]);
      const y = cancerTypes.map(ct => data[j][ct]);
      const cor = jsStats.correlation(x, y);
      
      pairs.push({
        gene1: genes[i],
        gene2: genes[j],
        correlation: cor,
        relationship: cor < -0.3 ? 'Mutually exclusive' :
                     cor > 0.3 ? 'Co-occurring' : 'Independent'
      });
    }
  }
  
  // Sort by absolute correlation
  pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  
  console.log('\n  Top Gene Pairs by Correlation:');
  console.log('  ┌──────────┬──────────┬────────────┬───────────────────────┐');
  console.log('  │  Gene 1  │  Gene 2  │    Corr    │     Relationship      │');
  console.log('  ├──────────┼──────────┼────────────┼───────────────────────┤');
  
  for (const p of pairs.slice(0, 10)) {
    const marker = p.correlation > 0 ? '🟢' : '🔴';
    console.log(`  │ ${p.gene1.padEnd(8)} │ ${p.gene2.padEnd(8)} │ ${p.correlation.toFixed(3).padStart(10)} │ ${marker} ${p.relationship.padEnd(19)} │`);
  }
  console.log('  └──────────┴──────────┴────────────┴───────────────────────┘');

  // Cancer Type Clustering
  console.log('\n📍 Cancer Type Similarity (by mutation profile):');
  console.log('─'.repeat(60));
  
  // Calculate distance between cancer types
  const cancerPairs = [];
  for (let i = 0; i < cancerTypes.length - 1; i++) {
    for (let j = i + 1; j < cancerTypes.length; j++) {
      const x = data.map(d => d[cancerTypes[i]] / d.total_samples);
      const y = data.map(d => d[cancerTypes[j]] / d.total_samples);
      const cor = jsStats.correlation(x, y);
      
      cancerPairs.push({
        cancer1: cancerTypes[i],
        cancer2: cancerTypes[j],
        similarity: cor
      });
    }
  }
  
  cancerPairs.sort((a, b) => b.similarity - a.similarity);
  
  console.log('\n  Most Similar Cancer Types:');
  for (const p of cancerPairs.slice(0, 5)) {
    const bar = '█'.repeat(Math.round((p.similarity + 1) * 10));
    console.log(`    ${p.cancer1} ↔ ${p.cancer2}: ${p.similarity.toFixed(3)} ${bar}`);
  }

  console.log(`
═══════════════════════════════════════════════════════════
  Analysis Complete
═══════════════════════════════════════════════════════════
`);
}

mutationAnalysisExample();
