# ProteinPaint Mini-Projects Implementation Plan

## Overview

Three hands-on mini-projects designed to demonstrate proficiency in genomic visualization patterns used by St. Jude's ProteinPaint platform.

**Target:** Job preparation for St. Jude ProteinPaint team
**Timeline:** ~8-10 hours total implementation
**Technologies:** TypeScript, D3.js, Zod, Vite

---

## Project 1: Protein Panel Component

### Objective

Build a production-quality protein visualization panel that renders:

- Protein axis with amino acid scale
- Domain tracks (functional regions)
- Lollipop/disc mutation markers
- Germline vs somatic indicators
- Fusion breakpoint glyphs

### Directory Structure

```
capstone/mini-projects/protein-panel/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.ts
│   ├── types/
│   │   ├── protein.ts        # Protein/domain types
│   │   ├── mutation.ts       # Mutation types
│   │   └── index.ts
│   ├── components/
│   │   ├── ProteinPanel.ts   # Main container
│   │   ├── ProteinAxis.ts    # AA scale axis
│   │   ├── DomainTrack.ts    # Functional domains
│   │   ├── LollipopTrack.ts  # Mutation markers
│   │   ├── MutationTooltip.ts
│   │   └── FusionGlyph.ts    # Half-disc fusion marker
│   ├── scales/
│   │   └── proteinScale.ts   # D3 scale utilities
│   ├── data/
│   │   └── sampleData.ts     # TP53 example data
│   └── styles/
│       └── protein.css
└── tests/
    └── ProteinPanel.test.ts
```

### Type Definitions

```typescript
// types/protein.ts
interface Protein {
  id: string;
  symbol: string;
  name: string;
  length: number; // amino acids
  uniprot?: string;
  refseq?: string;
}

interface ProteinDomain {
  id: string;
  name: string;
  type: 'pfam' | 'smart' | 'interpro' | 'custom';
  start: number; // 1-based AA position
  end: number;
  color: string;
  description?: string;
}

// types/mutation.ts
type ConsequenceType =
  | 'missense'
  | 'nonsense'
  | 'frameshift'
  | 'splice'
  | 'inframe_insertion'
  | 'inframe_deletion'
  | 'start_lost'
  | 'stop_lost';

type MutationOrigin = 'germline' | 'somatic' | 'unknown';

interface Mutation {
  id: string;
  position: number; // AA position
  refAA: string; // Reference amino acid
  altAA: string; // Alternate amino acid
  consequence: ConsequenceType;
  origin: MutationOrigin;
  sampleCount: number; // Number of samples with this mutation
  samples?: string[]; // Sample IDs

  // Optional clinical annotations
  clinvar?: 'pathogenic' | 'benign' | 'uncertain' | 'conflicting';
  cosmic?: string; // COSMIC ID
}

interface FusionBreakpoint {
  position: number;
  partnerGene: string;
  partnerPosition: number;
  inFrame: boolean;
  sampleCount: number;
}
```

### Visual Specifications

```
┌─────────────────────────────────────────────────────────────────┐
│  TP53 - Cellular tumor antigen p53 (393 aa)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mutations:    ●        ●●●       ●    ●●                      │
│              │ │        │││       │    ││                       │
│              ▼ ▼        ▼▼▼       ▼    ▼▼                       │
│  ┌──────────┬─────────────────────┬─────────────┬──────────┐   │
│  │   TAD    │    DNA Binding      │   Tetra     │   Reg    │   │
│  │  1-61    │      102-292        │  326-356    │ 364-393  │   │
│  └──────────┴─────────────────────┴─────────────┴──────────┘   │
│  ├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤     │
│  1   50   100  150  200  250  300  350  393                    │
│                                                                 │
│  Legend: ● Missense  ■ Nonsense  ◆ Frameshift  ◐ Fusion        │
│          ↑ Germline  ↓ Somatic                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component APIs

```typescript
// ProteinPanel configuration
interface ProteinPanelConfig {
  container: string | HTMLElement;
  protein: Protein;
  domains: ProteinDomain[];
  mutations: Mutation[];
  fusions?: FusionBreakpoint[];

  dimensions?: {
    width?: number;
    height?: number;
    margin?: { top: number; right: number; bottom: number; left: number };
  };

  style?: {
    domainHeight?: number;
    lollipopMaxHeight?: number;
    consequenceColors?: Record<ConsequenceType, string>;
  };

