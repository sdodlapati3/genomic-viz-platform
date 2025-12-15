[← Back to Tutorials Index](../../README.md)

---

# Tutorial 4.1: Testing Strategy for Genomic Visualizations

Learn professional testing practices for data visualization applications using Vitest.

## 🎯 Learning Objectives

By the end of this tutorial, you will:

- Write unit tests for data transformation functions
- Test D3.js visualization components
- Mock canvas and DOM elements
- Generate code coverage reports
- Understand test-driven development patterns for visualizations

## 🛠️ Technologies Used

| Technology                    | Purpose                             |
| ----------------------------- | ----------------------------------- |
| **Vitest**                    | Fast unit test runner (Vite-native) |
| **happy-dom**                 | Lightweight DOM implementation      |
| **@testing-library/jest-dom** | Custom DOM matchers                 |
| **v8 Coverage**               | Code coverage reporting             |

## 📁 Project Structure

```
01-testing/
├── package.json
├── vitest.config.js          # Test configuration
├── src/
│   ├── __tests__/
│   │   ├── setup.js          # Global test setup
│   │   ├── dataTransform.test.js  # Data utility tests
│   │   ├── scales.test.js    # Scale function tests
│   │   └── BarChart.test.js  # Component tests
│   ├── components/
│   │   └── BarChart.js       # D3 visualization component
│   └── utils/
│       ├── dataTransform.js  # Data processing utilities
│       └── scales.js         # Custom scale functions
└── coverage/                 # Generated coverage reports
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Open interactive UI
npm run test:ui
```

## 📊 Test Categories

### 1. Data Transformation Tests

Test pure functions that process genomic data:

```javascript
// Testing -log10 p-value transformation
describe('negLog10', () => {
  it('should calculate -log10 for valid p-values', () => {
    expect(negLog10(0.01)).toBeCloseTo(2, 5);
    expect(negLog10(0.001)).toBeCloseTo(3, 5);
  });

  it('should return Infinity for p-value of 0', () => {
    expect(negLog10(0)).toBe(Infinity);
  });
});
```

**Functions tested:**

- `negLog10()` - P-value transformation
- `log2FoldChange()` - Expression fold change
- `filterSignificantGenes()` - Differential expression filtering
- `createHistogramBins()` - Data binning
- `calculateStats()` - Summary statistics
- `normalizeMinMax()` - Min-max normalization
- `zScoreNormalize()` - Z-score normalization
- `parseChromosomePosition()` - Genomic coordinate parsing
- `formatSIPrefix()` - Number formatting

### 2. Scale Function Tests

Test custom scale implementations:

```javascript
describe('linearScale', () => {
  it('should map domain values to range', () => {
    const scale = linearScale([0, 100], [0, 500]);

    expect(scale(0)).toBe(0);
    expect(scale(50)).toBe(250);
    expect(scale(100)).toBe(500);
  });

  it('should provide invert function', () => {
    const scale = linearScale([0, 100], [0, 500]);
    expect(scale.invert(250)).toBe(50);
  });
});
```

**Scales tested:**

- `linearScale()` - Linear value mapping
- `logScale()` - Logarithmic scale for p-values
- `chromosomeScale()` - Genomic coordinate mapping
- `colorScale()` - Linear and discrete color mapping

### 3. Component Tests

Test D3.js visualization components:

```javascript
describe('BarChart', () => {
  let container;
  let chart;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    chart?.destroy();
    container?.remove();
  });

  it('should render bars for each data point', () => {
    chart = new BarChart(container);
    chart.setData([
      { label: 'A', value: 10 },
      { label: 'B', value: 25 },
    ]);

    const bars = chart.getBars();
    expect(bars.length).toBe(2);
  });
});
```

## 🎨 Canvas Mocking

The setup file provides a mock canvas context for testing canvas-based visualizations:

```javascript
// From setup.js
class MockCanvasRenderingContext2D {
  constructor() {
    this._calls = []; // Track all method calls
  }

  _track(method, ...args) {
    this._calls.push({ method, args });
  }

  fillRect(x, y, w, h) {
    this._track('fillRect', x, y, w, h);
  }
  // ... other canvas methods
}
```

## 📈 Coverage Goals

| Metric     | Target | Current |
| ---------- | ------ | ------- |
| Statements | > 90%  | 100%    |
| Branches   | > 85%  | 97.27%  |
| Functions  | > 90%  | 94.87%  |
| Lines      | > 90%  | 100%    |

## 🔬 Testing Patterns

### Pattern 1: Test Pure Functions First

```javascript
// Easy to test - no side effects
expect(negLog10(0.01)).toBeCloseTo(2);
```

### Pattern 2: Isolate DOM Dependencies

```javascript
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});
```

### Pattern 3: Test Behaviors, Not Implementation

```javascript
// Good: Test the result
expect(chart.getBars().length).toBe(4);

// Avoid: Testing internal state
// expect(chart._internalProperty).toBe(...)
```

### Pattern 4: Edge Cases Matter

```javascript
it('should handle empty data', () => {
  chart.setData([]);
  expect(chart.getBars().length).toBe(0);
});

it('should handle single value', () => {
  const bins = createHistogramBins([5], 10);
  expect(bins).toHaveLength(10);
});
```

## 📝 Key Takeaways

1. **Test data transformations thoroughly** - They're the foundation of accurate visualizations
2. **Mock browser APIs** - Canvas, DOM, and events need to be simulated
3. **Test interactions** - Hover, click, and update behaviors
4. **Coverage is a guide, not a goal** - 100% coverage doesn't mean bug-free
5. **Fast tests enable TDD** - Vitest's speed makes test-driven development practical

## 🔗 Next Steps

- **Tutorial 4.2**: CI/CD Pipeline - Automate test running with GitHub Actions
- **Tutorial 4.3**: AI Chatbot Integration - Test LLM-powered features
- **Tutorial 4.4**: Rust Performance Module - Test high-performance parsing

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [D3.js Testing Strategies](https://www.d3indepth.com/testing/)

---

[← Back to Tutorials Index](../../README.md)
