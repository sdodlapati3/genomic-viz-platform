/**
 * Generate Test VCF Data
 * 
 * Creates sample VCF files of various sizes for benchmarking
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Chromosome names
const CHROMOSOMES = [
  'chr1', 'chr2', 'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8', 'chr9', 'chr10',
  'chr11', 'chr12', 'chr13', 'chr14', 'chr15', 'chr16', 'chr17', 'chr18', 'chr19',
  'chr20', 'chr21', 'chr22', 'chrX', 'chrY'
];

const BASES = ['A', 'C', 'G', 'T'];
const FILTERS = ['PASS', 'q10', 'LowQual', 'PASS', 'PASS', 'PASS']; // Mostly PASS

/**
 * Generate VCF header
 */
function generateHeader(sampleCount) {
  const samples = Array.from({ length: sampleCount }, (_, i) => `SAMPLE_${i + 1}`);
  
  return `##fileformat=VCFv4.2
##fileDate=${new Date().toISOString().split('T')[0].replace(/-/g, '')}
##source=VcfBenchmarkGenerator
##reference=GRCh38
##contig=<ID=chr1,length=248956422>
##contig=<ID=chr2,length=242193529>
##contig=<ID=chr3,length=198295559>
##contig=<ID=chr4,length=190214555>
##contig=<ID=chr5,length=181538259>
##contig=<ID=chr6,length=170805979>
##contig=<ID=chr7,length=159345973>
##contig=<ID=chr8,length=145138636>
##contig=<ID=chr9,length=138394717>
##contig=<ID=chr10,length=133797422>
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
##INFO=<ID=AF,Number=A,Type=Float,Description="Allele Frequency">
##INFO=<ID=AC,Number=A,Type=Integer,Description="Allele Count">
##INFO=<ID=AN,Number=1,Type=Integer,Description="Total Alleles">
##INFO=<ID=MQ,Number=1,Type=Float,Description="Mapping Quality">
##INFO=<ID=FS,Number=1,Type=Float,Description="Fisher Strand">
##INFO=<ID=SOR,Number=1,Type=Float,Description="Strand Odds Ratio">
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene Symbol">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
##FORMAT=<ID=DP,Number=1,Type=Integer,Description="Read Depth">
##FORMAT=<ID=GQ,Number=1,Type=Integer,Description="Genotype Quality">
##FORMAT=<ID=AD,Number=R,Type=Integer,Description="Allelic Depths">
##FILTER=<ID=q10,Description="Quality below 10">
##FILTER=<ID=LowQual,Description="Low quality">
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\t${samples.join('\t')}`;
}

/**
 * Generate a random variant
 */
function generateVariant(sampleCount) {
  const chrom = CHROMOSOMES[Math.floor(Math.random() * CHROMOSOMES.length)];
  const pos = Math.floor(Math.random() * 100000000) + 1;
  
  // 70% SNPs, 15% insertions, 15% deletions
  const variantType = Math.random();
  let ref, alt;
  
  if (variantType < 0.7) {
    // SNP
    ref = BASES[Math.floor(Math.random() * 4)];
    alt = BASES.filter(b => b !== ref)[Math.floor(Math.random() * 3)];
  } else if (variantType < 0.85) {
    // Insertion
    ref = BASES[Math.floor(Math.random() * 4)];
    const insertLen = Math.floor(Math.random() * 10) + 1;
    alt = ref + Array.from({ length: insertLen }, () => 
      BASES[Math.floor(Math.random() * 4)]
    ).join('');
  } else {
    // Deletion
    const delLen = Math.floor(Math.random() * 10) + 2;
    ref = Array.from({ length: delLen }, () => 
      BASES[Math.floor(Math.random() * 4)]
    ).join('');
    alt = ref[0];
  }

  // Sometimes multi-allelic
  if (Math.random() < 0.1) {
    const alt2 = BASES.filter(b => b !== ref && b !== alt)[0];
    alt = `${alt},${alt2}`;
  }

  const id = Math.random() < 0.3 ? `rs${Math.floor(Math.random() * 1000000000)}` : '.';
  const qual = Math.floor(Math.random() * 100) + 1;
  const filter = FILTERS[Math.floor(Math.random() * FILTERS.length)];

  // Generate INFO
  const dp = Math.floor(Math.random() * 200) + 10;
  const af = (Math.random() * 0.5).toFixed(4);
  const mq = (Math.random() * 60 + 20).toFixed(2);
  const genes = ['TP53', 'BRCA1', 'BRCA2', 'EGFR', 'KRAS', 'BRAF', 'PIK3CA'];
  const gene = genes[Math.floor(Math.random() * genes.length)];
  
  const info = `DP=${dp};AF=${af};MQ=${mq};GENE=${gene}`;

  // Generate samples
  const genotypes = ['0/0', '0/1', '1/1', '0/0', '0/0', '0/1']; // Mostly ref/het
  const samples = Array.from({ length: sampleCount }, () => {
    const gt = genotypes[Math.floor(Math.random() * genotypes.length)];
    const sdp = Math.floor(Math.random() * 100) + 5;
    const gq = Math.floor(Math.random() * 99) + 1;
    return `${gt}:${sdp}:${gq}`;
  });

  return `${chrom}\t${pos}\t${id}\t${ref}\t${alt}\t${qual}\t${filter}\t${info}\tGT:DP:GQ\t${samples.join('\t')}`;
}

/**
 * Generate VCF file with specified number of records
 */
function generateVcf(recordCount, sampleCount = 10) {
  const lines = [generateHeader(sampleCount)];
  
  // Generate records
  const variants = [];
  for (let i = 0; i < recordCount; i++) {
    variants.push(generateVariant(sampleCount));
    
    // Progress indicator for large files
    if ((i + 1) % 10000 === 0) {
      console.log(`Generated ${i + 1}/${recordCount} variants...`);
    }
  }
  
  // Sort by chromosome and position
  variants.sort((a, b) => {
    const [chromA, posA] = a.split('\t');
    const [chromB, posB] = b.split('\t');
    const chromCompare = chromA.localeCompare(chromB);
    if (chromCompare !== 0) return chromCompare;
    return parseInt(posA) - parseInt(posB);
  });

  return lines.concat(variants).join('\n');
}

/**
 * Generate test files
 */
function main() {
  const dataDir = join(__dirname, 'data');
  
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const sizes = [
    { name: 'tiny', records: 100, samples: 2 },
    { name: 'small', records: 1000, samples: 5 },
    { name: 'medium', records: 10000, samples: 10 },
    { name: 'large', records: 100000, samples: 20 },
  ];

  for (const { name, records, samples } of sizes) {
    console.log(`\nGenerating ${name}.vcf (${records} records, ${samples} samples)...`);
    const content = generateVcf(records, samples);
    const path = join(dataDir, `${name}.vcf`);
    writeFileSync(path, content);
    
    const sizeKB = (content.length / 1024).toFixed(2);
    const sizeMB = (content.length / 1024 / 1024).toFixed(2);
    console.log(`  Wrote ${path} (${sizeMB} MB / ${sizeKB} KB)`);
  }

  console.log('\nTest data generation complete!');
}

main();
