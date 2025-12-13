/**
 * Example: Parse VCF file
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parseVcf, variantToVisualization } from '../parsers/vcfParser.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  VCF Parser Example');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const vcfPath = join(__dirname, '../../data/sample.vcf');
  
  // Parse VCF file
  console.log('📄 Parsing VCF file...\n');
  const vcfData = await parseVcf(vcfPath);
  
  // Display header info
  console.log('Header Information:');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Format: ${vcfData.header.fileformat}`);
  console.log(`  Samples: ${vcfData.header.samples.join(', ')}`);
  console.log(`  INFO fields: ${Object.keys(vcfData.header.info).join(', ')}`);
  console.log(`  Contigs: ${Object.keys(vcfData.header.contig).join(', ')}`);
  
  // Display variants
  console.log('\nVariants:');
  console.log('───────────────────────────────────────────────────────────');
  
  for (const variant of vcfData.variants) {
    const viz = variantToVisualization(variant);
    console.log(`  ${viz.chromosome}:${viz.position} ${viz.ref}>${viz.alt}`);
    console.log(`    Gene: ${viz.gene || 'N/A'}`);
    console.log(`    AA Change: ${viz.aaChange || 'N/A'}`);
    console.log(`    Impact: ${viz.impact || 'N/A'}`);
    console.log(`    Type: ${viz.type}`);
    
    if (variant.samples) {
      const sampleGTs = Object.entries(variant.samples)
        .map(([name, data]) => `${name}:${data.genotype}`)
        .join(', ');
      console.log(`    Samples: ${sampleGTs}`);
    }
    console.log();
  }
  
  // Summary statistics
  console.log('Summary:');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Total variants: ${vcfData.variants.length}`);
  
  const snps = vcfData.variants.filter(v => v.isSnp).length;
  const indels = vcfData.variants.filter(v => v.isIndel).length;
  console.log(`  SNPs: ${snps}`);
  console.log(`  Indels: ${indels}`);
  
  const byGene = vcfData.variants.reduce((acc, v) => {
    const gene = v.info.GENE || 'Unknown';
    acc[gene] = (acc[gene] || 0) + 1;
    return acc;
  }, {});
  console.log(`  By Gene:`, byGene);
  
  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
