# Implementation Plan: Binary Genomic Formats (Phase 2.5)

> Parse production genomic file formats: BAM, BigWig, and indexed files

## Overview

This tutorial fills the most critical gap in our curriculum. Real genomic data comes in binary formats (BAM, BigWig, HDF5) that require specialized parsing. Without this knowledge, students cannot work with data from TCGA, GDC, ENCODE, or any production genomics platform.

---

## Learning Objectives

By the end of this tutorial, students will be able to:

1. Understand binary file format structures (BAM, BigWig)
2. Parse BAM files and extract read alignments
3. Read BigWig coverage data for specific genomic regions
4. Use index files (BAI, TBI) for random access
5. Stream large files without loading into memory
6. Build a simple genome coverage viewer

---

## Tutorial Structure

```
05-binary-formats/
├── README.md
├── package.json
├── start-tutorial.sh
├── data/
│   ├── sample.bam           # Small BAM file (~10MB)
│   ├── sample.bam.bai       # BAM index
│   ├── sample.bw            # BigWig coverage
│   └── README.md            # Data sources
├── src/
│   ├── server.js            # Express server
│   ├── parsers/
│   │   ├── index.js
│   │   ├── bamParser.js     # BAM parsing
│   │   ├── bigwigParser.js  # BigWig parsing
│   │   └── indexedFile.js   # Generic indexed access
│   ├── routes/
│   │   ├── bam.js           # BAM API endpoints
│   │   ├── bigwig.js        # BigWig API endpoints
│   │   └── coverage.js      # Coverage track data
│   └── examples/
│       ├── 01-bam-structure.js
│       ├── 02-read-alignments.js
│       ├── 03-bigwig-signals.js
│       ├── 04-random-access.js
│       └── 05-streaming.js
└── exercises/
    ├── exercise-1.md        # Parse BAM header
    ├── exercise-2.md        # Extract reads in region
    ├── exercise-3.md        # Build coverage track
    └── solutions/
```

---

## Module 1: Understanding Binary Formats

### 1.1 Why Binary Formats?

```markdown
Text formats (VCF, BED):

- Human readable ✓
- Easy to parse ✓
- Large file sizes ✗
- Slow random access ✗

Binary formats (BAM, BigWig):

- Compressed storage ✓
- Fast random access ✓
- Indexed regions ✓
- Requires libraries ✗
```

### 1.2 BAM File Structure

```javascript
// BAM file anatomy
const bamStructure = {
  magic: 'BAM\1', // 4 bytes magic number
  header: {
    headerLength: 'int32', // Length of header text
    headerText: 'string', // SAM header (@HD, @SQ, @RG, @PG)
    nRef: 'int32', // Number of reference sequences
    references: [
      // Reference sequence info
      { name: 'string', length: 'int32' },
    ],
  },
  alignments: [
    // BGZF-compressed blocks
    {
      blockSize: 'int32',
      refID: 'int32', // Reference sequence index
      pos: 'int32', // 0-based position
      mapq: 'uint8', // Mapping quality
      cigar: 'uint32[]', // CIGAR operations
      seq: 'packed', // 4-bit encoded sequence
      qual: 'uint8[]', // Quality scores
      tags: 'tagged', // Optional fields
    },
  ],
};
```

### 1.3 BigWig File Structure

```javascript
// BigWig file structure
const bigWigStructure = {
  header: {
    magic: 0x888FFC26,      // BigWig magic number
    version: 'uint16',
    zoomLevels: 'uint16',   // Pre-computed zoom levels
    chromTreeOffset: 'uint64',
    fullDataOffset: 'uint64',
    fullIndexOffset: 'uint64'
  },
  chromTree: {              // B+ tree of chromosomes
    // Binary tree structure
  },
  dataIndex: {              // R-tree spatial index
    // For fast region queries
  },
  zoomData: [               // Pre-aggregated data
    { reductionLevel: 10, data: [...] },
    { reductionLevel: 40, data: [...] }
  ]
};
```

---

## Module 2: BAM Parsing Implementation

### 2.1 Setup and Dependencies

```javascript
// package.json dependencies
{
  "dependencies": {
    "@gmod/bam": "^1.1.2",
    "generic-filehandle": "^3.0.0",
    "pako": "^2.1.0"
  }
}
```

### 2.2 Basic BAM Reading

