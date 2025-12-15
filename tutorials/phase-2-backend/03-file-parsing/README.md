[← Back to Tutorials Index](../../README.md)

---

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
    crlfDelay: Infinity,
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
const genes = features.filter((f) => f.type === 'gene');
for (const gene of genes) {
  gene.transcripts = features.filter((f) => f.type === 'mRNA' && f.parent === gene.id);
  for (const transcript of gene.transcripts) {
    transcript.exons = features.filter((f) => f.type === 'exon' && f.parent === transcript.id);
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
    start: bedRegion.start + 1, // Now 1-based
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
    frequency: variant.info.AF,
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
    exons: gene.transcripts[0]?.exons || [],
  };
}
```

## 🎯 ProteinPaint Connection

File parsing is critical to ProteinPaint's data ingestion pipeline:

| Tutorial Concept | ProteinPaint Usage                            |
| ---------------- | --------------------------------------------- |
| VCF parsing      | `server/src/vcf.*.js` - Variant file handling |
| BED parsing      | `server/src/bedj.js` - BED/BigBed processing  |
| Streaming        | Handle large genomic files efficiently        |
| Tabix indexing   | Fast region-based file access                 |
| Error recovery   | Graceful handling of malformed data           |

### ProteinPaint File Processing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  ProteinPaint File Processing                               │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  VCF    │  │  BED    │  │  BAM    │  │  BigWig │       │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │
│       │            │            │            │              │
│  ┌────▼────────────▼────────────▼────────────▼────────┐   │
│  │              Index Layer (Tabix/BAI/etc)            │   │
│  │  Fast random access by genomic coordinates          │   │
│  └────────────────────────┬────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────▼────────────────────────────┐   │
│  │              Stream Parser                           │   │
│  │  Line-by-line processing for memory efficiency      │   │
│  │  Chunk-based for large files                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Relevant ProteinPaint Files

- `server/src/vcf.*.js` - VCF parsing modules
- `server/src/bedj.js` - BED file handling
- `server/src/bam.js` - BAM/CRAM reading
- `server/src/bigwig.js` - BigWig/BigBed support

## Exercises

### Exercise 1: MAF Parser

Build a parser for Mutation Annotation Format (MAF):

**Requirements:**

- Parse TCGA MAF files
- Extract Hugo_Symbol, Chromosome, Start_Position
- Convert to VCF-like structure

### Exercise 2: FASTA Indexing

Create an indexed FASTA reader:

**Requirements:**

- Parse FAI index files
- Fetch sequences by region
- Handle multi-line FASTA

### Exercise 3: GTF Parser

Parse GTF gene annotation files:

**Requirements:**

- Extract gene/transcript/exon hierarchy
- Build gene models
- Handle attribute parsing

### Exercise 4: Streaming Large Files

Process a large VCF without loading into memory:

**Requirements:**

- Use Node.js streams
- Progress reporting
- Memory usage under 100MB for 10GB file

## Next Steps

- **Tutorial 2.4: R Integration** - Statistical analysis with R
- **Phase 3: Advanced Visualization** - Use parsed data in visualizations

## Resources

- [VCF Specification](https://samtools.github.io/hts-specs/VCFv4.3.pdf)
- [GFF3 Specification](https://github.com/The-Sequence-Ontology/Specifications/blob/master/gff3.md)
- [BED Format](https://genome.ucsc.edu/FAQ/FAQformat.html#format1)
- [Bioinformatics File Formats](https://www.ncbi.nlm.nih.gov/sra/docs/submitformats/)

---

## 🎯 Interview Preparation Q&A

### Q1: What are the key differences between VCF, GFF3, and BED formats?

**Answer:**
| Feature | VCF | GFF3 | BED |
|---------|-----|------|-----|
| Purpose | Genetic variants | Gene annotations | Genomic intervals |
| Coordinate system | 1-based, inclusive | 1-based, inclusive | 0-based, half-open |
| Structure | Header + records | Hierarchical (gene→transcript→exon) | Flat records |
| Sample data | Yes (genotypes) | No | No |
| Typical use | Variant calling output | Gene models | Regions, peaks |

**Conversion note:** When converting BED to VCF coordinates: `vcf_pos = bed_start + 1`

---

### Q2: How would you efficiently parse a 10GB VCF file?

**Answer:**

```javascript
import { createReadStream } from 'fs';
import { createInterface } from 'readline';

