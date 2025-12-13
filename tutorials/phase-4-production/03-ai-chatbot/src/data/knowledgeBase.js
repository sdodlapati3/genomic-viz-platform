/**
 * Genomic Knowledge Base
 * Pre-defined knowledge chunks for RAG system
 */

export const genomicKnowledge = [
  // Gene Information
  {
    id: 'tp53-overview',
    category: 'gene',
    title: 'TP53 Tumor Suppressor Gene',
    content: `TP53 is a tumor suppressor gene located on chromosome 17p13.1. It encodes the p53 protein, often called the "guardian of the genome" due to its critical role in preventing cancer. The p53 protein regulates cell cycle arrest, apoptosis, and DNA repair. TP53 is the most frequently mutated gene in human cancers, found in approximately 50% of all tumors. Common mutation hotspots include codons R175, G245, R248, R249, R273, and R282.`,
    keywords: ['TP53', 'p53', 'tumor suppressor', 'chromosome 17', 'apoptosis', 'DNA repair']
  },
  {
    id: 'brca1-overview',
    category: 'gene',
    title: 'BRCA1 Gene and Hereditary Breast Cancer',
    content: `BRCA1 (Breast Cancer gene 1) is located on chromosome 17q21. It produces a protein involved in DNA repair through homologous recombination. Mutations in BRCA1 significantly increase the risk of breast cancer (55-65% lifetime risk) and ovarian cancer (39% lifetime risk). BRCA1-associated tumors are often triple-negative breast cancers. The gene was first cloned in 1994 and has since been a major focus of hereditary cancer screening.`,
    keywords: ['BRCA1', 'breast cancer', 'hereditary', 'DNA repair', 'homologous recombination']
  },
  {
    id: 'kras-overview',
    category: 'gene',
    title: 'KRAS Oncogene',
    content: `KRAS is a proto-oncogene located on chromosome 12p12.1. It encodes a GTPase involved in cell signaling pathways (RAS/MAPK). KRAS mutations are found in approximately 25% of all cancers, particularly pancreatic (90%), colorectal (40%), and lung adenocarcinomas (30%). The most common mutations occur at codons 12, 13, and 61, with G12D being the most frequent. KRAS was considered "undruggable" until recent breakthroughs with KRAS G12C inhibitors (sotorasib, adagrasib).`,
    keywords: ['KRAS', 'oncogene', 'GTPase', 'RAS pathway', 'pancreatic cancer', 'G12D', 'G12C']
  },
  {
    id: 'egfr-overview',
    category: 'gene',
    title: 'EGFR in Lung Cancer',
    content: `EGFR (Epidermal Growth Factor Receptor) is located on chromosome 7p12. It's a transmembrane tyrosine kinase receptor that activates multiple signaling pathways promoting cell proliferation. EGFR mutations are found in 10-15% of lung adenocarcinomas in Western populations and 30-40% in Asian populations. Common activating mutations include exon 19 deletions (del746-750) and L858R (exon 21). These mutations predict sensitivity to EGFR tyrosine kinase inhibitors (gefitinib, erlotinib, osimertinib).`,
    keywords: ['EGFR', 'lung cancer', 'tyrosine kinase', 'TKI', 'L858R', 'exon 19 deletion']
  },

  // Mutation Types
  {
    id: 'mutation-types',
    category: 'concept',
    title: 'Types of Genetic Mutations',
    content: `Genetic mutations can be classified into several types: 1) Missense mutations: single nucleotide changes resulting in different amino acids. 2) Nonsense mutations: create premature stop codons, truncating the protein. 3) Frameshift mutations: insertions or deletions that shift the reading frame. 4) Splice site mutations: affect RNA splicing, potentially causing exon skipping. 5) Silent/synonymous mutations: nucleotide changes that don't alter the amino acid. The functional impact varies from benign to pathogenic.`,
    keywords: ['missense', 'nonsense', 'frameshift', 'splice site', 'silent mutation', 'pathogenic']
  },
  {
    id: 'variant-classification',
    category: 'concept',
    title: 'Variant Classification (ACMG Guidelines)',
    content: `The ACMG/AMP guidelines classify variants into five categories: 1) Pathogenic: causes disease, actionable. 2) Likely Pathogenic: >90% certainty of pathogenicity. 3) Variant of Uncertain Significance (VUS): insufficient evidence. 4) Likely Benign: >90% certainty of benign status. 5) Benign: does not cause disease. Classification considers population frequency, functional studies, computational predictions, and clinical data. Periodic reclassification occurs as new evidence emerges.`,
    keywords: ['ACMG', 'pathogenic', 'VUS', 'benign', 'variant classification']
  },

  // Cancer Biology
  {
    id: 'hallmarks-cancer',
    category: 'concept',
    title: 'Hallmarks of Cancer',
    content: `The hallmarks of cancer, defined by Hanahan and Weinberg, describe eight biological capabilities acquired during tumor development: 1) Sustaining proliferative signaling. 2) Evading growth suppressors. 3) Resisting cell death. 4) Enabling replicative immortality. 5) Inducing angiogenesis. 6) Activating invasion and metastasis. 7) Reprogramming energy metabolism. 8) Evading immune destruction. Two enabling characteristics are genome instability and tumor-promoting inflammation.`,
    keywords: ['hallmarks of cancer', 'proliferation', 'metastasis', 'angiogenesis', 'apoptosis']
  },
  {
    id: 'tumor-suppressor-vs-oncogene',
    category: 'concept',
    title: 'Tumor Suppressors vs Oncogenes',
    content: `Cancer genes fall into two main categories: 1) Tumor suppressors: genes that normally inhibit cell growth (e.g., TP53, RB1, BRCA1). Loss of function (often through biallelic inactivation) contributes to cancer. Follow the "two-hit hypothesis." 2) Oncogenes: genes that promote cell growth when activated (e.g., KRAS, MYC, HER2). Gain of function through mutation, amplification, or translocation drives cancer. Only one activated allele is needed.`,
    keywords: ['tumor suppressor', 'oncogene', 'loss of function', 'gain of function', 'two-hit hypothesis']
  },

  // Visualization Concepts
  {
    id: 'lollipop-plot',
    category: 'visualization',
    title: 'Lollipop Plot Visualization',
    content: `A lollipop plot displays mutations along a protein sequence. The x-axis represents amino acid positions, while the y-axis shows mutation frequency or sample count. Each "lollipop" consists of a stem (line) and head (circle), with the head's position indicating the mutation location. Color coding often represents mutation types (missense, nonsense, etc.) or functional domains. Lollipop plots are widely used in tools like cBioPortal and ProteinPaint to visualize mutation hotspots.`,
    keywords: ['lollipop plot', 'mutation visualization', 'protein domains', 'hotspots']
  },
  {
    id: 'oncoprint',
    category: 'visualization',
    title: 'OncoPrint Visualization',
    content: `An OncoPrint is a compact visualization showing genomic alterations across multiple samples and genes. Samples are columns, genes are rows. Each cell shows the alteration type: mutations (colored shapes), amplifications (red), deletions (blue), or multiple alterations. The visualization helps identify mutually exclusive or co-occurring alterations, coverage across samples, and prioritize genes by alteration frequency. OncoPrint was popularized by cBioPortal.`,
    keywords: ['oncoprint', 'mutation matrix', 'genomic alterations', 'cBioPortal']
  },

  // File Formats
  {
    id: 'vcf-format',
    category: 'format',
    title: 'VCF File Format',
    content: `VCF (Variant Call Format) is the standard format for storing genetic variants. Structure: 1) Meta-information lines (##) describe file contents, reference genome, filters. 2) Header line (#CHROM) defines columns. 3) Data lines contain: chromosome, position, ID, reference allele, alternate allele(s), quality score, filter status, INFO field (annotations), and sample genotypes. VCF files are typically bgzip compressed and tabix indexed for efficient access.`,
    keywords: ['VCF', 'variant call format', 'genetic variants', 'tabix', 'bgzip']
  },
  {
    id: 'maf-format',
    category: 'format',
    title: 'MAF File Format',
    content: `MAF (Mutation Annotation Format) is a tab-delimited file format used by TCGA and GDC for somatic mutation data. Key columns include: Hugo_Symbol, Chromosome, Start_Position, End_Position, Reference_Allele, Tumor_Seq_Allele2, Variant_Classification, Variant_Type, Tumor_Sample_Barcode, and many annotation fields. MAF files contain pre-annotated variants with standardized nomenclature, making them easier to analyze than raw VCF files.`,
    keywords: ['MAF', 'mutation annotation format', 'TCGA', 'GDC', 'somatic mutations']
  },

  // Databases
  {
    id: 'cosmic-database',
    category: 'database',
    title: 'COSMIC Database',
    content: `COSMIC (Catalogue Of Somatic Mutations In Cancer) is the world's largest database of somatic mutations in cancer. It catalogs over 7 million coding mutations across 1.5 million tumor samples. Key features include: mutation frequency data, tissue distribution, known driver annotations, drug resistance information, and gene census (list of known cancer genes). COSMIC is maintained by the Wellcome Sanger Institute and requires registration for full access.`,
    keywords: ['COSMIC', 'somatic mutations', 'cancer database', 'Sanger Institute']
  },
  {
    id: 'clinvar-database',
    category: 'database',
    title: 'ClinVar Database',
    content: `ClinVar is a public archive of variant-disease relationships maintained by NCBI. It aggregates submissions from clinical laboratories, researchers, and expert panels. Each variant entry includes: genomic location, clinical significance, supporting evidence, submitter information, and review status (ranging from single submitter to expert panel reviewed). ClinVar is essential for clinical variant interpretation and is freely accessible.`,
    keywords: ['ClinVar', 'clinical variants', 'NCBI', 'variant interpretation', 'germline']
  }
];

/**
 * Get knowledge chunks by category
 */
export function getKnowledgeByCategory(category) {
  return genomicKnowledge.filter(chunk => chunk.category === category);
}

/**
 * Search knowledge base by keywords
 */
export function searchKnowledge(query) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  
  return genomicKnowledge
    .map(chunk => {
      // Calculate relevance score
      let score = 0;
      
      // Check title match
      if (chunk.title.toLowerCase().includes(queryLower)) {
        score += 10;
      }
      
      // Check keyword matches
      for (const keyword of chunk.keywords) {
        if (queryLower.includes(keyword.toLowerCase())) {
          score += 5;
        }
        for (const word of queryWords) {
          if (keyword.toLowerCase().includes(word)) {
            score += 2;
          }
        }
      }
      
      // Check content matches
      for (const word of queryWords) {
        if (word.length > 2 && chunk.content.toLowerCase().includes(word)) {
          score += 1;
        }
      }
      
      return { ...chunk, score };
    })
    .filter(chunk => chunk.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Get context for a query (RAG retrieval)
 */
export function getRelevantContext(query, maxChunks = 3) {
  const results = searchKnowledge(query);
  return results.slice(0, maxChunks).map(r => r.content).join('\n\n');
}
