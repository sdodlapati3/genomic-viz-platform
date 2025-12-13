/**
 * Sample Genomic Data for REST API Tutorial
 * Contains genes, variants, and samples for TP53, KRAS, EGFR, BRCA1, BRCA2
 */

// Gene data
export const genes = [
  {
    id: 'ENSG00000141510',
    symbol: 'TP53',
    name: 'tumor protein p53',
    chromosome: 'chr17',
    start: 7668402,
    end: 7687550,
    strand: '-',
    biotype: 'protein_coding',
    description: 'Tumor suppressor gene, most frequently mutated in human cancers'
  },
  {
    id: 'ENSG00000133703',
    symbol: 'KRAS',
    name: 'KRAS proto-oncogene, GTPase',
    chromosome: 'chr12',
    start: 25205246,
    end: 25250936,
    strand: '-',
    biotype: 'protein_coding',
    description: 'Oncogene frequently mutated in lung, colorectal, and pancreatic cancers'
  },
  {
    id: 'ENSG00000146648',
    symbol: 'EGFR',
    name: 'epidermal growth factor receptor',
    chromosome: 'chr7',
    start: 55019017,
    end: 55211628,
    strand: '+',
    biotype: 'protein_coding',
    description: 'Receptor tyrosine kinase, target for cancer therapy'
  },
  {
    id: 'ENSG00000012048',
    symbol: 'BRCA1',
    name: 'BRCA1 DNA repair associated',
    chromosome: 'chr17',
    start: 43044295,
    end: 43170245,
    strand: '-',
    biotype: 'protein_coding',
    description: 'Tumor suppressor involved in DNA repair, breast cancer susceptibility'
  },
  {
    id: 'ENSG00000139618',
    symbol: 'BRCA2',
    name: 'BRCA2 DNA repair associated',
    chromosome: 'chr13',
    start: 32315086,
    end: 32400266,
    strand: '+',
    biotype: 'protein_coding',
    description: 'Tumor suppressor involved in DNA repair, breast cancer susceptibility'
  },
  {
    id: 'ENSG00000171862',
    symbol: 'PTEN',
    name: 'phosphatase and tensin homolog',
    chromosome: 'chr10',
    start: 87863113,
    end: 87971930,
    strand: '+',
    biotype: 'protein_coding',
    description: 'Tumor suppressor, frequently lost in many cancers'
  },
  {
    id: 'ENSG00000181143',
    symbol: 'MYC',
    name: 'MYC proto-oncogene',
    chromosome: 'chr8',
    start: 127735434,
    end: 127742951,
    strand: '+',
    biotype: 'protein_coding',
    description: 'Oncogenic transcription factor, amplified in many cancers'
  }
];