async function* parseVcfStream(filePath) {
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;

    // Skip headers
    if (line.startsWith('#')) {
      if (line.startsWith('#CHROM')) {
        yield { type: 'header', columns: line.split('\t') };
      }
      continue;
    }

    // Parse data line
    try {
      yield { type: 'record', data: parseVcfLine(line), lineNum };
    } catch (error) {
      yield { type: 'error', lineNum, message: error.message };
    }
  }
}

// Usage with backpressure handling
for await (const item of parseVcfStream('large.vcf')) {
  if (item.type === 'record') {
    await processVariant(item.data); // Async allows memory release
  }
}
```

**Key techniques:**

- **Streaming:** Never load entire file
- **Generators:** Yield records one at a time
- **Async iteration:** Handle backpressure
- **Error recovery:** Skip bad lines, continue parsing

---

### Q3: Explain the VCF INFO field and how to parse it.

**Answer:**

```
INFO=DP=150;AF=0.35;CSQ=missense_variant|ENST00000269305|TP53|R175H
```

```javascript
function parseInfo(infoStr) {
  const info = {};

  for (const pair of infoStr.split(';')) {
    if (pair.includes('=')) {
      const [key, value] = pair.split('=', 2);

      // Handle VEP/CSQ annotations
      if (key === 'CSQ') {
        info[key] = value.split(',').map((v) => {
          const fields = v.split('|');
          return {
            consequence: fields[0],
            transcript: fields[1],
            gene: fields[2],
            aaChange: fields[3],
          };
        });
      }
      // Handle numeric values
      else if (!isNaN(value)) {
        info[key] = parseFloat(value);
      }
      // Handle lists
      else if (value.includes(',')) {
        info[key] = value.split(',');
      } else {
        info[key] = value;
      }
    } else {
      // Flag (no value)
      info[pair] = true;
    }
  }

  return info;
}
```

---

### Q4: How do you build a hierarchical gene model from GFF3?

**Answer:**

```javascript
function buildGeneModels(features) {
  const byId = new Map();
  const genes = [];

  // First pass: index all features
  for (const feature of features) {
    byId.set(feature.id, { ...feature, children: [] });
  }

  // Second pass: build hierarchy
  for (const feature of features) {
    const parent = feature.attributes?.Parent;

    if (parent && byId.has(parent)) {
      byId.get(parent).children.push(byId.get(feature.id));
    } else if (feature.type === 'gene') {
      genes.push(byId.get(feature.id));
    }
  }

  // Structure result
  return genes.map((gene) => ({
    id: gene.id,
    symbol: gene.attributes.Name,
    start: gene.start,
    end: gene.end,
    strand: gene.strand,
    transcripts: gene.children
      .filter((c) => c.type === 'mRNA')
      .map((t) => ({
        id: t.id,
        exons: t.children.filter((c) => c.type === 'exon').sort((a, b) => a.start - b.start),
      })),
  }));
}
```

---

### Q5: What indexing strategies does ProteinPaint use for genomic files?

**Answer:** ProteinPaint leverages several indexing approaches:

1. **Tabix indexing (VCF, BED, GFF):**
   - Compressed with bgzip
   - Indexed by chromosome + position
   - O(log n) region queries

   ```bash
   bgzip variants.vcf
   tabix -p vcf variants.vcf.gz
   ```

2. **BigWig/BigBed:**
   - Binary format with built-in index
   - Supports zoom levels for different resolutions
   - Efficient for coverage tracks

3. **BAM/CRAM:**
   - BAI/CRAI index files
   - Random access by coordinate

4. **Custom SQLite indexes:**
   - Pre-computed for dataset-specific queries
   - Bundled with ProteinPaint datasets

**Access pattern:**

```javascript
// ProteinPaint tabix query
const variants = await tabix.query('chr17', 7668402, 7687550);
```

---

[← Back to Tutorials Index](../../README.md)