  interactions?: {
    onMutationClick?: (mutation: Mutation) => void;
    onMutationHover?: (mutation: Mutation | null) => void;
    onDomainClick?: (domain: ProteinDomain) => void;
    onBrushSelect?: (range: [number, number]) => void;
  };
}
```

### Implementation Steps

1. **Phase 1: Core Structure (1.5 hours)**
   - Set up TypeScript project with Vite
   - Define type interfaces
   - Create ProteinPanel container class
   - Implement protein scale (AA positions → pixels)

2. **Phase 2: Domain Track (1 hour)**
   - Render domain rectangles with labels
   - Add hover tooltips
   - Implement domain color scheme

3. **Phase 3: Lollipop Markers (1.5 hours)**
   - Stack mutations at same position
   - Size by sample count
   - Color by consequence type
   - Add germline/somatic indicator (arc/flag)

4. **Phase 4: Fusion Glyphs (0.5 hours)**
   - Half-disc SVG path
   - Partner gene label
   - In-frame indicator

5. **Phase 5: Interactivity (1 hour)**
   - Tooltips with mutation details
   - Click selection
   - Brush selection for range
   - Zoom/pan support

---

## Project 2: Linked Brushing System

### Objective

Implement cross-view coordination between:

- Mutation panel (lollipop plot)
- Expression rank plot (with outlier detection)
- Sample table

### Directory Structure

```
capstone/mini-projects/linked-views/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.ts
│   ├── types/
│   │   ├── sample.ts
│   │   ├── expression.ts
│   │   └── index.ts
│   ├── state/
│   │   ├── SelectionStore.ts    # Centralized selection state
│   │   ├── EventBus.ts          # Cross-view communication
│   │   └── index.ts
│   ├── components/
│   │   ├── MutationPanel.ts     # Simplified protein panel
│   │   ├── ExpressionRankPlot.ts # Expression with outliers
│   │   ├── SampleTable.ts       # Linked data table
│   │   └── SelectionSummary.ts  # Shows current selection
│   ├── utils/
│   │   ├── outlierDetection.ts  # Statistical outlier methods
│   │   └── linkingUtils.ts
│   └── data/
│       └── mockData.ts          # Simulated cohort data
└── tests/
    └── integration.test.ts
```

### Data Model

```typescript
// types/sample.ts
interface Sample {
  id: string;
  name: string;
  cohort: string;
  diagnosis: string;
  age?: number;
  mutations: SampleMutation[];
  expression: Record<string, number>; // gene → FPKM/TPM
}

interface SampleMutation {
  gene: string;
  position: number;
  consequence: ConsequenceType;
  vaf: number; // Variant allele frequency
}

// types/expression.ts
interface ExpressionRank {
  sampleId: string;
  gene: string;
  value: number;
  rank: number;
  zScore: number;
  isOutlier: boolean;
  outlierDirection?: 'high' | 'low';
}
```

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Mutation Panel                    │  Expression Rank Plot           │
│  ┌─────────────────────────────┐  │  ┌─────────────────────────────┐│
│  │  TP53 Protein               │  │  │  TP53 Expression            ││
│  │  ●  ●●  ●   ●●●            │  │  │  ○ ○ ○ ○ ● ● ○ ○ ○ ● ○     ││
│  │  ═══════════════════        │  │  │  ├─────────┼─────────┤      ││
│  │  [selected mutations]       │  │  │  Low    Mean      High      ││
│  │                              │  │  │  [outliers highlighted]     ││
│  └─────────────────────────────┘  │  └─────────────────────────────┘│
├───────────────────────────────────┴──────────────────────────────────┤
│  Sample Table                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Sample   │ Cohort │ TP53 Mutation │ TP53 Expr │ Status          ││
│  │──────────┼────────┼───────────────┼───────────┼─────────────────││
│  │ ★ S001   │ AML    │ R248W         │ 12.3      │ Outlier (high)  ││
│  │ ★ S002   │ AML    │ R175H         │ 0.8       │ Outlier (low)   ││
│  │   S003   │ ALL    │ -             │ 5.2       │ Normal          ││
│  └─────────────────────────────────────────────────────────────────┘│
│  ★ = Selected                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Selection Events

```typescript
// state/SelectionStore.ts
interface SelectionState {
  selectedSamples: Set<string>;
  selectedMutations: Set<string>;
  hoveredSample: string | null;
  hoveredMutation: string | null;
  expressionOutliers: Set<string>;

  // Selection source tracking
  selectionSource: 'mutation' | 'expression' | 'table' | 'brush' | null;
}

// Event types for coordination
type SelectionEvent =
  | { type: 'SELECT_SAMPLES'; sampleIds: string[]; source: string }
  | { type: 'HOVER_SAMPLE'; sampleId: string | null; source: string }
  | { type: 'SELECT_MUTATIONS'; mutationIds: string[]; source: string }
  | { type: 'BRUSH_RANGE'; range: [number, number]; source: string }
  | { type: 'CLEAR_SELECTION' };
