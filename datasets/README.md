# Sample Datasets

This directory contains sample genomic datasets for tutorials and testing.

## Directory Structure

```
datasets/
├── mutations/          # Variant and mutation data
│   ├── tp53_mutations.json      # TP53 mutations for lollipop plot
│   ├── sample_maf.tsv           # Sample MAF file
│   └── sample.vcf               # Sample VCF file
│
├── expression/         # Gene expression data
│   ├── expression_matrix.tsv    # Sample x Gene matrix
│   └── differential_expression.tsv
│
├── clinical/           # Clinical and sample metadata
│   ├── samples.json             # Sample information
│   ├── patients.json            # Patient information
│   └── survival.tsv             # Survival data
│
├── references/         # Reference data
│   ├── genes.json               # Gene annotations
│   ├── protein_domains.json     # Protein domain definitions
│   └── chromosomes.json         # Chromosome sizes
│
└── sql/               # Database seed files
    └── init.sql               # Initial database schema
```

## Data Sources

Sample data is derived from or inspired by:
- [COSMIC](https://cancer.sanger.ac.uk/cosmic) - Cancer mutations
- [ClinVar](https://www.ncbi.nlm.nih.gov/clinvar/) - Clinical variants
- [UniProt](https://www.uniprot.org/) - Protein domains
- [Ensembl](https://www.ensembl.org/) - Gene annotations

## Usage

```javascript
import tp53Mutations from './mutations/tp53_mutations.json';
import genes from './references/genes.json';
```

## Data Formats

### Mutation JSON
```json
{
  "gene": "TP53",
  "proteinLength": 393,
  "mutations": [
    {
      "position": 175,
      "aaChange": "R175H",
      "type": "missense",
      "count": 1542
    }
  ]
}
```

### Expression Matrix TSV
```
gene    sample1    sample2    sample3
TP53    5.23       4.89       6.12
EGFR    8.45       7.92       9.01
```

### Survival TSV
```
patient_id    time    event    group
P001          365     1        treatment
P002          180     0        control
```