// Variant data
export const variants = [
  // TP53 variants
  { id: 'var_001', geneSymbol: 'TP53', chromosome: 'chr17', position: 7673700, ref: 'C', alt: 'T', type: 'missense', aaChange: 'R175H', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.0001 },
  { id: 'var_002', geneSymbol: 'TP53', chromosome: 'chr17', position: 7673781, ref: 'G', alt: 'A', type: 'missense', aaChange: 'G245S', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00005 },
  { id: 'var_003', geneSymbol: 'TP53', chromosome: 'chr17', position: 7673802, ref: 'G', alt: 'A', type: 'missense', aaChange: 'R248Q', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00008 },
  { id: 'var_004', geneSymbol: 'TP53', chromosome: 'chr17', position: 7674230, ref: 'G', alt: 'A', type: 'missense', aaChange: 'R273H', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00007 },
  { id: 'var_005', geneSymbol: 'TP53', chromosome: 'chr17', position: 7674252, ref: 'C', alt: 'T', type: 'missense', aaChange: 'R282W', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00004 },
  { id: 'var_006', geneSymbol: 'TP53', chromosome: 'chr17', position: 7674872, ref: 'G', alt: 'T', type: 'nonsense', aaChange: 'E294*', consequence: 'stop_gained', clinicalSignificance: 'pathogenic', frequency: 0.00002 },
  { id: 'var_007', geneSymbol: 'TP53', chromosome: 'chr17', position: 7676050, ref: 'CTGG', alt: 'C', type: 'frameshift', aaChange: 'fs', consequence: 'frameshift_variant', clinicalSignificance: 'pathogenic', frequency: 0.00001 },
  
  // KRAS variants
  { id: 'var_008', geneSymbol: 'KRAS', chromosome: 'chr12', position: 25245350, ref: 'C', alt: 'T', type: 'missense', aaChange: 'G12D', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.0002 },
  { id: 'var_009', geneSymbol: 'KRAS', chromosome: 'chr12', position: 25245350, ref: 'C', alt: 'A', type: 'missense', aaChange: 'G12V', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00015 },
  { id: 'var_010', geneSymbol: 'KRAS', chromosome: 'chr12', position: 25245350, ref: 'C', alt: 'G', type: 'missense', aaChange: 'G12A', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00005 },
  { id: 'var_011', geneSymbol: 'KRAS', chromosome: 'chr12', position: 25245351, ref: 'G', alt: 'T', type: 'missense', aaChange: 'G12C', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00012 },
  { id: 'var_012', geneSymbol: 'KRAS', chromosome: 'chr12', position: 25245380, ref: 'G', alt: 'A', type: 'missense', aaChange: 'G13D', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00008 },
  { id: 'var_013', geneSymbol: 'KRAS', chromosome: 'chr12', position: 25227300, ref: 'A', alt: 'T', type: 'missense', aaChange: 'Q61H', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00004 },
  
  // EGFR variants
  { id: 'var_014', geneSymbol: 'EGFR', chromosome: 'chr7', position: 55154010, ref: 'T', alt: 'G', type: 'missense', aaChange: 'L858R', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00015 },
  { id: 'var_015', geneSymbol: 'EGFR', chromosome: 'chr7', position: 55155827, ref: 'C', alt: 'T', type: 'missense', aaChange: 'T790M', consequence: 'missense_variant', clinicalSignificance: 'drug_response', frequency: 0.0001 },
  { id: 'var_016', geneSymbol: 'EGFR', chromosome: 'chr7', position: 55156533, ref: 'GGAATTAAGAGAAGC', alt: 'G', type: 'deletion', aaChange: 'del19', consequence: 'inframe_deletion', clinicalSignificance: 'pathogenic', frequency: 0.00012 },
  { id: 'var_017', geneSymbol: 'EGFR', chromosome: 'chr7', position: 55191717, ref: 'G', alt: 'T', type: 'missense', aaChange: 'G719A', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00003 },
  
  // BRCA1 variants
  { id: 'var_018', geneSymbol: 'BRCA1', chromosome: 'chr17', position: 43094464, ref: 'AG', alt: 'A', type: 'frameshift', aaChange: '185delAG', consequence: 'frameshift_variant', clinicalSignificance: 'pathogenic', frequency: 0.001 },
  { id: 'var_019', geneSymbol: 'BRCA1', chromosome: 'chr17', position: 43057062, ref: 'T', alt: 'G', type: 'missense', aaChange: 'C61G', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.0001 },
  { id: 'var_020', geneSymbol: 'BRCA1', chromosome: 'chr17', position: 43106533, ref: 'AAAG', alt: 'A', type: 'frameshift', aaChange: '5382insC', consequence: 'frameshift_variant', clinicalSignificance: 'pathogenic', frequency: 0.0008 },
  
  // BRCA2 variants
  { id: 'var_021', geneSymbol: 'BRCA2', chromosome: 'chr13', position: 32340300, ref: 'AAAAC', alt: 'A', type: 'frameshift', aaChange: '6174delT', consequence: 'frameshift_variant', clinicalSignificance: 'pathogenic', frequency: 0.0005 },
  { id: 'var_022', geneSymbol: 'BRCA2', chromosome: 'chr13', position: 32355250, ref: 'A', alt: 'T', type: 'missense', aaChange: 'K3326*', consequence: 'stop_gained', clinicalSignificance: 'pathogenic', frequency: 0.0002 },
  
  // PTEN variants
  { id: 'var_023', geneSymbol: 'PTEN', chromosome: 'chr10', position: 87933147, ref: 'C', alt: 'T', type: 'missense', aaChange: 'R130Q', consequence: 'missense_variant', clinicalSignificance: 'pathogenic', frequency: 0.00005 },
  { id: 'var_024', geneSymbol: 'PTEN', chromosome: 'chr10', position: 87952142, ref: 'G', alt: 'A', type: 'missense', aaChange: 'R233*', consequence: 'stop_gained', clinicalSignificance: 'pathogenic', frequency: 0.00003 }
];

