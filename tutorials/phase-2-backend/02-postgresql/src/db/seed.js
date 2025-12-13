/**
 * Database Seed Script
 * Populates the database with sample genomic data
 */

import { query, transaction, testConnection, closePool } from './connection.js';

// Sample gene data
const genes = [
  { ensembl_id: 'ENSG00000141510', symbol: 'TP53', name: 'tumor protein p53', chromosome: 'chr17', start_pos: 7668402, end_pos: 7687550, strand: '-', biotype: 'protein_coding', description: 'Tumor suppressor gene, most frequently mutated in human cancers' },
  { ensembl_id: 'ENSG00000133703', symbol: 'KRAS', name: 'KRAS proto-oncogene, GTPase', chromosome: 'chr12', start_pos: 25205246, end_pos: 25250936, strand: '-', biotype: 'protein_coding', description: 'Oncogene frequently mutated in lung, colorectal, and pancreatic cancers' },
  { ensembl_id: 'ENSG00000146648', symbol: 'EGFR', name: 'epidermal growth factor receptor', chromosome: 'chr7', start_pos: 55019017, end_pos: 55211628, strand: '+', biotype: 'protein_coding', description: 'Receptor tyrosine kinase, target for cancer therapy' },
  { ensembl_id: 'ENSG00000012048', symbol: 'BRCA1', name: 'BRCA1 DNA repair associated', chromosome: 'chr17', start_pos: 43044295, end_pos: 43170245, strand: '-', biotype: 'protein_coding', description: 'Tumor suppressor involved in DNA repair, breast cancer susceptibility' },
  { ensembl_id: 'ENSG00000139618', symbol: 'BRCA2', name: 'BRCA2 DNA repair associated', chromosome: 'chr13', start_pos: 32315086, end_pos: 32400266, strand: '+', biotype: 'protein_coding', description: 'Tumor suppressor involved in DNA repair, breast cancer susceptibility' },
  { ensembl_id: 'ENSG00000171862', symbol: 'PTEN', name: 'phosphatase and tensin homolog', chromosome: 'chr10', start_pos: 87863113, end_pos: 87971930, strand: '+', biotype: 'protein_coding', description: 'Tumor suppressor, frequently lost in many cancers' },
  { ensembl_id: 'ENSG00000181143', symbol: 'MYC', name: 'MYC proto-oncogene', chromosome: 'chr8', start_pos: 127735434, end_pos: 127742951, strand: '+', biotype: 'protein_coding', description: 'Oncogenic transcription factor, amplified in many cancers' }
];

// Protein domains
const domains = {
  'TP53': [
    { name: 'TAD1', start_pos: 1, end_pos: 40, description: 'Transactivation domain 1', color: '#e74c3c' },
    { name: 'TAD2', start_pos: 41, end_pos: 61, description: 'Transactivation domain 2', color: '#e67e22' },
    { name: 'Proline-rich', start_pos: 62, end_pos: 94, description: 'Proline-rich region', color: '#f1c40f' },
    { name: 'DNA-binding', start_pos: 95, end_pos: 289, description: 'DNA-binding domain', color: '#2ecc71' },
    { name: 'Tetramerization', start_pos: 324, end_pos: 355, description: 'Tetramerization domain', color: '#3498db' },
    { name: 'CTD', start_pos: 356, end_pos: 393, description: 'C-terminal regulatory domain', color: '#9b59b6' }
  ],
  'KRAS': [
    { name: 'P-loop', start_pos: 10, end_pos: 17, description: 'Phosphate-binding loop', color: '#e74c3c' },
    { name: 'Switch I', start_pos: 30, end_pos: 38, description: 'Effector-binding region', color: '#3498db' },
    { name: 'Switch II', start_pos: 59, end_pos: 76, description: 'Nucleotide-binding region', color: '#2ecc71' },
    { name: 'G-domain', start_pos: 1, end_pos: 166, description: 'GTPase domain', color: '#f1c40f' },
    { name: 'HVR', start_pos: 167, end_pos: 188, description: 'Hypervariable region', color: '#9b59b6' }
  ],
  'EGFR': [
    { name: 'L1', start_pos: 1, end_pos: 165, description: 'Ligand-binding domain 1', color: '#e74c3c' },
    { name: 'CR1', start_pos: 166, end_pos: 310, description: 'Cysteine-rich domain 1', color: '#e67e22' },
    { name: 'L2', start_pos: 311, end_pos: 480, description: 'Ligand-binding domain 2', color: '#f1c40f' },
    { name: 'CR2', start_pos: 481, end_pos: 620, description: 'Cysteine-rich domain 2', color: '#2ecc71' },
    { name: 'TM', start_pos: 621, end_pos: 650, description: 'Transmembrane domain', color: '#3498db' },
    { name: 'Kinase', start_pos: 690, end_pos: 960, description: 'Tyrosine kinase domain', color: '#9b59b6' }
  ]
};