```

### Implementation Steps

1. **Phase 1: Selection Infrastructure (1 hour)**
   - Implement SelectionStore with Proxy/reactive patterns
   - Create EventBus for cross-component communication
   - Add selection state persistence

2. **Phase 2: Expression Rank Plot (1.5 hours)**
   - Render samples ranked by expression
   - Calculate Z-scores and identify outliers
   - Add mean/SD reference lines
   - Implement point selection and hover

3. **Phase 3: Simplified Mutation Panel (1 hour)**
   - Reuse components from Project 1
   - Add brush selection for position range
   - Highlight samples with mutations in range

4. **Phase 4: Linked Table (1 hour)**
   - Show sample details with mutation/expression columns
   - Sortable by any column
   - Row selection syncs to plots
   - Highlight outliers

5. **Phase 5: Integration (0.5 hours)**
   - Wire all components through EventBus
   - Test selection flow in all directions
   - Add selection summary component

---

## Project 3: Config Schema & Validation

### Objective

Implement strict configuration validation that treats visualization configs as scientific artifacts:

- Versioned schemas
- Runtime validation with Zod
- Shareable URL state
- Import/export JSON configs

### Directory Structure

```
capstone/mini-projects/config-system/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.ts
│   ├── schemas/
│   │   ├── v1/
│   │   │   └── trackConfig.ts
│   │   ├── v2/
│   │   │   └── trackConfig.ts    # Current version
│   │   ├── migrations.ts         # v1 → v2 transforms
│   │   └── index.ts
│   ├── validation/
│   │   ├── ConfigValidator.ts
│   │   ├── SchemaRegistry.ts
│   │   └── errors.ts
│   ├── persistence/
│   │   ├── URLState.ts           # URL-based state
│   │   ├── LocalStorage.ts       # Browser storage
│   │   └── ExportImport.ts       # JSON file handling
│   ├── components/
│   │   ├── ConfigEditor.ts       # JSON editor with validation
│   │   ├── ConfigPreview.ts      # Live preview of config
│   │   └── ValidationErrors.ts   # Error display
│   └── demo/
│       └── DemoApp.ts            # Demo using config system
└── tests/
    ├── schema.test.ts
    └── migration.test.ts
```

### Schema Definitions (Zod)

```typescript
// schemas/v2/trackConfig.ts
import { z } from 'zod';

// Genome enum
const GenomeSchema = z.enum(['hg19', 'hg38', 'mm10', 'mm39']);

// Coordinate schema
const CoordinateSchema = z
  .object({
    chromosome: z.string().regex(/^chr([1-9]|1[0-9]|2[0-2]|X|Y|M)$/),
    start: z.number().int().positive(),
    end: z.number().int().positive(),
  })
  .refine((data) => data.end > data.start, {
    message: 'End must be greater than start',
  });

// Gene schema
const GeneSchema = z.object({
  symbol: z.string().min(1).max(20),
  ensemblId: z
    .string()
    .regex(/^ENSG\d{11}$/)
    .optional(),
  transcript: z
    .string()
    .regex(/^ENST\d{11}$/)
    .optional(),
});

// Track type schemas
const LollipopTrackSchema = z.object({
  type: z.literal('lollipop'),
  gene: GeneSchema,
  showDomains: z.boolean().default(true),
  mutationSources: z.array(z.enum(['cosmic', 'clinvar', 'custom'])).default(['cosmic']),
  consequenceFilter: z.array(z.string()).optional(),
  minSampleCount: z.number().int().min(1).default(1),
});

const ExpressionTrackSchema = z.object({
  type: z.literal('expression'),
  gene: GeneSchema,
  cohorts: z.array(z.string()).min(1),
  showOutliers: z.boolean().default(true),
  outlierThreshold: z.number().default(2), // Z-score threshold
});

const TrackSchema = z.discriminatedUnion('type', [LollipopTrackSchema, ExpressionTrackSchema]);

// Main config schema
export const ConfigSchemaV2 = z.object({
  version: z.literal(2),
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),

  genome: GenomeSchema,
  coordinates: CoordinateSchema.optional(),

  tracks: z.array(TrackSchema).min(1).max(10),

  display: z
    .object({
      width: z.number().int().min(400).max(2000).default(1200),
      height: z.number().int().min(200).max(1500).default(600),
      theme: z.enum(['light', 'dark']).default('light'),
    })
    .optional(),

  metadata: z
    .object({
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      author: z.string().optional(),
      source: z.string().url().optional(),
    })
    .optional(),
});

export type ConfigV2 = z.infer<typeof ConfigSchemaV2>;
```

### Migration System

```typescript
// schemas/migrations.ts
import { ConfigSchemaV1 } from './v1/trackConfig';
import { ConfigSchemaV2, ConfigV2 } from './v2/trackConfig';

type MigrationFn = (config: unknown) => unknown;

