# Sample Data

This directory contains small sample files for the Binary Formats tutorial.

## Files

| File           | Description                    | Source                      |
| -------------- | ------------------------------ | --------------------------- |
| sample.bam     | Aligned reads (chr17 subset)   | Generated from 1000 Genomes |
| sample.bam.bai | BAM index file                 | samtools index              |
| sample.bw      | Coverage signal (chr17 subset) | Generated from BAM          |

## Downloading Sample Data

The sample files are small subsets of public data. To download them:

```bash
npm run download-samples
```

This will download ~10MB of sample data.

## Creating Your Own Sample Data

### From a Large BAM File

```bash
# Extract chr17 region around TP53
samtools view -b input.bam chr17:7668402-7687550 > sample.bam
samtools index sample.bam
```

### Create BigWig from BAM

```bash
# Using deepTools
bamCoverage -b sample.bam -o sample.bw --binSize 10
```

## Larger Datasets

For more comprehensive testing, you can download from:

- [ENCODE](https://www.encodeproject.org/) - ChIP-seq, RNA-seq data
- [1000 Genomes](https://www.internationalgenome.org/) - Whole genome sequencing
- [GDC Portal](https://portal.gdc.cancer.gov/) - Cancer genomics data

## File Size Guidelines

| Use Case            | BAM Size  | BigWig Size |
| ------------------- | --------- | ----------- |
| Tutorial exercises  | < 50MB    | < 10MB      |
| Development testing | 100-500MB | 10-50MB     |
| Production testing  | 1-10GB    | 100MB-1GB   |

## Note

The sample files in this directory are for educational purposes only. For real analysis, always use properly sourced and validated data.
