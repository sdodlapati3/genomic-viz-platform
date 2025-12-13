# Tutorial 2.3: Parsing Genomic File Formats

## Overview

This tutorial teaches how to parse common genomic file formats used in bioinformatics. You'll build parsers for VCF, GFF3, and BED files - the backbone of genomic data exchange.

## Learning Objectives

1. Understand VCF format for variant data
2. Parse GFF3 files for gene annotations
3. Handle BED files for genomic intervals
4. Stream large files efficiently
5. Build file upload endpoints

## Project Structure

```
03-file-parsing/
├── package.json
├── README.md
├── start-tutorial.sh
├── data/
│   ├── sample.vcf       # Sample variant file
│   ├── sample.gff3      # Sample gene annotations
│   └── sample.bed       # Sample genomic intervals
└── src/
    ├── server.js
    ├── parsers/
    │   ├── index.js
    │   ├── vcfParser.js
    │   ├── gffParser.js
    │   └── bedParser.js
    ├── routes/
    │   └── parse.js
    └── examples/
        ├── parseVcf.js
        ├── parseGff.js
        └── parseBed.js
```

## Getting Started

### Quick Start

```bash
cd tutorials/phase-2-backend/03-file-parsing
npm install
npm run dev
```

Server runs at **http://localhost:3003**

### Run Example Parsers

```bash
# Parse VCF file
npm run parse:vcf

# Parse GFF3 file
npm run parse:gff

# Parse BED file
npm run parse:bed
```

## File Formats

### VCF (Variant Call Format)

Used for storing genetic variants (SNPs, indels, structural variants).

```
##fileformat=VCFv4.2
##INFO=<ID=DP,Number=1,Type=Integer,Description="Total Depth">
#CHROM  POS     ID          REF  ALT  QUAL  FILTER  INFO           FORMAT  SAMPLE1
chr17   7673700 rs28934578  C    T    99    PASS    DP=150;AF=0.35 GT:DP   0/1:45
```

**Key Components:**
- **Header**: Metadata starting with `##`
- **Columns**: CHROM, POS, ID, REF, ALT, QUAL, FILTER, INFO
- **Samples**: Genotype data per sample

### GFF3 (General Feature Format)

Used for gene annotations and genomic features.

```
##gff-version 3
chr17  ENSEMBL  gene  7668402  7687550  .  -  .  ID=ENSG00000141510;Name=TP53
chr17  ENSEMBL  mRNA  7668402  7687550  .  -  .  ID=ENST00000269305;Parent=ENSG00000141510
chr17  ENSEMBL  exon  7687377  7687550  .  -  .  Parent=ENST00000269305;exon_number=1
```

**9 Columns:**
1. seqid - Chromosome/contig
2. source - Annotation source
3. type - Feature type (gene, mRNA, exon, CDS)
4. start - Start position (1-based)
5. end - End position (inclusive)
6. score - Feature score
7. strand - + or -
8. phase - CDS reading frame
9. attributes - Key=value pairs

### BED (Browser Extensible Data)

Used for genomic intervals and regions.

```
chr17  7673699  7673701  TP53_R175  1000  -
chr17  7687376  7687551  TP53_exon1  500  -
```

**Formats:**
- **BED3**: chrom, start, end
- **BED6**: + name, score, strand
- **BED12**: + thickStart, thickEnd, rgb, blocks

**Note**: BED uses 0-based, half-open coordinates!

## API Endpoints

### Parse Sample Files

```bash
# Parse sample VCF
curl http://localhost:3003/api/parse/sample/vcf

# Parse sample GFF3
curl http://localhost:3003/api/parse/sample/gff

# Parse sample BED
curl http://localhost:3003/api/parse/sample/bed
```

### Upload and Parse Files

```bash
# Upload VCF file
curl -X POST -F "file=@your_file.vcf" http://localhost:3003/api/parse/vcf

# Upload GFF3 file
curl -X POST -F "file=@your_file.gff3" http://localhost:3003/api/parse/gff

# Upload BED file
curl -X POST -F "file=@your_file.bed" http://localhost:3003/api/parse/bed
```