// Sample/patient data
export const samples = [
  { id: 'TCGA-001', project: 'TCGA-BRCA', cancerType: 'Breast Invasive Carcinoma', variantIds: ['var_018', 'var_020'], age: 52, sex: 'Female', stage: 'II' },
  { id: 'TCGA-002', project: 'TCGA-BRCA', cancerType: 'Breast Invasive Carcinoma', variantIds: ['var_021'], age: 61, sex: 'Female', stage: 'III' },
  { id: 'TCGA-003', project: 'TCGA-LUAD', cancerType: 'Lung Adenocarcinoma', variantIds: ['var_008', 'var_014'], age: 68, sex: 'Male', stage: 'IV' },
  { id: 'TCGA-004', project: 'TCGA-LUAD', cancerType: 'Lung Adenocarcinoma', variantIds: ['var_014', 'var_015'], age: 55, sex: 'Female', stage: 'III' },
  { id: 'TCGA-005', project: 'TCGA-COAD', cancerType: 'Colon Adenocarcinoma', variantIds: ['var_001', 'var_008'], age: 72, sex: 'Male', stage: 'II' },
  { id: 'TCGA-006', project: 'TCGA-COAD', cancerType: 'Colon Adenocarcinoma', variantIds: ['var_009', 'var_023'], age: 64, sex: 'Female', stage: 'III' },
  { id: 'TCGA-007', project: 'TCGA-PAAD', cancerType: 'Pancreatic Adenocarcinoma', variantIds: ['var_008', 'var_001', 'var_024'], age: 58, sex: 'Male', stage: 'IV' },
  { id: 'TCGA-008', project: 'TCGA-PAAD', cancerType: 'Pancreatic Adenocarcinoma', variantIds: ['var_009'], age: 67, sex: 'Male', stage: 'III' },
  { id: 'TCGA-009', project: 'TCGA-OV', cancerType: 'Ovarian Serous Carcinoma', variantIds: ['var_018', 'var_001'], age: 59, sex: 'Female', stage: 'III' },
  { id: 'TCGA-010', project: 'TCGA-OV', cancerType: 'Ovarian Serous Carcinoma', variantIds: ['var_019', 'var_003'], age: 48, sex: 'Female', stage: 'IV' },
  { id: 'TCGA-011', project: 'TCGA-GBM', cancerType: 'Glioblastoma', variantIds: ['var_001', 'var_023'], age: 54, sex: 'Male', stage: 'IV' },
  { id: 'TCGA-012', project: 'TCGA-GBM', cancerType: 'Glioblastoma', variantIds: ['var_002', 'var_016'], age: 62, sex: 'Female', stage: 'IV' },
  { id: 'TCGA-013', project: 'TCGA-SKCM', cancerType: 'Melanoma', variantIds: ['var_004', 'var_024'], age: 45, sex: 'Male', stage: 'III' },
  { id: 'TCGA-014', project: 'TCGA-SKCM', cancerType: 'Melanoma', variantIds: ['var_011'], age: 71, sex: 'Female', stage: 'II' },
  { id: 'TCGA-015', project: 'TCGA-LUSC', cancerType: 'Lung Squamous Cell Carcinoma', variantIds: ['var_005', 'var_006'], age: 66, sex: 'Male', stage: 'III' }
];

// Protein domains
export const domains = {
  'TP53': [
    { name: 'TAD1', start: 1, end: 40, description: 'Transactivation domain 1' },
    { name: 'TAD2', start: 41, end: 61, description: 'Transactivation domain 2' },
    { name: 'Proline-rich', start: 62, end: 94, description: 'Proline-rich region' },
    { name: 'DNA-binding', start: 95, end: 289, description: 'DNA-binding domain' },
    { name: 'Tetramerization', start: 324, end: 355, description: 'Tetramerization domain' },
    { name: 'CTD', start: 356, end: 393, description: 'C-terminal regulatory domain' }
  ],
  'KRAS': [
    { name: 'P-loop', start: 10, end: 17, description: 'Phosphate-binding loop' },
    { name: 'Switch I', start: 30, end: 38, description: 'Effector-binding region' },
    { name: 'Switch II', start: 59, end: 76, description: 'Nucleotide-binding region' },
    { name: 'G-domain', start: 1, end: 166, description: 'GTPase domain' },
    { name: 'HVR', start: 167, end: 188, description: 'Hypervariable region' }
  ],
  'EGFR': [
    { name: 'L1', start: 1, end: 165, description: 'Ligand-binding domain 1' },
    { name: 'CR1', start: 166, end: 310, description: 'Cysteine-rich domain 1' },
    { name: 'L2', start: 311, end: 480, description: 'Ligand-binding domain 2' },
    { name: 'CR2', start: 481, end: 620, description: 'Cysteine-rich domain 2' },
    { name: 'TM', start: 621, end: 650, description: 'Transmembrane domain' },
    { name: 'Kinase', start: 690, end: 960, description: 'Tyrosine kinase domain' }
  ]
};
