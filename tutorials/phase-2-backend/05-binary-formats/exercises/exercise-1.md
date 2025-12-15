# Exercise 1: BAM Header Analysis

## Objective

Extract and analyze header information from a BAM file to understand the sample and reference genome used.

## Background

Every BAM file contains a header section with metadata about:

- The reference genome used for alignment
- Sample information (read groups)
- Software used to generate the file

Understanding this metadata is crucial for proper data interpretation.

## Tasks

### Task 1: Extract Reference Information

Parse the BAM header and create a summary of all reference sequences (chromosomes).

**Requirements:**

- Total number of references
- Total genome size (sum of all reference lengths)
- List of main chromosomes (chr1-22, X, Y) vs other sequences

```javascript
// Your code here
async function analyzeReferences(bamPath) {
  // 1. Open BAM file
  // 2. Get header
  // 3. Calculate statistics
  // Return: { totalReferences, genomeSize, mainChromosomes, otherSequences }
}
```

### Task 2: Identify Sample Information

Extract read group information to identify the sample.

**Requirements:**

- Extract all read group IDs
- Find sample names if available
- Identify sequencing platform if mentioned

### Task 3: Validate Header Completeness

Check if the BAM file has all required header elements.

**Required elements:**

- [ ] @HD line with version
- [ ] @SQ lines for all chromosomes
- [ ] At least one @RG line
- [ ] @PG line showing alignment software

## Expected Output

```
BAM Header Analysis
═══════════════════════════════════════════════════════════

File: sample.bam
Format Version: 1.6
Sort Order: coordinate

Reference Genome:
  Total sequences: 93
  Main chromosomes: 24
  Other sequences: 69
  Total genome size: 3,088,286,401 bp

Sample Information:
  Read Groups: 1
  Sample ID: TCGA-XX-XXXX
  Platform: ILLUMINA

Header Validation:
  ✓ HD line present
  ✓ SQ lines present (93)
  ✓ RG lines present (1)
  ✓ PG lines present (1)
```

## Hints

1. Use the `getHeader()` method from BamParser
2. Regular expressions help parse header lines
3. Main chromosomes follow patterns: chr1-22, chrX, chrY, or 1-22, X, Y

## Bonus Challenge

Create a function that compares two BAM headers and reports differences. This is useful for checking if files can be merged.

## Solution

See `solutions/exercise-1-solution.js`
