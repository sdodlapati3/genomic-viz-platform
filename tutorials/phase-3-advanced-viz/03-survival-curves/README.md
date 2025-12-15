[← Back to Tutorials Index](../../README.md)

---

# Tutorial 3.3: Kaplan-Meier Survival Curves

## Overview

Learn to create interactive Kaplan-Meier survival curves for clinical genomics data. This visualization is fundamental in cancer research and clinical trials for comparing patient outcomes across different treatment groups, mutations, or biomarkers.

## Learning Objectives

- Understand Kaplan-Meier survival analysis methodology
- Implement step-function survival curves with D3.js
- Calculate and visualize confidence intervals (Greenwood's formula)
- Display censoring marks and at-risk tables
- Perform log-rank tests for statistical comparison
- Handle clinical genomics survival data

## Survival Analysis Concepts

### Kaplan-Meier Estimator

The Kaplan-Meier estimator is a non-parametric statistic used to estimate survival probability from observed lifetimes:

$$\hat{S}(t) = \prod_{t_i \leq t} \left(1 - \frac{d_i}{n_i}\right)$$

Where:

- $\hat{S}(t)$ = estimated survival probability at time t
- $d_i$ = number of events (deaths) at time $t_i$
- $n_i$ = number of subjects at risk at time $t_i$

### Confidence Intervals

We use Greenwood's formula to calculate the variance:

$$\text{Var}[\hat{S}(t)] = \hat{S}(t)^2 \sum_{t_i \leq t} \frac{d_i}{n_i(n_i - d_i)}$$

95% CI using log-log transformation (ensures CI stays within [0,1]):
$$\exp\left(\log(\hat{S}(t)) \pm 1.96 \cdot \frac{\sqrt{\text{Var}(\hat{S}(t))}}{\hat{S}(t) \cdot \log(\hat{S}(t))}\right)$$

### Log-Rank Test

The log-rank test compares survival distributions between groups:

$$\chi^2 = \frac{(O_1 - E_1)^2}{E_1} + \frac{(O_2 - E_2)^2}{E_2}$$

Where:

- $O_i$ = observed events in group i
- $E_i$ = expected events under null hypothesis

## Key Features

### 1. Step-Function Curves

Kaplan-Meier curves are step functions that drop at each event time:

```javascript
const lineGenerator = d3
  .line()
  .x((d) => xScale(d.time))
  .y((d) => yScale(d.survival))
  .curve(d3.curveStepAfter);
```

### 2. Censoring Marks

Vertical tick marks indicate censored observations:

```javascript
// Censored patient markers
censorGroup
  .selectAll('.censor')
  .data(censored)
  .enter()
  .append('line')
  .attr('y1', (d) => yScale(d.survival) - 5)
  .attr('y2', (d) => yScale(d.survival) + 5);
```

### 3. At-Risk Table

Shows number of patients still at risk at various time points:

```javascript
// At specified time intervals
timePoints.forEach((t) => {
  const atRisk = data.filter((d) => d.time >= t).length;
});
```

### 4. Median Survival

Dashed lines show time to 50% survival:

```javascript
// Horizontal at S=0.5, vertical to x-axis
if (medianSurvival) {
  // Draw crosshair at median point
}
```

## Project Structure

```
03-survival-curves/
├── index.html              # Main HTML with UI controls
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration (port 3008)
├── README.md               # This file
└── src/
    ├── main.js             # Application entry point
    ├── components/
    │   └── SurvivalCurve.js   # Main visualization component
    ├── data/
    │   └── survivalData.js    # Data generation and KM calculation
    └── utils/              # Utility functions
```

## Code Walkthrough

### File: `src/main.js` - Entry Point

Initializes the visualization and handles UI controls (group selection, display options).

### File: `src/components/SurvivalCurve.js` - Main Visualization ⭐

Key methods:

- `render()` - Main render pipeline
- `drawCurve(group)` - Draw step function for each group
- `drawConfidenceInterval()` - Shaded CI bands
- `drawCensorMarks()` - Vertical tick marks
- `drawMedianLines()` - Dashed crosshairs at 50%
- `drawAtRiskTable()` - Patient counts below chart

### File: `src/data/survivalData.js` - Statistics Engine ⭐

Kaplan-Meier and log-rank implementations:

```javascript
// Kaplan-Meier estimator
export function kaplanMeier(data) {
  // S(t) = S(t-1) * (1 - d/n)
}

// Greenwood variance formula
export function calculateCI(survivalProb, atRisk, events) {
  // Var[S(t)] = S(t)^2 * Σ(d/(n*(n-d)))
}

// Log-rank test
export function logRankTest(groups) {
  // Chi-square = Σ((O-E)^2/E)
}
```

## Running the Tutorial

```bash
# Navigate to tutorial directory
cd tutorials/phase-3-advanced-viz/03-survival-curves

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at http://localhost:3008

## Usage Guide

### Analysis Types

1. **Treatment Groups**: Compare survival between Control, Treatment A, and Treatment B
2. **TP53 Mutation Status**: Compare TP53 wild-type vs mutant patients
3. **Gene Expression Level**: Compare low vs high expression groups

### Display Options

- **95% Confidence Interval**: Shaded bands around curves
- **Censoring Marks**: Tick marks (|) for censored observations
- **Median Survival Lines**: Dashed crosshairs at 50% survival
- **At-Risk Table**: Number of patients at risk at each time point

### Interpretation

- Steeper curves = worse survival
- Curves that separate = different survival outcomes
- p < 0.05 = statistically significant difference
- NR (Not Reached) = median survival not reached (>50% still alive)

## Key Code Components

### Kaplan-Meier Calculation

```javascript
export function kaplanMeier(data) {
  // Sort by time
  const sorted = [...data].sort((a, b) => a.time - b.time);

  let nAtRisk = sorted.length;
  let survivalProb = 1.0;
  const results = [{ time: 0, survival: 1.0 }];

  // Process each unique event time
  uniqueTimes.forEach((time) => {
    const events = sorted.filter((d) => d.time === time && d.event === 1);
    const censored = sorted.filter((d) => d.time === time && d.event === 0);

    // KM formula: S(t) = S(t-1) * (1 - d/n)
    survivalProb *= 1 - events.length / nAtRisk;

    // Update at-risk count
    nAtRisk -= events.length + censored.length;

    results.push({ time, survival: survivalProb });
  });

  return results;
}
```

### Log-Rank Test

```javascript
export function logRankTest(groups) {
  // Calculate observed and expected events for each group
  // Chi-square test statistic
  const chiSquare = groups.reduce((sum, group) => {
    return sum + Math.pow(group.observed - group.expected, 2) / group.expected;
  }, 0);

  // p-value from chi-square distribution
  const pValue = 1 - chiSquareCDF(chiSquare, df);

  return { chiSquare, df, pValue };
}
```

## Clinical Genomics Context

### Why Survival Analysis?

- **Clinical Trials**: Compare treatment efficacy
- **Biomarker Discovery**: Identify prognostic markers
- **Risk Stratification**: Classify patients into risk groups
- **Treatment Selection**: Guide personalized therapy

### Common Applications

1. **Overall Survival (OS)**: Time to death
2. **Progression-Free Survival (PFS)**: Time to disease progression
3. **Disease-Free Survival (DFS)**: Time to recurrence after treatment
4. **Event-Free Survival (EFS)**: Time to any defined event

### Example Studies

- TP53 mutations and survival in various cancers
- Gene expression signatures predicting outcomes
- Treatment response by molecular subtype

## Exercises

### Exercise 1: Add Hazard Ratio

Calculate and display the hazard ratio (HR) between groups:

```javascript
// Cox proportional hazards (simplified)
const HR = Math.exp(beta);
// Add to statistics panel
```

### Exercise 2: Subgroup Analysis

Add ability to filter by additional clinical variables:

- Age groups
- Cancer stage
- Gender

### Exercise 3: Export Functionality

Add buttons to export:

- Survival data as CSV
- Plot as SVG/PNG
- Statistics as text report

### Exercise 4: Forest Plot

Create a forest plot showing hazard ratios with confidence intervals across multiple subgroups.

## 🎯 ProteinPaint Connection

Survival analysis is a key feature in ProteinPaint for clinical genomics:

| Tutorial Concept    | ProteinPaint Usage                                        |
| ------------------- | --------------------------------------------------------- |
| Kaplan-Meier curves | `client/plots/survival.js` - core survival implementation |
| At-risk table       | Patient counts below plot                                 |
| Log-rank test       | `client/plots/survival.js` - group comparison statistics  |
| Confidence bands    | Greenwood's formula implementation                        |
| Censoring marks     | Vertical tick marks on curves                             |

### ProteinPaint Survival Architecture

```
┌────────────────────────────────────────────────────────────┐
│  ProteinPaint Survival Plot                                │
│                                                            │
│  100% ─┬─────────────────────────────────                 │
│        │ ████████                                          │
│        │         ████                  [Group: TP53 mut]  │
│   50% ─┤             ████████                             │
│        │                     ██ - - - [Group: TP53 wt]   │
│        │ Confidence bands (shaded)                        │
│    0% ─┴─────────────────────────────────────             │
│         0    12    24    36    48    60  months           │
│  ─────────────────────────────────────────                │
│  At risk: 100   85   72   58   45   30                   │
│  ─────────────────────────────────────────                │
│  Log-rank p = 0.003  |  Median: 36 vs 48 mo              │
└────────────────────────────────────────────────────────────┘
```

### Relevant ProteinPaint Files

- `client/plots/survival.js` - Kaplan-Meier implementation
- `client/termsetting/handlers/survival.ts` - Survival term configuration
- `shared/types/survival.ts` - TypeScript interfaces

## Sample Output

```
┌─────────────────────────────────────────────────────────────┐
│  Overall Survival by TP53 Mutation Status                  │
│                                                             │
│  100% ─┬───────────────────────────────────────────────   │
│        │ ▓▓▓▓▓▓▓▓▓▓▓▓                                      │
│   80% ─┤             ▓▓▓▓▓ ╳ (censored)                   │
│        │                  ▓▓▓▓▓▓▓                          │
│   60% ─┤ ████████████████      ▓▓▓▓▓▓ ▓▓▓ ╳              │
│        │                 █████            ▓▓▓             │
│   40% ─┤                      ██████                       │
│        │                            ████ ╳                │
│   20% ─┤                                 ████             │
│        │                                     ████         │
│    0% ─┴─────────────────────────────────────────         │
│         0     12    24    36    48    60    72 months     │
│                                                             │
│  ━━━ TP53 Mutant (n=45)    ▓▓▓ TP53 Wild-type (n=78)     │
│  ╳ Censored observation                                    │
│                                                             │
│  Log-rank test: χ² = 8.94, p = 0.003                      │
│  Median survival: 32 mo (mut) vs 52 mo (wt)               │
│                                                             │
│  Numbers at risk:                                          │
│  TP53mut:  45    32    21    12     6     2               │
│  TP53wt:   78    68    58    48    38    28               │
└─────────────────────────────────────────────────────────────┘
```

## References

1. Kaplan EL, Meier P. (1958) "Nonparametric Estimation from Incomplete Observations"
2. Greenwood M. (1926) "The Natural Duration of Cancer"
3. Peto R, Peto J. (1972) "Asymptotically Efficient Rank Invariant Test Procedures"
4. Therneau TM, Grambsch PM. (2000) "Modeling Survival Data"

## Next Steps

- [Tutorial 3.4: Volcano Plot](../04-volcano-plot/README.md)
- [Tutorial 3.5: OncoPrint](../05-oncoprint/README.md)

## Troubleshooting

### Curves not rendering

- Check browser console for errors
- Ensure data has both `time` and `event` fields
- Verify events are coded as 0 (censored) or 1 (event)

### Statistical results seem wrong

- Check for tied event times handling
- Verify confidence interval calculation
- Compare with R survival package output

### Performance issues

- Large datasets may need binning/summarization
- Consider downsampling for >10,000 patients

---

[← Back to Tutorials Index](../../README.md)