const migrations: Record<number, MigrationFn> = {
  // v1 → v2: Added display options, renamed fields
  1: (config: any): ConfigV2 => ({
    ...config,
    version: 2,
    display: {
      width: config.width || 1200,
      height: config.height || 600,
      theme: 'light',
    },
    tracks: config.tracks.map((track: any) => ({
      ...track,
      // Rename 'mutations' to 'mutationSources'
      mutationSources: track.mutations || track.mutationSources || ['cosmic'],
    })),
  }),
};

export function migrateConfig(config: unknown): ConfigV2 {
  let current = config as any;
  const startVersion = current.version || 1;

  for (let v = startVersion; v < 2; v++) {
    if (migrations[v]) {
      current = migrations[v](current);
    }
  }

  return ConfigSchemaV2.parse(current);
}
```

### URL State Persistence

```typescript
// persistence/URLState.ts
import { z } from 'zod';
import LZString from 'lz-string';

export class URLState<T extends z.ZodType> {
  constructor(
    private schema: T,
    private key: string = 'config'
  ) {}

  // Encode config to URL-safe string
  encode(config: z.infer<T>): string {
    const json = JSON.stringify(config);
    const compressed = LZString.compressToEncodedURIComponent(json);
    return compressed;
  }

  // Decode and validate from URL
  decode(encoded: string): z.infer<T> {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) throw new Error('Invalid encoded config');

    const parsed = JSON.parse(json);
    return this.schema.parse(parsed);
  }

  // Save to URL
  saveToURL(config: z.infer<T>): void {
    const encoded = this.encode(config);
    const url = new URL(window.location.href);
    url.searchParams.set(this.key, encoded);
    window.history.replaceState(null, '', url.toString());
  }

  // Load from URL
  loadFromURL(): z.infer<T> | null {
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get(this.key);
    if (!encoded) return null;

    return this.decode(encoded);
  }

  // Generate shareable link
  generateLink(config: z.infer<T>): string {
    const encoded = this.encode(config);
    const url = new URL(window.location.href);
    url.searchParams.set(this.key, encoded);
    return url.toString();
  }
}
```

### Implementation Steps

1. **Phase 1: Zod Schemas (1 hour)**
   - Define v1 and v2 schemas
   - Add custom refinements and transforms
   - Create type exports

2. **Phase 2: Validation System (0.75 hours)**
   - Build ConfigValidator class
   - Implement SchemaRegistry for versions
   - Create user-friendly error messages

3. **Phase 3: Migration System (0.5 hours)**
   - Implement version detection
   - Create migration functions
   - Add migration tests

4. **Phase 4: Persistence Layer (0.75 hours)**
   - URL state with compression
   - LocalStorage backup
   - JSON export/import

5. **Phase 5: Demo Integration (0.5 hours)**
   - Config editor component
   - Live preview
   - Shareable link generation

---

## Combined Timeline

| Phase               | Project 1 | Project 2 | Project 3 | Total   |
| ------------------- | --------- | --------- | --------- | ------- |
| Setup               | 0.5h      | 0.25h     | 0.25h     | 1h      |
| Core Implementation | 3h        | 3h        | 2h        | 8h      |
| Integration/Polish  | 1h        | 0.5h      | 0.5h      | 2h      |
| **Total**           | **4.5h**  | **3.75h** | **2.75h** | **11h** |

## Test Data

All projects will use consistent test data based on:

- **Gene:** TP53 (tumor protein p53)
- **Cohort:** Simulated pediatric cancer cohort (AML, ALL, NBL)
- **Samples:** 100 mock samples with realistic mutation/expression patterns

---

## Success Criteria

### Project 1: Protein Panel

- [ ] Renders TP53 with correct domain annotations
- [ ] Lollipop heights proportional to mutation count
- [ ] Consequence colors match standard conventions
- [ ] Germline/somatic visually distinguished
- [ ] Fusion breakpoints render as half-discs
- [ ] Tooltips show mutation details
- [ ] Brush selection works

### Project 2: Linked Views

- [ ] Selecting mutations highlights samples in expression plot
- [ ] Selecting expression outliers highlights mutations
- [ ] Table rows sync with plot selections
- [ ] Hover highlighting works across all views
- [ ] Selection can be cleared
- [ ] Performance acceptable with 100+ samples

### Project 3: Config System

- [ ] Invalid configs rejected with clear errors
- [ ] v1 configs migrate to v2 automatically
- [ ] URL state roundtrips correctly
- [ ] Shareable links work
- [ ] Config can be exported/imported as JSON

---

## Next Steps

1. Create project directories
2. Initialize TypeScript/Vite projects
3. Implement Project 1 (Protein Panel) first
4. Build Project 2 using components from Project 1
5. Add Project 3 config system to wrap everything
6. Final integration and testing
