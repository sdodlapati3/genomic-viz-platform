# Tutorial 2.4: R Integration for Statistical Analysis

## Overview

This tutorial teaches how to integrate R statistical computing with Node.js for genomic data analysis. You'll learn to perform survival analysis, differential expression, and mutation pattern analysis.

## Learning Objectives

1. Execute R scripts from Node.js using child_process
2. Perform Kaplan-Meier survival analysis
3. Conduct differential expression analysis
4. Analyze mutation patterns across cancer types
5. Implement JavaScript fallbacks for when R is unavailable

## Project Structure

```
04-r-integration/
├── package.json
├── README.md
├── start-tutorial.sh
├── data/
│   ├── survival_data.csv      # Survival outcomes by mutation
│   ├── expression_data.csv    # Gene expression matrix
│   └── mutation_frequency.csv # Mutation counts by cancer
└── src/
    ├── server.js              # Express API server
    ├── services/
    │   ├── rService.js        # R script executor
    │   └── jsStats.js         # JavaScript statistics fallback
    ├── routes/
    │   └── analysis.js        # API endpoints
    ├── r-scripts/
    │   ├── survival_analysis.R
    │   ├── expression_analysis.R
    │   └── mutation_analysis.R
    └── examples/
        ├── testRConnection.js
        ├── survivalAnalysis.js
        ├── expressionAnalysis.js
        └── mutationAnalysis.js
```

## Getting Started

### Prerequisites

**R Installation (optional but recommended):**

```bash
# macOS
brew install r

# Ubuntu/Debian
sudo apt-get install r-base

# Windows
# Download from https://cran.r-project.org/
```

**R Packages (if R is installed):**
```r
install.packages(c("survival", "survminer", "jsonlite"))
```

### Quick Start

```bash
cd tutorials/phase-2-backend/04-r-integration
npm install
npm run dev
```

Server runs at **http://localhost:3004**

### Run Examples

```bash
# Test R connection
npm run test:r

# Survival analysis example
npm run example:survival

# Expression analysis example
npm run example:expression

# Mutation analysis example
npm run example:mutation
```

## Statistical Analyses

### 1. Survival Analysis

**Kaplan-Meier Analysis**: Compare survival between mutation groups.

```bash
curl http://localhost:3004/api/analysis/survival/kaplan-meier?gene=TP53
```

**Response:**
```json
{
  "success": true,
  "engine": "JavaScript",
  "data": {
    "analysis_type": "kaplan_meier",
    "gene": "TP53",
    "n_samples": 30,
    "groups": ["mutated", "wildtype"],
    "logrank_pvalue": 0.0023,
    "significant": true,
    "curves": {
      "mutated": [{"time": 0, "survival": 1.0}, ...],
      "wildtype": [{"time": 0, "survival": 1.0}, ...]
    }
  }
}
```

**Cox Regression** (requires R):
```bash
curl http://localhost:3004/api/analysis/survival/cox
```

### 2. Expression Analysis

**Differential Expression**: Compare tumor vs normal expression.

```bash
curl http://localhost:3004/api/analysis/expression/differential
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis_type": "differential_expression",
    "n_tumor": 10,
    "n_normal": 10,
    "results": [
      {
        "gene": "TP53",
        "tumor_mean": 3.49,
        "normal_mean": 5.95,
        "log2_fold_change": -2.46,
        "pvalue": 0.00001,
        "significant": true,
        "direction": "down"
      }
    ]
  }
}
```

**Volcano Plot Data**:
```bash
curl http://localhost:3004/api/analysis/expression/volcano
```

**Gene Correlation**:
```bash
curl http://localhost:3004/api/analysis/expression/correlation
```

### 3. Mutation Analysis

**Enrichment by Cancer Type**:
```bash
curl http://localhost:3004/api/analysis/mutation/enrichment
```

**Mutual Exclusivity**:
```bash
curl http://localhost:3004/api/analysis/mutation/exclusivity
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/analysis/status` | Check R availability |
| `GET /api/analysis/survival/kaplan-meier` | Kaplan-Meier analysis |
| `GET /api/analysis/survival/cox` | Cox regression |
| `GET /api/analysis/expression/differential` | Differential expression |
| `GET /api/analysis/expression/volcano` | Volcano plot data |
| `GET /api/analysis/expression/correlation` | Gene correlations |
| `GET /api/analysis/mutation/enrichment` | Mutation enrichment |
| `GET /api/analysis/mutation/exclusivity` | Mutual exclusivity |

## Key Concepts

### R Integration Pattern

