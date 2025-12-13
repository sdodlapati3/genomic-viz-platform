/**
 * Expression Analysis Example
 * Demonstrates differential expression and correlation analysis
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import jsStats from '../services/jsStats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', '..', 'data');

async function expressionAnalysisExample() {
  console.log(`
═══════════════════════════════════════════════════════════
  Expression Analysis Example
═══════════════════════════════════════════════════════════
`);

  // Load expression data (skip comment lines starting with #)
  const csvContent = await fs.readFile(join(DATA_DIR, 'expression_data.csv'), 'utf-8');
  const lines = csvContent.trim().split('\n').filter(line => line.trim() && !line.startsWith('#'));
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = h === 'sample_id' || h === 'condition' 
        ? values[i]?.trim() 
        : parseFloat(values[i]);
    });
    return obj;
  });

  console.log('📊 Data Summary:');
  console.log('─'.repeat(60));
  console.log(`  Total samples: ${data.length}`);
  console.log(`  Tumor samples: ${data.filter(d => d.condition === 'tumor').length}`);
  console.log(`  Normal samples: ${data.filter(d => d.condition === 'normal').length}`);
  
  const genes = headers.filter(h => h !== 'sample_id' && h !== 'condition');
  console.log(`  Genes analyzed: ${genes.join(', ')}`);

  // Differential Expression Analysis
  console.log('\n📍 Differential Expression Analysis:');
  console.log('─'.repeat(60));
  
  const deResult = jsStats.differentialExpression(data);
  
  console.log('\n  Results (sorted by adjusted p-value):');
  console.log('  ┌──────────┬──────────┬──────────┬──────────┬──────────┬───────────┐');
  console.log('  │   Gene   │  Tumor   │  Normal  │  Log2FC  │  Adj.P   │   Status  │');
  console.log('  ├──────────┼──────────┼──────────┼──────────┼──────────┼───────────┤');
  
  for (const r of deResult.results) {
    const status = r.significant 
      ? (r.direction === 'up' ? '↑ UP' : '↓ DOWN')
      : '  NS';
    console.log(`  │ ${r.gene.padEnd(8)} │ ${r.tumor_mean.toFixed(2).padStart(8)} │ ${r.normal_mean.toFixed(2).padStart(8)} │ ${r.log2_fold_change.toFixed(2).padStart(8)} │ ${r.adjusted_pvalue.toFixed(4).padStart(8)} │ ${status.padStart(9)} │`);
  }
  console.log('  └──────────┴──────────┴──────────┴──────────┴──────────┴───────────┘');
  
  console.log(`\n  Summary:`);
  console.log(`    Total genes: ${deResult.n_genes}`);
  console.log(`    Significant: ${deResult.n_significant}`);
  console.log(`    Up-regulated: ${deResult.results.filter(r => r.significant && r.direction === 'up').length}`);
  console.log(`    Down-regulated: ${deResult.results.filter(r => r.significant && r.direction === 'down').length}`);

  // Volcano Plot Data
  console.log('\n📍 Volcano Plot Categories:');
  console.log('─'.repeat(60));
  
  const volcano = deResult.results.map(r => ({
    ...r,
    neg_log10_pvalue: -Math.log10(r.adjusted_pvalue),
    category: !r.significant ? 'not_significant' :
              r.log2_fold_change > 0.5 ? 'up_regulated' :
              r.log2_fold_change < -0.5 ? 'down_regulated' : 'not_significant'
  }));
  
  for (const r of volcano) {
    const marker = r.category === 'up_regulated' ? '🔴' :
                   r.category === 'down_regulated' ? '🔵' : '⚪';
    console.log(`  ${marker} ${r.gene}: log2FC=${r.log2_fold_change.toFixed(2)}, -log10(p)=${r.neg_log10_pvalue.toFixed(2)}`);
  }

  // Gene Correlation Analysis
  console.log('\n📍 Gene Correlation Analysis:');
  console.log('─'.repeat(60));
  
  const correlations = [];
  for (let i = 0; i < genes.length - 1; i++) {
    for (let j = i + 1; j < genes.length; j++) {
      const x = data.map(d => d[genes[i]]);
      const y = data.map(d => d[genes[j]]);
      correlations.push({
        gene1: genes[i],
        gene2: genes[j],
        correlation: jsStats.correlation(x, y)
      });
    }
  }
  
  // Sort by absolute correlation
  correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  
  console.log('\n  Top 10 Gene Correlations:');
  console.log('  ┌──────────┬──────────┬────────────┬──────────────────┐');
  console.log('  │  Gene 1  │  Gene 2  │    Corr    │   Relationship   │');
  console.log('  ├──────────┼──────────┼────────────┼──────────────────┤');
  
  for (const c of correlations.slice(0, 10)) {
    const rel = c.correlation > 0.7 ? 'Strong positive' :
                c.correlation > 0.3 ? 'Moderate positive' :
                c.correlation < -0.7 ? 'Strong negative' :
                c.correlation < -0.3 ? 'Moderate negative' : 'Weak';
    console.log(`  │ ${c.gene1.padEnd(8)} │ ${c.gene2.padEnd(8)} │ ${c.correlation.toFixed(3).padStart(10)} │ ${rel.padEnd(16)} │`);
  }
  console.log('  └──────────┴──────────┴────────────┴──────────────────┘');

  console.log(`
═══════════════════════════════════════════════════════════
  Analysis Complete
═══════════════════════════════════════════════════════════
`);
}

expressionAnalysisExample();