```javascript
// src/parsers/bamParser.js
import { BamFile } from '@gmod/bam';
import { LocalFile, RemoteFile } from 'generic-filehandle';

export class BamParser {
  constructor(bamPath, baiPath) {
    this.bam = new BamFile({
      bamFilehandle: new LocalFile(bamPath),
      baiFilehandle: new LocalFile(baiPath || `${bamPath}.bai`),
    });
  }

  async getHeader() {
    const header = await this.bam.getHeader();
    return {
      references: header.references,
      readGroups: header.readGroups,
      programs: header.programs,
    };
  }

  async getReadsInRegion(chr, start, end, opts = {}) {
    const records = [];

    await this.bam.getRecordsForRange(
      chr,
      start,
      end,
      {
        viewAsPairs: opts.pairs || false,
        maxInsertSize: opts.maxInsert || 1000,
      },
      (record) => {
        records.push(this.formatRecord(record));
      }
    );

    return records;
  }

  formatRecord(record) {
    return {
      name: record.name(),
      start: record.get('start'),
      end: record.get('end'),
      strand: record.isReverseComplemented() ? '-' : '+',
      mapq: record.mappingQuality(),
      cigar: record.cigar(),
      sequence: record.seq(),
      quality: record.qualityScores(),
      paired: record.isPaired(),
      properPair: record.isProperlyPaired(),
      tags: {
        MD: record.get('MD'),
        NM: record.get('NM'),
        XS: record.get('XS'),
      },
    };
  }

  async getCoverage(chr, start, end, binSize = 100) {
    const coverage = new Array(Math.ceil((end - start) / binSize)).fill(0);

    await this.bam.getRecordsForRange(chr, start, end, {}, (record) => {
      const readStart = record.get('start');
      const readEnd = record.get('end');

      for (let pos = Math.max(readStart, start); pos < Math.min(readEnd, end); pos++) {
        const binIndex = Math.floor((pos - start) / binSize);
        if (binIndex >= 0 && binIndex < coverage.length) {
          coverage[binIndex]++;
        }
      }
    });

    return coverage.map((count, i) => ({
      start: start + i * binSize,
      end: start + (i + 1) * binSize,
      value: count / binSize, // Normalize by bin size
    }));
  }
}
```

### 2.3 BAM API Routes

```javascript
// src/routes/bam.js
import express from 'express';
import { BamParser } from '../parsers/bamParser.js';

const router = express.Router();

// Get BAM header
router.get('/header', async (req, res) => {
  try {
    const parser = new BamParser('./data/sample.bam');
    const header = await parser.getHeader();
    res.json(header);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get reads in region
router.get('/reads/:chr/:start/:end', async (req, res) => {
  try {
    const { chr, start, end } = req.params;
    const parser = new BamParser('./data/sample.bam');

    const reads = await parser.getReadsInRegion(chr, parseInt(start), parseInt(end));

    res.json({
      region: `${chr}:${start}-${end}`,
      count: reads.length,
      reads: reads.slice(0, 1000), // Limit for API response
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get coverage
router.get('/coverage/:chr/:start/:end', async (req, res) => {
  try {
    const { chr, start, end } = req.params;
    const binSize = parseInt(req.query.binSize) || 100;

    const parser = new BamParser('./data/sample.bam');
    const coverage = await parser.getCoverage(chr, parseInt(start), parseInt(end), binSize);

    res.json({
      region: `${chr}:${start}-${end}`,
      binSize,
      data: coverage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

---

## Module 3: BigWig Parsing Implementation

### 3.1 BigWig Reader

```javascript
// src/parsers/bigwigParser.js
import { BigWig } from '@gmod/bbi';
import { LocalFile, RemoteFile } from 'generic-filehandle';

export class BigWigParser {
  constructor(bwPath) {
    this.bw = new BigWig({
      filehandle: new LocalFile(bwPath),
    });
    this.headerPromise = null;
  }

  async initialize() {
    if (!this.headerPromise) {
      this.headerPromise = this.bw.getHeader();
    }
    return this.headerPromise;
  }

  async getChromosomes() {
    const header = await this.initialize();
    return Object.entries(header.chromTree).map(([name, id]) => ({
      name,
      id,
      length: header.refsByName[name]?.length,
    }));
  }

  async getSignal(chr, start, end, opts = {}) {
    await this.initialize();

    // Get features (signal values) for region
    const features = await this.bw.getFeatures(chr, start, end, {
      scale: opts.scale || 1,
      basesPerSpan: opts.basesPerSpan,
    });

    return features.map((f) => ({
      start: f.start,
      end: f.end,
      score: f.score,
    }));
  }

  async getStats(chr, start, end, numBins = 100) {
    await this.initialize();

    // Get summary statistics
    const stats = await this.bw.getFeatureStream(chr, start, end, {
      scale: numBins / (end - start),
    });

    return stats;
  }

  async getZoomLevels() {
    const header = await this.initialize();
    return header.zoomLevels.map((z, i) => ({
      level: i,
      reductionLevel: z.reductionLevel,
      dataOffset: z.dataOffset,
    }));
  }
}
```

### 3.2 BigWig API Routes

```javascript
// src/routes/bigwig.js
import express from 'express';
import { BigWigParser } from '../parsers/bigwigParser.js';

