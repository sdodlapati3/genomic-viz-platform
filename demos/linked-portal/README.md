# LinkedPortal - Linked Genomic Visualization Demo

A demonstration of coordinated multi-view genomic visualization inspired by [St. Jude ProteinPaint](https://proteinpaint.stjude.org/).

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![D3.js](https://img.shields.io/badge/D3.js-7.8-orange)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)

## 🎯 Features

### Lollipop Plot

- Interactive mutation visualization on TP53 protein backbone
- Colored protein domain annotations (TAD, DBD, OD, CTD)
- Mutation lollipops showing position and sample count
- **D3 brush selection** for range filtering
- Hover tooltips with mutation details
- Click to select individual mutations

### Sample Table

- Sortable columns (Sample ID, Disease, Stage, Mutations, Age, Survival)
- Click to select, **Shift+Click** for multi-select
- Linked highlighting with lollipop plot
- Pagination for large datasets
- Color-coded disease indicators

### Filter Panel

- Disease type checkboxes
- Stage filters (I-IV)
- Mutation type filters (Missense, Nonsense, Silent, etc.)
- Position range sliders
- Active filter chips with remove buttons
- Clear all filters

### Mutation Summary

- Key cohort statistics (total mutations, samples, unique positions)
- Mutation type distribution bar chart
- Disease distribution pie chart
- Position histogram

## 🔗 Linked Interactions

All views are **coordinated**:

- Brush selection in lollipop → filters table and updates summary
- Click sample row → highlights mutations in lollipop
- Apply filter → updates all views simultaneously
- Hover → cross-view highlighting

## 🚀 Quick Start

```bash
# From the repository root
cd demos/linked-portal

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5180
```

## 📁 Project Structure

```
demos/linked-portal/
├── src/
│   ├── components/
│   │   ├── LollipopPlot.ts    # Main mutation visualization
│   │   ├── SampleTable.ts      # Interactive sample browser
│   │   ├── FilterPanel.ts      # Cohort filter controls
│   │   └── MutationSummary.ts  # Statistics dashboard
│   ├── state/
│   │   ├── EventBus.ts         # Pub/sub event system
│   │   └── CohortStore.ts      # Centralized state management
│   ├── types/
│   │   ├── mutations.ts        # Mutation & gene types
│   │   ├── samples.ts          # Sample & clinical types
│   │   └── events.ts           # Event payload types
│   ├── utils/
│   │   └── dataLoader.ts       # Data fetching utilities
│   ├── main.ts                 # Application entry point
│   └── styles.css              # Component styling
├── public/data/
│   ├── tp53_mutations.json     # TP53 mutation dataset
│   └── samples.json            # Clinical sample data
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🏗️ Architecture

### State Management

- **EventBus**: Typed pub/sub system for cross-component communication
- **CohortStore**: Centralized state with computed filtered data

### Event Flow

```
User Action → Component → EventBus → CohortStore → Subscribers → UI Update
```

### Key Events

| Event              | Description                    |
| ------------------ | ------------------------------ |
| `selection:change` | User selects mutations/samples |
| `highlight:show`   | Hover highlight                |
| `filter:apply`     | Filter state changed           |
| `data:loaded`      | Initial data loaded            |

## 🧬 Data Format

### Mutations

```typescript
interface Mutation {
  id: string;
  gene: string;
  position: number;
  aaRef: string;
  aaAlt: string;
  consequence: 'missense' | 'nonsense' | 'silent' | 'frameshift';
  sampleIds: string[];
}
```

### Samples

```typescript
interface Sample {
  sampleId: string;
  disease: string;
  stage?: string;
  age?: number;
  survivalMonths?: number;
  vitalStatus?: 'alive' | 'deceased';
}
```

## ⌨️ Keyboard Shortcuts

| Key                | Action            |
| ------------------ | ----------------- |
| `Escape`           | Clear selection   |
| `Cmd/Ctrl+Shift+C` | Clear all filters |

## 🎨 Customization

### Colors

Mutation type colors and disease colors are defined in type files:

- `src/types/mutations.ts` - `MUTATION_COLORS`
- `src/types/samples.ts` - `DISEASE_COLORS`

### Configuration

Each component accepts a config object:

```typescript
new LollipopPlot(container, {
  width: 900,
  height: 350,
  margin: { top: 40, right: 40, bottom: 60, left: 60 },
});
```

## 📦 Dependencies

- **D3.js v7** - Data visualization
- **TypeScript** - Type safety
- **Vite** - Fast development server

## 📄 License

MIT License - Part of the [genomic-viz-platform](https://github.com/sdodlapati3/genomic-viz-platform) project.

---

_Built as a demonstration of interactive genomic visualization techniques inspired by ProteinPaint._
