[← Back to Phase 2](../README.md)

---

# Tutorial 2.5: Binary Genomic File Formats

> Parse production genomic file formats: BAM, BigWig, and indexed files

## Overview

Real genomic data comes in binary formats (BAM, BigWig, HDF5) that require specialized parsing. Text formats like VCF and BED are great for learning, but production pipelines use binary formats for:

- **Compression**: 10-100x smaller file sizes
- **Random Access**: Query specific regions without reading entire files
- **Streaming**: Process gigabyte files without loading into memory
- **Indexing**: Sub-second lookups in terabyte datasets

This tutorial teaches you to work with the formats used by TCGA, GDC, ENCODE, and every major genomics platform.

## Learning Objectives

By the end of this tutorial, you will be able to:

- [ ] Understand binary file format structures (BAM, BigWig)
- [ ] Parse BAM files and extract read alignments
- [ ] Read BigWig coverage data for specific genomic regions
- [ ] Use index files (BAI, TBI) for random access
- [ ] Stream large files without loading into memory
- [ ] Build a simple genome coverage viewer

## Prerequisites

- Tutorial 2.3 (File Parsing - VCF, BED, GFF)
- Basic understanding of sequencing reads
- Node.js 18+

## Project Structure

```
05-binary-formats/
├── package.json
├── README.md
├── start-tutorial.sh
├── data/
│   ├── sample.bam           # Small BAM file
│   ├── sample.bam.bai       # BAM index
│   ├── sample.bw            # BigWig coverage
│   └── README.md
├── src/
│   ├── server.js            # Express server
│   ├── parsers/
│   │   ├── index.js
│   │   ├── bamParser.js     # BAM parsing
│   │   ├── bigwigParser.js  # BigWig parsing
│   │   └── indexedFile.js   # Generic indexed access
│   ├── routes/
│   │   ├── bam.js           # BAM API endpoints
│   │   └── bigwig.js        # BigWig API endpoints
│   └── examples/
│       ├── 01-bam-structure.js
│       ├── 02-read-alignments.js
│       ├── 03-bigwig-signals.js
│       ├── 04-random-access.js
│       └── 05-streaming.js
└── exercises/
    ├── exercise-1.md
    ├── exercise-2.md
    └── solutions/
```

## Getting Started

```bash
cd tutorials/phase-2-backend/05-binary-formats
npm install
npm run dev
```

Server runs at **http://localhost:3005**

## Key Concepts

### Why Binary Formats?

| Aspect         | Text (VCF, BED)     | Binary (BAM, BigWig) |
| -------------- | ------------------- | -------------------- |
| Human readable | ✅ Yes              | ❌ No                |
| File size      | Large               | 10-100x smaller      |
| Random access  | ❌ Slow (scan file) | ✅ Fast (indexed)    |
| Memory usage   | High                | Low (streaming)      |
| Parse speed    | Slow                | Fast                 |

### BAM File Structure

BAM (Binary Alignment Map) stores sequencing reads:

```
┌─────────────────────────────────────┐
│ BAM Header                          │
│ - Magic number (BAM\\1)             │
│ - Reference sequences (@SQ)         │
│ - Read groups (@RG)                 │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ BGZF Block 1 (compressed)           │
│ ├── Alignment record 1              │
│ ├── Alignment record 2              │
│ └── ...                             │
├─────────────────────────────────────┤
│ BGZF Block 2                        │
├─────────────────────────────────────┤
│ ...                                 │
└─────────────────────────────────────┘
```

### BigWig File Structure

BigWig stores signal/coverage data:

```
┌─────────────────────────────────────┐
│ Header (magic, version, zooms)      │
├─────────────────────────────────────┤
│ Chromosome B+ Tree                  │
├─────────────────────────────────────┤
│ R-Tree Spatial Index                │
├─────────────────────────────────────┤
│ Zoom Level Data (pre-aggregated)    │
├─────────────────────────────────────┤
│ Raw Data Blocks                     │
└─────────────────────────────────────┘
```

## API Endpoints

### BAM Endpoints

```bash
# Get BAM header
curl http://localhost:3005/api/bam/header

# Get reads in region
curl http://localhost:3005/api/bam/reads/chr17/7668402/7687550

# Get coverage
curl http://localhost:3005/api/bam/coverage/chr17/7668402/7687550?binSize=100
```

### BigWig Endpoints

```bash
# Get chromosomes
curl http://localhost:3005/api/bigwig/chromosomes

# Get signal for region
curl http://localhost:3005/api/bigwig/signal/chr17/7668402/7687550
```

## Exercises

### Exercise 1: Parse BAM Header

Extract and display all reference sequences from a BAM file.

### Exercise 2: Extract TP53 Reads

Query reads overlapping the TP53 gene and calculate statistics.

### Exercise 3: Build Coverage Track

Generate binned coverage data and visualize with D3.js.

## Sample Data

The `data/` directory contains small sample files for learning:

| File           | Description                  | Size   |
| -------------- | ---------------------------- | ------ |
| sample.bam     | Aligned reads (chr17 region) | ~5MB   |
| sample.bam.bai | BAM index                    | ~100KB |
| sample.bw      | Coverage track               | ~2MB   |

For larger datasets, see the data download script.

## Key Libraries

- **@gmod/bam**: BAM file parsing
- **@gmod/bbi**: BigWig/BigBed reading
- **@gmod/tabix**: Tabix-indexed file access
- **generic-filehandle**: Local and remote file I/O

## Next Steps

After completing this tutorial:

- Use BAM data in the Genome Browser (Phase 1.4)
- Build coverage tracks with Canvas (Phase 1.5 - Performance)
- Parse gene fusion data (Phase 3.6)

---

## Resources

- [SAM/BAM Specification](https://samtools.github.io/hts-specs/SAMv1.pdf)
- [BigWig Format](https://genome.ucsc.edu/goldenPath/help/bigWig.html)
- [@gmod/bam Documentation](https://github.com/GMOD/bam-js)

---

_Tutorial 2.5 - Binary Genomic Formats_
