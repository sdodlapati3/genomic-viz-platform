/**
 * Survival Analysis Example
 * Demonstrates Kaplan-Meier and survival statistics
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import jsStats from '../services/jsStats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', '..', 'data');

async function survivalAnalysisExample() {
  console.log(`
═══════════════════════════════════════════════════════════
  Survival Analysis Example
═══════════════════════════════════════════════════════════
`);

  // Load survival data
  const csvContent = await fs.readFile(join(DATA_DIR, 'survival_data.csv'), 'utf-8');
  // Filter out comment lines starting with # and empty lines
  const lines = csvContent.trim().split('\n').filter(line => line.trim() && !line.startsWith('#'));
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i]?.trim());
    return obj;
  });

  console.log('📊 Data Summary:');
  console.log('─'.repeat(60));
  console.log(`  Total samples: ${data.length}`);
  console.log(`  Genes: ${[...new Set(data.map(d => d.gene))].join(', ')}`);
  
  // Analyze by gene
  for (const gene of ['TP53', 'KRAS']) {
    console.log(`\n📍 ${gene} Mutation Survival Analysis:`);
    console.log('─'.repeat(60));
    
    const geneData = data.filter(d => d.gene === gene);
    const mutated = geneData.filter(d => d.mutation_status === 'mutated');
    const wildtype = geneData.filter(d => d.mutation_status === 'wildtype');
    
    console.log(`  Mutated: ${mutated.length} samples`);
    console.log(`  Wildtype: ${wildtype.length} samples`);
    
    // Calculate survival statistics
    const mutTimes = mutated.map(d => parseFloat(d.survival_months));
    const mutEvents = mutated.map(d => parseInt(d.event));
    const wtTimes = wildtype.map(d => parseFloat(d.survival_months));
    const wtEvents = wildtype.map(d => parseInt(d.event));
    
    // Kaplan-Meier curves
    const mutKM = jsStats.kaplanMeier(mutTimes, mutEvents);
    const wtKM = jsStats.kaplanMeier(wtTimes, wtEvents);
    
    console.log('\n  Kaplan-Meier Survival Estimates:');
    console.log('  ┌────────────┬─────────────────┬─────────────────┐');
    console.log('  │    Time    │    Mutated      │    Wildtype     │');
    console.log('  ├────────────┼─────────────────┼─────────────────┤');
    
    const timePoints = [0, 12, 24, 36, 48, 60];
    for (const t of timePoints) {
      const mutSurv = mutKM.filter(p => p.time <= t).pop()?.survival || 1;
      const wtSurv = wtKM.filter(p => p.time <= t).pop()?.survival || 1;
      console.log(`  │ ${t.toString().padStart(6)} mo │    ${(mutSurv * 100).toFixed(1).padStart(5)}%      │    ${(wtSurv * 100).toFixed(1).padStart(5)}%      │`);
    }
    console.log('  └────────────┴─────────────────┴─────────────────┘');
    
    // Log-rank test
    const logRank = jsStats.logRankTest(mutTimes, mutEvents, wtTimes, wtEvents);
    console.log(`\n  Log-rank Test:`);
    console.log(`    Chi-square: ${logRank.chiSquare.toFixed(2)}`);
    console.log(`    P-value: ${logRank.pvalue.toFixed(4)}`);
    console.log(`    Significant: ${logRank.pvalue < 0.05 ? 'Yes ✓' : 'No'}`);
    
    // Median survival
    const medianMut = mutTimes.sort((a, b) => a - b)[Math.floor(mutTimes.length / 2)];
    const medianWt = wtTimes.sort((a, b) => a - b)[Math.floor(wtTimes.length / 2)];
    console.log(`\n  Median Survival:`);
    console.log(`    Mutated: ${medianMut} months`);
    console.log(`    Wildtype: ${medianWt} months`);
  }

  console.log(`
═══════════════════════════════════════════════════════════
  Analysis Complete
═══════════════════════════════════════════════════════════
`);
}

survivalAnalysisExample();