## Key Concepts

### 1. Streaming Parser

For large files, use streaming to avoid loading everything into memory:

```javascript
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function streamFile(filePath, callback) {
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity
  });
  
  for await (const line of rl) {
    callback(parseLine(line));
  }
}
```

### 2. VCF INFO Field Parsing

```javascript
function parseInfoField(infoStr) {
  const info = {};
  for (const pair of infoStr.split(';')) {
    if (pair.includes('=')) {
      const [key, value] = pair.split('=');
      info[key] = value;
    } else {
      info[pair] = true; // Flag
    }
  }
  return info;
}
```

### 3. GFF3 Hierarchical Structure

```javascript
// Build parent-child relationships
const genes = features.filter(f => f.type === 'gene');
for (const gene of genes) {
  gene.transcripts = features.filter(f => 
    f.type === 'mRNA' && f.parent === gene.id
  );
  for (const transcript of gene.transcripts) {
    transcript.exons = features.filter(f =>
      f.type === 'exon' && f.parent === transcript.id
    );
  }
}
```

### 4. BED Coordinate System

```javascript
// BED: 0-based, half-open [start, end)
// Convert to 1-based for display
function toOneBased(bedRegion) {
  return {
    ...bedRegion,
    start: bedRegion.start + 1  // Now 1-based
  };
}
```

## Exercises

### Exercise 1: Add FASTA Parser
Create a parser for FASTA sequence files:

```javascript
function parseFasta(filePath) {
  const sequences = [];
  let current = null;
  
  // Parse >header lines and sequence data
  // ...
  
  return sequences;
}
```

### Exercise 2: VCF Statistics
Add an endpoint that returns VCF statistics:
- Variant count by type (SNP, indel)
- Variant count by chromosome
- Transition/transversion ratio

### Exercise 3: Region Query
Implement efficient region queries using an interval tree:

```javascript
import IntervalTree from 'interval-tree';

const tree = new IntervalTree();
for (const region of bedRegions) {
  tree.insert(region.start, region.end, region);
}

// Query overlapping regions
const overlaps = tree.search(queryStart, queryEnd);
```

### Exercise 4: File Validation
Add validation for uploaded files:
- Check file format magic bytes
- Validate required columns
- Report parsing errors with line numbers

## Common Parsing Challenges

### 1. Encoding Issues
```javascript
// Handle URL-encoded attributes in GFF3
const value = decodeURIComponent(rawValue);
```

### 2. Large Files
```javascript
// Use streaming and generators
async function* parseLines(filePath) {
  const rl = createInterface({ input: createReadStream(filePath) });
  for await (const line of rl) {
    yield parseLine(line);
  }
}
```

### 3. Malformed Data
```javascript
// Always handle errors gracefully
try {
  const feature = parseLine(line);
  results.push(feature);
} catch (error) {
  console.warn(`Line ${lineNumber}: ${error.message}`);
  // Continue parsing
}
```

## Integration with Visualization

Convert parsed data to visualization-friendly format:

```javascript
// VCF variant to lollipop plot data
function variantToLollipop(variant) {
  return {
    position: variant.position,
    aaChange: variant.info.AA,
    type: variant.info.CONSEQUENCE,
    frequency: variant.info.AF
  };
}

// GFF gene to track data
function geneToTrack(gene) {
  return {
    id: gene.id,
    name: gene.symbol,
    start: gene.start,
    end: gene.end,
    strand: gene.strand,
    exons: gene.transcripts[0]?.exons || []
  };
}
```

## Next Steps

- **Tutorial 2.4: R Integration** - Statistical analysis with R
- **Phase 3: Advanced Visualization** - Use parsed data in visualizations

## Resources

- [VCF Specification](https://samtools.github.io/hts-specs/VCFv4.3.pdf)
- [GFF3 Specification](https://github.com/The-Sequence-Ontology/Specifications/blob/master/gff3.md)
- [BED Format](https://genome.ucsc.edu/FAQ/FAQformat.html#format1)
- [Bioinformatics File Formats](https://www.ncbi.nlm.nih.gov/sra/docs/submitformats/)
