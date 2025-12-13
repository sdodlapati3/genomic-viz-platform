/**
 * Seed: Gene Reference Data
 * 
 * Populates genes table with common cancer-related genes
 */

const genes = [
  {
    symbol: 'TP53',
    name: 'Tumor protein p53',
    ensembl_id: 'ENSG00000141510',
    entrez_id: '7157',
    chromosome: 'chr17',
    start_position: 7661779,
    end_position: 7687538,
    strand: '-',
    protein_length: 393,
    description: 'Tumor suppressor gene encoding p53, the "guardian of the genome"',
    aliases: JSON.stringify(['p53', 'TRP53', 'LFS1']),
  },
  {
    symbol: 'BRCA1',
    name: 'BRCA1 DNA repair associated',
    ensembl_id: 'ENSG00000012048',
    entrez_id: '672',
    chromosome: 'chr17',
    start_position: 43044295,
    end_position: 43170245,
    strand: '-',
    protein_length: 1863,
    description: 'DNA repair gene associated with hereditary breast and ovarian cancer',
    aliases: JSON.stringify(['BRCC1', 'FANCS', 'RNF53']),
  },
  {
    symbol: 'BRCA2',
    name: 'BRCA2 DNA repair associated',
    ensembl_id: 'ENSG00000139618',
    entrez_id: '675',
    chromosome: 'chr13',
    start_position: 32315086,
    end_position: 32400266,
    strand: '+',
    protein_length: 3418,
    description: 'DNA repair gene associated with hereditary breast cancer',
    aliases: JSON.stringify(['FANCD1', 'FACD', 'BRCC2']),
  },
  {
    symbol: 'EGFR',
    name: 'Epidermal growth factor receptor',
    ensembl_id: 'ENSG00000146648',
    entrez_id: '1956',
    chromosome: 'chr7',
    start_position: 55019017,
    end_position: 55211628,
    strand: '+',
    protein_length: 1210,
    description: 'Receptor tyrosine kinase frequently mutated in lung cancer',
    aliases: JSON.stringify(['ERBB1', 'HER1', 'mENA']),
  },
  {
    symbol: 'KRAS',
    name: 'KRAS proto-oncogene, GTPase',
    ensembl_id: 'ENSG00000133703',
    entrez_id: '3845',
    chromosome: 'chr12',
    start_position: 25204789,
    end_position: 25250936,
    strand: '-',
    protein_length: 189,
    description: 'Oncogene frequently mutated in colorectal, lung, and pancreatic cancer',
    aliases: JSON.stringify(['K-RAS', 'KRAS2', 'NS3']),
  },
  {
    symbol: 'BRAF',
    name: 'B-Raf proto-oncogene, serine/threonine kinase',
    ensembl_id: 'ENSG00000157764',
    entrez_id: '673',
    chromosome: 'chr7',
    start_position: 140719327,
    end_position: 140924929,
    strand: '-',
    protein_length: 766,
    description: 'Serine/threonine kinase frequently mutated in melanoma',
    aliases: JSON.stringify(['RAFB1', 'NS7', 'BRAF1']),
  },
  {
    symbol: 'PIK3CA',
    name: 'Phosphatidylinositol-4,5-bisphosphate 3-kinase catalytic subunit alpha',
    ensembl_id: 'ENSG00000121879',
    entrez_id: '5290',
    chromosome: 'chr3',
    start_position: 179148114,
    end_position: 179240093,
    strand: '+',
    protein_length: 1068,
    description: 'Catalytic subunit of PI3K frequently mutated in breast cancer',
    aliases: JSON.stringify(['PI3K', 'p110alpha', 'CLAPO']),
  },
  {
    symbol: 'PTEN',
    name: 'Phosphatase and tensin homolog',
    ensembl_id: 'ENSG00000171862',
    entrez_id: '5728',
    chromosome: 'chr10',
    start_position: 87863113,
    end_position: 87971930,
    strand: '+',
    protein_length: 403,
    description: 'Tumor suppressor that negatively regulates PI3K/AKT pathway',
    aliases: JSON.stringify(['MMAC1', 'TEP1', 'BZS']),
  },
  {
    symbol: 'APC',
    name: 'APC regulator of WNT signaling pathway',
    ensembl_id: 'ENSG00000134982',
    entrez_id: '324',
    chromosome: 'chr5',
    start_position: 112737885,
    end_position: 112846239,
    strand: '+',
    protein_length: 2843,
    description: 'Tumor suppressor gene mutated in colorectal cancer',
    aliases: JSON.stringify(['DP2', 'DP3', 'GS']),
  },
  {
    symbol: 'MYC',
    name: 'MYC proto-oncogene, bHLH transcription factor',
    ensembl_id: 'ENSG00000136997',
    entrez_id: '4609',
    chromosome: 'chr8',
    start_position: 127735434,
    end_position: 127742951,
    strand: '+',
    protein_length: 439,
    description: 'Proto-oncogene regulating cell cycle, apoptosis, and transformation',
    aliases: JSON.stringify(['c-Myc', 'MRTL', 'bHLHe39']),
  },
];

export async function seed(knex) {
  // Check if genes already exist
  const existingGenes = await knex('genes').count('id as count').first();
  
  if (existingGenes.count > 0) {
    console.log('Genes already seeded, skipping...');
    return;
  }

  await knex('genes').insert(genes);
  console.log(`Seeded ${genes.length} genes`);
}
