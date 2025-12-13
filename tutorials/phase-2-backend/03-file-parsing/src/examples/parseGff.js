/**
 * Example: Parse GFF3 file
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parseGff, extractGenes } from '../parsers/gffParser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  GFF3 Parser Example');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const gffPath = join(__dirname, '../../data/sample.gff3');
  
  // Parse GFF file
  console.log('📄 Parsing GFF3 file...\n');
  const gffData = await parseGff(gffPath);
  
  // Display basic info
  console.log('File Information:');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Version: GFF${gffData.version || '3'}`);
  console.log(`  Total features: ${gffData.features.length}`);
  console.log(`  Sequence regions: ${gffData.sequenceRegions.length}`);
  
  // Features by type
  console.log('\nFeatures by Type:');
  console.log('───────────────────────────────────────────────────────────');
  for (const [type, features] of Object.entries(gffData.byType)) {
    console.log(`  ${type}: ${features.length}`);
  }
  
  // Extract and display genes
  console.log('\nExtracted Genes:');
  console.log('───────────────────────────────────────────────────────────');
  
  const genes = extractGenes(gffData);
  
  for (const gene of genes) {
    console.log(`\n  📍 ${gene.symbol} (${gene.id})`);
    console.log(`     Location: ${gene.chromosome}:${gene.start}-${gene.end} (${gene.strand})`);
    console.log(`     Biotype: ${gene.biotype || 'N/A'}`);
    console.log(`     Description: ${gene.description || 'N/A'}`);
    console.log(`     Transcripts: ${gene.transcripts.length}`);
    
    for (const transcript of gene.transcripts) {
      console.log(`       └─ ${transcript.name || transcript.id}`);
      console.log(`          Exons: ${transcript.exons.length}, CDS: ${transcript.cds.length}`);
      
      if (transcript.exons.length > 0) {
        const exonRanges = transcript.exons
          .slice(0, 3)
          .map(e => `${e.start}-${e.end}`)
          .join(', ');
        console.log(`          Exon positions: ${exonRanges}${transcript.exons.length > 3 ? '...' : ''}`);
      }
    }
  }
  
  // Summary
  console.log('\n\nSummary:');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Genes: ${genes.length}`);
  console.log(`  Transcripts: ${genes.reduce((sum, g) => sum + g.transcripts.length, 0)}`);
  console.log(`  Exons: ${genes.reduce((sum, g) => sum + g.transcripts.reduce((s, t) => s + t.exons.length, 0), 0)}`);
  console.log(`  CDS: ${genes.reduce((sum, g) => sum + g.transcripts.reduce((s, t) => s + t.cds.length, 0), 0)}`);
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