const router = express.Router();

// Get chromosomes
router.get('/chromosomes', async (req, res) => {
  try {
    const parser = new BigWigParser('./data/sample.bw');
    const chroms = await parser.getChromosomes();
    res.json(chroms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get signal for region
router.get('/signal/:chr/:start/:end', async (req, res) => {
  try {
    const { chr, start, end } = req.params;
    const parser = new BigWigParser('./data/sample.bw');

    const signal = await parser.getSignal(chr, parseInt(start), parseInt(end));

    res.json({
      region: `${chr}:${start}-${end}`,
      points: signal.length,
      data: signal,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get binned statistics
router.get('/stats/:chr/:start/:end', async (req, res) => {
  try {
    const { chr, start, end } = req.params;
    const bins = parseInt(req.query.bins) || 100;

    const parser = new BigWigParser('./data/sample.bw');
    const stats = await parser.getStats(chr, parseInt(start), parseInt(end), bins);

    res.json({
      region: `${chr}:${start}-${end}`,
      bins,
      data: stats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

---

## Module 4: Indexed Random Access

### 4.1 Understanding Index Files

```javascript
// src/parsers/indexedFile.js
import { TabixIndexedFile } from '@gmod/tabix';
import { LocalFile } from 'generic-filehandle';

export class TabixParser {
  constructor(filePath, indexPath) {
    this.file = new TabixIndexedFile({
      filehandle: new LocalFile(filePath),
      tbiFilehandle: new LocalFile(indexPath || `${filePath}.tbi`),
    });
  }

  async getHeader() {
    return this.file.getHeader();
  }

  async getLines(chr, start, end) {
    const lines = [];
    await this.file.getLines(chr, start, end, (line) => {
      lines.push(line);
    });
    return lines;
  }

  async *streamLines(chr, start, end) {
    const iterator = await this.file.getLines(chr, start, end);
    for await (const line of iterator) {
      yield line;
    }
  }
}

// Usage example
async function queryTabixFile() {
  const parser = new TabixParser('./data/variants.vcf.gz');

  // Get all variants in region
  const variants = await parser.getLines('chr17', 7668402, 7687550);

  console.log(`Found ${variants.length} variants in TP53 region`);
  return variants;
}
```

### 4.2 BGZF Compression

```javascript
// Understanding BGZF (Block GZIP) format
// Used by BAM, tabix-indexed files

/*
BGZF Structure:
┌─────────────────────────────────────┐
│ Block 1 (max 64KB uncompressed)     │
├─────────────────────────────────────┤
│ Block 2                             │
├─────────────────────────────────────┤
│ Block 3                             │
├─────────────────────────────────────┤
│ ...                                 │
└─────────────────────────────────────┘

Each block:
- Independent gzip compression
- Can decompress any block without reading previous blocks
- Enables random access via virtual file offsets
*/

import pako from 'pako';

function decompressBGZFBlock(compressed) {
  // BGZF blocks are gzip with extra metadata
  const inflated = pako.inflate(compressed);
  return inflated;
}

// Virtual file offset = (block_offset << 16) | within_block_offset
function parseVirtualOffset(vOffset) {
  return {
    blockOffset: vOffset >> 16n,
    withinBlockOffset: vOffset & 0xffffn,
  };
}
```

---

## Module 5: Streaming Large Files

### 5.1 Stream Processing

```javascript
// src/examples/05-streaming.js
import { BamFile } from '@gmod/bam';
import { RemoteFile } from 'generic-filehandle';

// Stream reads from a remote BAM file
export async function streamRemoteBAM(url, region) {
  const bam = new BamFile({
    bamFilehandle: new RemoteFile(url),
    baiFilehandle: new RemoteFile(`${url}.bai`),
  });

  const { chr, start, end } = parseRegion(region);

  // Process in chunks without loading all into memory
  let processedCount = 0;

  await bam.getRecordsForRange(chr, start, end, { viewAsPairs: false }, (record) => {
    // Process each record as it arrives
    processRecord(record);
    processedCount++;

    // Optional: Stop after N records
    if (processedCount >= 10000) {
      return false; // Signal to stop iteration
    }
  });

  console.log(`Processed ${processedCount} reads`);
}

function parseRegion(regionStr) {
  const match = regionStr.match(/^(chr\w+):(\d+)-(\d+)$/);
  return {
    chr: match[1],
    start: parseInt(match[2]),
    end: parseInt(match[3]),
  };
}

function processRecord(record) {
  // Example: Count by mapping quality
  const mapq = record.mappingQuality();
  // ... process
}
```

### 5.2 HTTP Range Requests

```javascript
// Understanding how remote file access works

/*
HTTP Range Requests enable partial file downloads:

Client sends:
  GET /path/to/file.bam HTTP/1.1
  Range: bytes=1000000-1001000

Server responds:
  HTTP/1.1 206 Partial Content
  Content-Range: bytes 1000000-1001000/50000000
  Content-Length: 1001
  
  [1001 bytes of data]

This is how @gmod/bam reads specific regions without downloading entire files!
*/

// Implementing basic range request
async function fetchRange(url, start, end) {
  const response = await fetch(url, {
    headers: {
      Range: `bytes=${start}-${end}`,
    },
  });

  if (response.status !== 206) {
    throw new Error('Server does not support range requests');
  }

  return response.arrayBuffer();
}
```

---

## Exercises

### Exercise 1: Parse BAM Header

````markdown
# Exercise 1: Parse BAM Header

## Objective

Extract and display reference sequences from a BAM file header.

## Tasks

1. Load the sample BAM file
2. Extract all reference sequences (chromosomes)
3. Display their names and lengths
4. Calculate total genome size covered

## Expected Output

```json
{
  "references": [
    { "name": "chr1", "length": 248956422 },
    { "name": "chr2", "length": 242193529 },
    ...
  ],
  "totalSize": 3088269832
}
```
````

## Hints

- Use `BamParser.getHeader()`
- Reference sequences are in `@SQ` header lines

````

### Exercise 2: Extract Reads in TP53

```markdown
# Exercise 2: Extract Reads in TP53 Region

## Objective
Query reads overlapping the TP53 gene and analyze their properties.

## Region
chr17:7668402-7687550 (TP53 gene)

## Tasks
1. Query all reads in the TP53 region
2. Calculate:
   - Total read count
   - Average mapping quality
   - Strand distribution (+/-)
   - Properly paired percentage
3. Find the highest-quality read

## Starter Code
```javascript
const parser = new BamParser('./data/sample.bam');
const reads = await parser.getReadsInRegion('chr17', 7668402, 7687550);

// Your analysis here
````

````

### Exercise 3: Build Coverage Track

```markdown
# Exercise 3: Build a Coverage Track

## Objective
Generate binned coverage data and display it as a bar chart.

## Tasks
1. Calculate coverage for chr17:7668402-7687550
2. Use 50bp bins
3. Create a D3.js visualization:
   - X-axis: Genomic position
   - Y-axis: Read depth
   - Color by depth (gradient)

## Visualization Requirements
- SVG dimensions: 800x200
- Axis labels with genomic coordinates
- Hover tooltips showing exact coverage

## Bonus
- Add BigWig track overlay
- Compare BAM-computed vs BigWig coverage
````

---

## Sample Data Sources

### Recommended Data Files

| File        | Source       | Size   | Download                                |
| ----------- | ------------ | ------ | --------------------------------------- |
| NA12878.bam | 1000 Genomes | ~100MB | [Link](ftp://ftp.1000genomes.ebi.ac.uk) |
| ENCFF\*.bw  | ENCODE       | ~50MB  | [Link](https://www.encodeproject.org)   |
| test.bam    | Samtools     | ~5MB   | Included                                |

### Data Download Script

```bash
#!/bin/bash
# data/download-samples.sh

# Create data directory
mkdir -p data

# Download small test BAM (chr17 region only)
curl -o data/sample.bam \
  "https://example.com/small-sample.bam"

# Download BAM index
curl -o data/sample.bam.bai \
  "https://example.com/small-sample.bam.bai"

# Download BigWig (ENCODE ChIP-seq)
curl -o data/sample.bw \
  "https://example.com/sample-chipseq.bw"

echo "Sample data downloaded!"
```

---

## Assessment Criteria

### Knowledge Check

1. Explain the difference between BAM and SAM formats
2. Why do BAM files use BGZF compression?
3. What information is stored in a BAI index file?
4. How does BigWig achieve fast random access?
5. When would you use tabix vs BAI indexing?

### Practical Skills

- [ ] Successfully parse a BAM file header
- [ ] Extract reads from a specific genomic region
- [ ] Calculate coverage from read alignments
- [ ] Read BigWig signal data
- [ ] Implement streaming for large files
- [ ] Handle both local and remote files

---

## Next Steps

After completing this tutorial:

1. **Phase 3.6 (Gene Fusion)** - Use BAM parsing for fusion detection
2. **Phase 1.5 (Performance)** - Apply streaming to visualization
3. **Phase 4.4 (Rust)** - Build faster parsers in Rust

---

_Implementation plan for Tutorial 2.5 - Binary Genomic Formats_
