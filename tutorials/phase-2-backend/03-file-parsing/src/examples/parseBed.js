/**
 * Example: Parse BED file
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parseBed, findOverlaps, mergeRegions } from '../parsers/bedParser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  BED Parser Example');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const bedPath = join(__dirname, '../../data/sample.bed');
  
  // Parse BED file
  console.log('📄 Parsing BED file...\n');
  const bedData = await parseBed(bedPath);
  
  // Display basic info
  console.log('File Information:');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Format: ${bedData.format}`);
  console.log(`  Total regions: ${bedData.regions.length}`);
  console.log(`  Chromosomes: ${Object.keys(bedData.byChromosome).join(', ')}`);
  
  // Regions by chromosome
  console.log('\nRegions by Chromosome:');
  console.log('───────────────────────────────────────────────────────────');
  for (const [chrom, regions] of Object.entries(bedData.byChromosome)) {
    console.log(`  ${chrom}: ${regions.length} regions`);
  }
  
  // Display regions
  console.log('\nRegion Details:');
  console.log('───────────────────────────────────────────────────────────');
  
  for (const region of bedData.regions.slice(0, 15)) {
    const strand = region.strand ? ` (${region.strand})` : '';
    const score = region.score ? ` score=${region.score}` : '';
    console.log(`  ${region.chromosome}:${region.start + 1}-${region.end}${strand}`);
    console.log(`    Name: ${region.name || 'N/A'}${score}`);
    console.log(`    Length: ${region.length} bp`);
  }
  
  if (bedData.regions.length > 15) {
    console.log(`  ... and ${bedData.regions.length - 15} more regions`);
  }
  
  // Find overlapping regions example
  console.log('\n\nFind Overlapping Regions (TP53 exon7 region):');
  console.log('───────────────────────────────────────────────────────────');
  
  const query = { chromosome: 'chr17', start: 7673699, end: 7673840 };
  const overlaps = findOverlaps(bedData, query);
  
  console.log(`  Query: ${query.chromosome}:${query.start}-${query.end}`);
  console.log(`  Found ${overlaps.length} overlapping regions:`);
  
  for (const region of overlaps) {
    console.log(`    - ${region.name}: ${region.start + 1}-${region.end}`);
  }
  
  // Merge overlapping regions example
  console.log('\n\nMerge Overlapping Regions (chr17):');
  console.log('───────────────────────────────────────────────────────────');
  
  const chr17Regions = bedData.byChromosome['chr17'] || [];
  const merged = mergeRegions(chr17Regions);
  
  console.log(`  Original: ${chr17Regions.length} regions`);
  console.log(`  Merged: ${merged.length} regions`);
  
  // Summary
  console.log('\n\nSummary Statistics:');
  console.log('───────────────────────────────────────────────────────────');
  
  const totalBp = bedData.regions.reduce((sum, r) => sum + r.length, 0);
  const avgLength = Math.round(totalBp / bedData.regions.length);
  const scores = bedData.regions.filter(r => r.score !== null).map(r => r.score);
  
  console.log(`  Total coverage: ${totalBp.toLocaleString()} bp`);
  console.log(`  Average region size: ${avgLength} bp`);
  
  if (scores.length > 0) {
    console.log(`  Score range: ${Math.min(...scores)} - ${Math.max(...scores)}`);
  }
  
  // Count by type (from name)
  const byType = bedData.regions.reduce((acc, r) => {
    if (r.name) {
      const type = r.name.includes('exon') ? 'exon' : 
                   r.name.includes('domain') ? 'domain' : 'hotspot';
      acc[type] = (acc[type] || 0) + 1;
    }
    return acc;
  }, {});
  
  console.log(`  Region types:`, byType);
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