```javascript
import { spawn } from 'child_process';

async function executeRScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const rProcess = spawn('Rscript', ['--vanilla', scriptPath, ...args]);
    
    let stdout = '';
    rProcess.stdout.on('data', data => stdout += data);
    
    rProcess.on('close', code => {
      if (code === 0) {
        resolve(JSON.parse(stdout));
      } else {
        reject(new Error('R script failed'));
      }
    });
  });
}
```

### JavaScript Fallback Statistics

```javascript
// Two-sample t-test
function tTest(group1, group2) {
  const m1 = mean(group1), m2 = mean(group2);
  const v1 = variance(group1), v2 = variance(group2);
  const n1 = group1.length, n2 = group2.length;
  
  const pooledVar = ((n1-1)*v1 + (n2-1)*v2) / (n1+n2-2);
  const t = (m1 - m2) / Math.sqrt(pooledVar * (1/n1 + 1/n2));
  
  return { statistic: t, pvalue: twoTailPValue(t, n1+n2-2) };
}
```

### Kaplan-Meier Estimation

```javascript
function kaplanMeier(times, events) {
  let nRisk = times.length;
  let survival = 1.0;
  const curve = [{ time: 0, survival: 1.0 }];
  
  for (const time of sortedUniqueTimes) {
    const deaths = countEventsAt(time);
    survival *= (nRisk - deaths) / nRisk;
    curve.push({ time, survival, nRisk });
    nRisk -= deathsAndCensoredAt(time);
  }
  
  return curve;
}
```

## Exercises

### Exercise 1: Add Forest Plot Data
Create an endpoint that returns forest plot data for multi-gene survival analysis:

```javascript
router.get('/survival/forest', async (req, res) => {
  // Analyze each gene independently
  // Return hazard ratios with confidence intervals
});
```

### Exercise 2: Gene Set Enrichment
Implement GSEA-like analysis:

```javascript
function geneSetEnrichment(rankedGenes, geneSet) {
  // Calculate enrichment score
  // Return normalized enrichment score and p-value
}
```

### Exercise 3: Mutation Signature Analysis
Add mutation signature decomposition:

```javascript
router.get('/mutation/signatures', async (req, res) => {
  // Decompose mutation matrix into known signatures
  // Return signature contributions
});
```

### Exercise 4: Batch Correction
Implement batch effect correction for expression data:

```javascript
function comBat(expressionMatrix, batches) {
  // Apply ComBat batch correction
  // Return corrected expression values
}
```

## Statistical Concepts

### Log-Rank Test
Compares survival distributions between groups:
- H₀: Survival curves are identical
- Uses chi-square approximation
- P < 0.05 indicates significant difference

### Multiple Testing Correction
Benjamini-Hochberg procedure:
1. Sort p-values
2. Calculate adjusted p = p × n / rank
3. Controls false discovery rate (FDR)

### Effect Size Measures
- **Hazard Ratio (HR)**: Risk of event in group 1 vs group 2
- **Log2 Fold Change**: Log ratio of expression levels
- **Cohen's d**: Standardized mean difference

## Data Formats

### Survival Data
```csv
sample_id,gene,mutation_status,survival_months,event
TCGA-001,TP53,mutated,24,1
```

### Expression Data
```csv
sample_id,TP53,KRAS,EGFR,condition
TCGA-001,4.2,6.8,8.1,tumor
```

### Mutation Frequency
```csv
gene,breast,lung,colon,total_samples
TP53,180,245,310,1000
```

## Visualization Integration

The API returns data ready for visualization:

```javascript
// Kaplan-Meier curve for D3.js
const response = await fetch('/api/analysis/survival/kaplan-meier');
const { data } = await response.json();

// Plot step function
const line = d3.line()
  .x(d => xScale(d.time))
  .y(d => yScale(d.survival))
  .curve(d3.curveStepAfter);
```

```javascript
// Volcano plot
const volcanoData = await fetch('/api/analysis/expression/volcano');
// Points have: log2_fold_change, neg_log10_pvalue, category
```

## Next Steps

- **Phase 3: Advanced Visualization** - Use these statistical results in interactive plots
- Combine survival curves with mutation lollipop plots
- Create interactive differential expression volcano plots

## Resources

- [R for Data Science](https://r4ds.had.co.nz/)
- [Survival Analysis in R](https://www.emilyzabor.com/tutorials/survival_analysis_in_r_tutorial.html)
- [Bioconductor](https://www.bioconductor.org/)
- [Statistics for Genomics](https://genomicsclass.github.io/book/)