// Variants data
const variants = [
  // TP53 variants
  { variant_id: 'var_001', gene_symbol: 'TP53', chromosome: 'chr17', position: 7673700, ref_allele: 'C', alt_allele: 'T', variant_type: 'missense', aa_change: 'R175H', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.0001 },
  { variant_id: 'var_002', gene_symbol: 'TP53', chromosome: 'chr17', position: 7673781, ref_allele: 'G', alt_allele: 'A', variant_type: 'missense', aa_change: 'G245S', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00005 },
  { variant_id: 'var_003', gene_symbol: 'TP53', chromosome: 'chr17', position: 7673802, ref_allele: 'G', alt_allele: 'A', variant_type: 'missense', aa_change: 'R248Q', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00008 },
  { variant_id: 'var_004', gene_symbol: 'TP53', chromosome: 'chr17', position: 7674230, ref_allele: 'G', alt_allele: 'A', variant_type: 'missense', aa_change: 'R273H', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00007 },
  { variant_id: 'var_005', gene_symbol: 'TP53', chromosome: 'chr17', position: 7674252, ref_allele: 'C', alt_allele: 'T', variant_type: 'missense', aa_change: 'R282W', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00004 },
  { variant_id: 'var_006', gene_symbol: 'TP53', chromosome: 'chr17', position: 7674872, ref_allele: 'G', alt_allele: 'T', variant_type: 'nonsense', aa_change: 'E294*', consequence: 'stop_gained', clinical_significance: 'pathogenic', allele_frequency: 0.00002 },
  { variant_id: 'var_007', gene_symbol: 'TP53', chromosome: 'chr17', position: 7676050, ref_allele: 'CTGG', alt_allele: 'C', variant_type: 'frameshift', aa_change: 'fs', consequence: 'frameshift_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00001 },
  // KRAS variants
  { variant_id: 'var_008', gene_symbol: 'KRAS', chromosome: 'chr12', position: 25245350, ref_allele: 'C', alt_allele: 'T', variant_type: 'missense', aa_change: 'G12D', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.0002 },
  { variant_id: 'var_009', gene_symbol: 'KRAS', chromosome: 'chr12', position: 25245350, ref_allele: 'C', alt_allele: 'A', variant_type: 'missense', aa_change: 'G12V', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00015 },
  { variant_id: 'var_010', gene_symbol: 'KRAS', chromosome: 'chr12', position: 25245350, ref_allele: 'C', alt_allele: 'G', variant_type: 'missense', aa_change: 'G12A', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00005 },
  { variant_id: 'var_011', gene_symbol: 'KRAS', chromosome: 'chr12', position: 25245351, ref_allele: 'G', alt_allele: 'T', variant_type: 'missense', aa_change: 'G12C', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00012 },
  { variant_id: 'var_012', gene_symbol: 'KRAS', chromosome: 'chr12', position: 25245380, ref_allele: 'G', alt_allele: 'A', variant_type: 'missense', aa_change: 'G13D', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00008 },
  { variant_id: 'var_013', gene_symbol: 'KRAS', chromosome: 'chr12', position: 25227300, ref_allele: 'A', alt_allele: 'T', variant_type: 'missense', aa_change: 'Q61H', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00004 },
  // EGFR variants
  { variant_id: 'var_014', gene_symbol: 'EGFR', chromosome: 'chr7', position: 55154010, ref_allele: 'T', alt_allele: 'G', variant_type: 'missense', aa_change: 'L858R', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00015 },
  { variant_id: 'var_015', gene_symbol: 'EGFR', chromosome: 'chr7', position: 55155827, ref_allele: 'C', alt_allele: 'T', variant_type: 'missense', aa_change: 'T790M', consequence: 'missense_variant', clinical_significance: 'drug_response', allele_frequency: 0.0001 },
  { variant_id: 'var_016', gene_symbol: 'EGFR', chromosome: 'chr7', position: 55156533, ref_allele: 'GGAATTAAGAGAAGC', alt_allele: 'G', variant_type: 'deletion', aa_change: 'del19', consequence: 'inframe_deletion', clinical_significance: 'pathogenic', allele_frequency: 0.00012 },
  { variant_id: 'var_017', gene_symbol: 'EGFR', chromosome: 'chr7', position: 55191717, ref_allele: 'G', alt_allele: 'T', variant_type: 'missense', aa_change: 'G719A', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00003 },
  // BRCA1 variants
  { variant_id: 'var_018', gene_symbol: 'BRCA1', chromosome: 'chr17', position: 43094464, ref_allele: 'AG', alt_allele: 'A', variant_type: 'frameshift', aa_change: '185delAG', consequence: 'frameshift_variant', clinical_significance: 'pathogenic', allele_frequency: 0.001 },
  { variant_id: 'var_019', gene_symbol: 'BRCA1', chromosome: 'chr17', position: 43057062, ref_allele: 'T', alt_allele: 'G', variant_type: 'missense', aa_change: 'C61G', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.0001 },
  { variant_id: 'var_020', gene_symbol: 'BRCA1', chromosome: 'chr17', position: 43106533, ref_allele: 'AAAG', alt_allele: 'A', variant_type: 'frameshift', aa_change: '5382insC', consequence: 'frameshift_variant', clinical_significance: 'pathogenic', allele_frequency: 0.0008 },
  // BRCA2 variants
  { variant_id: 'var_021', gene_symbol: 'BRCA2', chromosome: 'chr13', position: 32340300, ref_allele: 'AAAAC', alt_allele: 'A', variant_type: 'frameshift', aa_change: '6174delT', consequence: 'frameshift_variant', clinical_significance: 'pathogenic', allele_frequency: 0.0005 },
  { variant_id: 'var_022', gene_symbol: 'BRCA2', chromosome: 'chr13', position: 32355250, ref_allele: 'A', alt_allele: 'T', variant_type: 'nonsense', aa_change: 'K3326*', consequence: 'stop_gained', clinical_significance: 'pathogenic', allele_frequency: 0.0002 },
  // PTEN variants
  { variant_id: 'var_023', gene_symbol: 'PTEN', chromosome: 'chr10', position: 87933147, ref_allele: 'C', alt_allele: 'T', variant_type: 'missense', aa_change: 'R130Q', consequence: 'missense_variant', clinical_significance: 'pathogenic', allele_frequency: 0.00005 },
  { variant_id: 'var_024', gene_symbol: 'PTEN', chromosome: 'chr10', position: 87952142, ref_allele: 'G', alt_allele: 'A', variant_type: 'nonsense', aa_change: 'R233*', consequence: 'stop_gained', clinical_significance: 'pathogenic', allele_frequency: 0.00003 }
];

// Sample data
const samples = [
  { sample_id: 'TCGA-001', project: 'TCGA-BRCA', cancer_type: 'Breast Invasive Carcinoma', age: 52, sex: 'Female', stage: 'II', primary_site: 'Breast' },
  { sample_id: 'TCGA-002', project: 'TCGA-BRCA', cancer_type: 'Breast Invasive Carcinoma', age: 61, sex: 'Female', stage: 'III', primary_site: 'Breast' },
  { sample_id: 'TCGA-003', project: 'TCGA-LUAD', cancer_type: 'Lung Adenocarcinoma', age: 68, sex: 'Male', stage: 'IV', primary_site: 'Lung' },
  { sample_id: 'TCGA-004', project: 'TCGA-LUAD', cancer_type: 'Lung Adenocarcinoma', age: 55, sex: 'Female', stage: 'III', primary_site: 'Lung' },
  { sample_id: 'TCGA-005', project: 'TCGA-COAD', cancer_type: 'Colon Adenocarcinoma', age: 72, sex: 'Male', stage: 'II', primary_site: 'Colon' },
  { sample_id: 'TCGA-006', project: 'TCGA-COAD', cancer_type: 'Colon Adenocarcinoma', age: 64, sex: 'Female', stage: 'III', primary_site: 'Colon' },
  { sample_id: 'TCGA-007', project: 'TCGA-PAAD', cancer_type: 'Pancreatic Adenocarcinoma', age: 58, sex: 'Male', stage: 'IV', primary_site: 'Pancreas' },
  { sample_id: 'TCGA-008', project: 'TCGA-PAAD', cancer_type: 'Pancreatic Adenocarcinoma', age: 67, sex: 'Male', stage: 'III', primary_site: 'Pancreas' },
  { sample_id: 'TCGA-009', project: 'TCGA-OV', cancer_type: 'Ovarian Serous Carcinoma', age: 59, sex: 'Female', stage: 'III', primary_site: 'Ovary' },
  { sample_id: 'TCGA-010', project: 'TCGA-OV', cancer_type: 'Ovarian Serous Carcinoma', age: 48, sex: 'Female', stage: 'IV', primary_site: 'Ovary' },
  { sample_id: 'TCGA-011', project: 'TCGA-GBM', cancer_type: 'Glioblastoma', age: 54, sex: 'Male', stage: 'IV', primary_site: 'Brain' },
  { sample_id: 'TCGA-012', project: 'TCGA-GBM', cancer_type: 'Glioblastoma', age: 62, sex: 'Female', stage: 'IV', primary_site: 'Brain' },
  { sample_id: 'TCGA-013', project: 'TCGA-SKCM', cancer_type: 'Melanoma', age: 45, sex: 'Male', stage: 'III', primary_site: 'Skin' },
  { sample_id: 'TCGA-014', project: 'TCGA-SKCM', cancer_type: 'Melanoma', age: 71, sex: 'Female', stage: 'II', primary_site: 'Skin' },
  { sample_id: 'TCGA-015', project: 'TCGA-LUSC', cancer_type: 'Lung Squamous Cell Carcinoma', age: 66, sex: 'Male', stage: 'III', primary_site: 'Lung' }
];

// Sample-variant associations
const sampleVariants = [
  { sample_id: 'TCGA-001', variant_ids: ['var_018', 'var_020'], vaf: 0.35 },
  { sample_id: 'TCGA-002', variant_ids: ['var_021'], vaf: 0.42 },
  { sample_id: 'TCGA-003', variant_ids: ['var_008', 'var_014'], vaf: 0.28 },
  { sample_id: 'TCGA-004', variant_ids: ['var_014', 'var_015'], vaf: 0.31 },
  { sample_id: 'TCGA-005', variant_ids: ['var_001', 'var_008'], vaf: 0.45 },
  { sample_id: 'TCGA-006', variant_ids: ['var_009', 'var_023'], vaf: 0.38 },
  { sample_id: 'TCGA-007', variant_ids: ['var_008', 'var_001', 'var_024'], vaf: 0.52 },
  { sample_id: 'TCGA-008', variant_ids: ['var_009'], vaf: 0.29 },
  { sample_id: 'TCGA-009', variant_ids: ['var_018', 'var_001'], vaf: 0.41 },
  { sample_id: 'TCGA-010', variant_ids: ['var_019', 'var_003'], vaf: 0.33 },
  { sample_id: 'TCGA-011', variant_ids: ['var_001', 'var_023'], vaf: 0.47 },
  { sample_id: 'TCGA-012', variant_ids: ['var_002', 'var_016'], vaf: 0.36 },
  { sample_id: 'TCGA-013', variant_ids: ['var_004', 'var_024'], vaf: 0.39 },
  { sample_id: 'TCGA-014', variant_ids: ['var_011'], vaf: 0.25 },
  { sample_id: 'TCGA-015', variant_ids: ['var_005', 'var_006'], vaf: 0.44 }
];

async function seedDatabase() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📊 Genomic Database - Seeding Data');
  console.log('═══════════════════════════════════════════════════════════');
  
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot seed database - connection failed');
    process.exit(1);
  }
  
  try {
    await transaction(async (client) => {
      // 1. Insert genes
      console.log('📝 Inserting genes...');
      const geneIdMap = {};
      for (const gene of genes) {
        const result = await client.query(
          `INSERT INTO genes (ensembl_id, symbol, name, chromosome, start_pos, end_pos, strand, biotype, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [gene.ensembl_id, gene.symbol, gene.name, gene.chromosome, gene.start_pos, gene.end_pos, gene.strand, gene.biotype, gene.description]
        );
        geneIdMap[gene.symbol] = result.rows[0].id;
      }
      console.log(`   ✓ Inserted ${genes.length} genes`);
      
      // 2. Insert protein domains
      console.log('📝 Inserting protein domains...');
      let domainCount = 0;
      for (const [symbol, geneDomains] of Object.entries(domains)) {
        const geneId = geneIdMap[symbol];
        if (geneId) {
          for (const domain of geneDomains) {
            await client.query(
              `INSERT INTO protein_domains (gene_id, name, start_pos, end_pos, description, color)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [geneId, domain.name, domain.start_pos, domain.end_pos, domain.description, domain.color]
            );
            domainCount++;
          }
        }
      }
      console.log(`   ✓ Inserted ${domainCount} protein domains`);
      
      // 3. Insert variants
      console.log('📝 Inserting variants...');
      const variantIdMap = {};
      for (const variant of variants) {
        const geneId = geneIdMap[variant.gene_symbol] || null;
        const result = await client.query(
          `INSERT INTO variants (variant_id, gene_id, chromosome, position, ref_allele, alt_allele, variant_type, aa_change, consequence, clinical_significance, allele_frequency)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id`,
          [variant.variant_id, geneId, variant.chromosome, variant.position, variant.ref_allele, variant.alt_allele, variant.variant_type, variant.aa_change, variant.consequence, variant.clinical_significance, variant.allele_frequency]
        );
        variantIdMap[variant.variant_id] = result.rows[0].id;
      }
      console.log(`   ✓ Inserted ${variants.length} variants`);
      
      // 4. Insert samples
      console.log('📝 Inserting samples...');
      const sampleIdMap = {};
      for (const sample of samples) {
        const result = await client.query(
          `INSERT INTO samples (sample_id, project, cancer_type, age, sex, stage, primary_site)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [sample.sample_id, sample.project, sample.cancer_type, sample.age, sample.sex, sample.stage, sample.primary_site]
        );
        sampleIdMap[sample.sample_id] = result.rows[0].id;
      }
      console.log(`   ✓ Inserted ${samples.length} samples`);
      
      // 5. Insert sample-variant associations
      console.log('📝 Inserting sample-variant associations...');
      let assocCount = 0;
      for (const sv of sampleVariants) {
        const sampleId = sampleIdMap[sv.sample_id];
        for (const variantId of sv.variant_ids) {
          const vid = variantIdMap[variantId];
          if (sampleId && vid) {
            await client.query(
              `INSERT INTO sample_variants (sample_id, variant_id, vaf, depth)
               VALUES ($1, $2, $3, $4)`,
              [sampleId, vid, sv.vaf, Math.floor(Math.random() * 200) + 50]
            );
            assocCount++;
          }
        }
      }
      console.log(`   ✓ Inserted ${assocCount} sample-variant associations`);
    });
    
    console.log('');
    console.log('✅ Database seeded successfully!');
    console.log('───────────────────────────────────────────────────────────');
    console.log('  Summary:');
    console.log(`    • ${genes.length} genes`);
    console.log(`    • ${Object.values(domains).flat().length} protein domains`);
    console.log(`    • ${variants.length} variants`);
    console.log(`    • ${samples.length} samples`);
    console.log('───────────────────────────────────────────────────────────');
    console.log('');
    console.log('Start the server:');
    console.log('  npm run dev');
    console.log('═══════════════════════════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
}

seedDatabase();
