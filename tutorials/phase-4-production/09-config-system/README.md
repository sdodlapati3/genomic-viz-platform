[← Back to Tutorials Index](../../README.md)

---

# Tutorial 4.9: Config Schema & Validation System

## Overview

This tutorial builds a robust configuration system using Zod for runtime schema validation. It demonstrates how production genomic visualization tools manage complex configurations with type safety, migrations, and URL state persistence.

## Learning Objectives

By completing this tutorial, you will learn:

1. **Zod Schema Validation** - Runtime type checking with detailed errors
2. **Configuration Migration** - Evolving schemas across versions
3. **URL State Persistence** - Shareable links with embedded state
4. **Reactive Config Store** - State management with history/undo
5. **Config Editor UI** - Interactive configuration editing

## Project Structure

```
09-config-system/
├── index.html              # Main HTML page
├── package.json            # Dependencies (zod, vite)
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── README.md               # This file
└── src/
    ├── main.ts             # Application entry point
    ├── styles.css          # Editor styles
    ├── schemas/
    │   ├── index.ts        # Schema exports
    │   ├── tracks.ts       # Track configuration schemas
    │   └── appConfig.ts    # Application config schema
    ├── migrations/
    │   ├── index.ts        # Migration exports
    │   └── migrationRegistry.ts # Version migration system
    ├── state/
    │   ├── index.ts        # State exports
    │   ├── configStore.ts  # Reactive config store
    │   └── urlState.ts     # URL serialization
    └── components/
        ├── index.ts        # Component exports
        └── ConfigEditor.ts # Config editor UI
```

## Key Concepts

### 1. Zod Schema Definition

Type-safe schema with runtime validation:

```typescript
import { z } from 'zod';

const MutationTrackSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  type: z.literal('mutation'),
  gene: z.string().min(1),
  data: z.object({
    source: z.enum(['api', 'file', 'inline']),
    mutations: z
      .array(
        z.object({
          position: z.number().int().positive(),
          aaChange: z.string(),
          consequence: z.enum(['missense', 'nonsense', 'frameshift', 'splice']),
        })
      )
      .optional(),
  }),
  display: z
    .object({
      lollipopRadius: z.number().min(1).max(20).default(5),
      colorByConsequence: z.boolean().default(true),
    })
    .optional(),
});

// TypeScript type is inferred automatically
type MutationTrack = z.infer<typeof MutationTrackSchema>;
```

### 2. Discriminated Union for Track Types

Different track types with shared properties:

```typescript
const TrackSchema = z.discriminatedUnion('type', [
  MutationTrackSchema,
  ExpressionTrackSchema,
  DomainTrackSchema,
  GenomeBrowserTrackSchema,
  HeatmapTrackSchema,
]);

// Runtime validation
const result = TrackSchema.safeParse(unknownData);
if (!result.success) {
  console.error(result.error.format());
}
```

### 3. Configuration Migration System

Handle schema evolution across versions:

```typescript
interface Migration {
  fromVersion: string;
  toVersion: string;
  migrate: (config: unknown) => unknown;
}

const migrations: Migration[] = [
  {
    fromVersion: '1.0.0',
    toVersion: '1.1.0',
    migrate: (config) => ({
      ...config,
      preferences: {
        ...config.preferences,
        theme: config.preferences?.theme || 'light',
      },
    }),
  },
];

class MigrationRegistry {
  migrate(config: unknown, targetVersion: string): unknown {
    let current = config;
    for (const migration of this.findPath(current.version, targetVersion)) {
      current = migration.migrate(current);
    }
    return current;
  }
}
```

### 4. URL State Persistence

Shareable links with compressed configuration:

```typescript
class URLStateManager {
  serializeToURL(config: AppConfig): string {
    const json = JSON.stringify(config);
    const compressed = btoa(encodeURIComponent(json));
    return compressed;
  }

  parseFromURL(): AppConfig | null {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('state');
    if (!state) return null;

    const json = decodeURIComponent(atob(state));
    return AppConfigSchema.parse(JSON.parse(json));
  }
}
```

### 5. Reactive Config Store with History

Undo/redo support for configuration changes:

```typescript
class ConfigStore {
  private config: AppConfig;
  private history: AppConfig[] = [];
  private historyIndex = -1;

  set(path: string, value: unknown): void {
    const previous = this.config;
    this.config = setPath(this.config, path, value);

    // Validate
    const result = AppConfigSchema.safeParse(this.config);
    if (!result.success) {
      this.config = previous;
      throw new Error(result.error.message);
    }

    // Push to history
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(this.config);
    this.historyIndex++;

    this.notifyListeners();
  }

  undo(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.config = this.history[this.historyIndex];
      this.notifyListeners();
    }
  }
}
```

## Running the Tutorial

### Quick Start

```bash
cd tutorials/phase-4-production/09-config-system
npm install
npm run dev
```

The demo will be available at **http://localhost:5184**

### What You'll See

1. **Config Editor** - Tabbed interface for editing configuration
2. **Validation Demo** - Live validation with error messages
3. **Migration Demo** - Config version upgrade demonstration
4. **URL State Demo** - Generate shareable links
5. **Track Addition Demo** - Add new tracks with validation

## Demo Features

| Tab         | Description                           |
| ----------- | ------------------------------------- |
| General     | App name, version, basic settings     |
| Layout      | View configuration and arrangement    |
| Tracks      | Track list with type-specific editing |
| Preferences | Theme, animations, keyboard shortcuts |
| Data        | API endpoints and cache settings      |
| JSON        | Raw JSON editing with validation      |

## Validation Examples

### Valid Configuration

```json
{
  "id": "track-1",
  "name": "TP53 Mutations",
  "type": "mutation",
  "gene": "TP53",
  "data": { "source": "api" }
}
```

### Invalid Configuration (Errors)

```json
{
  "id": "", // ❌ Empty string
  "name": "Test",
  "type": "mutation",
  "gene": "", // ❌ Empty string
  "data": {
    "source": "invalid" // ❌ Not in enum
  }
}
```

## Exercises

### Exercise 1: Add Custom Validation

Add cross-field validation (e.g., end position > start position).

### Exercise 2: Add Schema Versioning UI

Show a UI that indicates when config needs migration.

### Exercise 3: Add Import/Export

Implement JSON file import/export with validation.

## Connection to ProteinPaint

This pattern mirrors ProteinPaint's configuration handling:

| Feature           | This Tutorial     | ProteinPaint       |
| ----------------- | ----------------- | ------------------ |
| Schema validation | Zod               | Custom validation  |
| Configuration     | AppConfig         | Track/view configs |
| URL state         | URLStateManager   | URL parameters     |
| Migrations        | MigrationRegistry | Config evolution   |

## Best Practices Demonstrated

1. **Fail Fast** - Validate at boundaries (API, URL, user input)
2. **Type Safety** - Infer types from schemas
3. **Backward Compatibility** - Migration system for schema changes
4. **User Feedback** - Clear error messages with paths
5. **State Management** - Centralized, reactive configuration

---

## 🎯 Interview Preparation Q&A

### Q1: How do you implement runtime schema validation with Zod?

**Answer:**

```typescript
import { z } from 'zod';

// Define schema
const MutationSchema = z.object({
  gene: z.string().min(1),
  position: z.number().int().positive(),
  aaChange: z.string().regex(/^[A-Z]\d+[A-Z]$/), // e.g., R175H
  consequence: z.enum(['missense', 'nonsense', 'frameshift', 'splice']),
  vaf: z.number().min(0).max(1),
  samples: z.array(z.string()).optional(),
});

// Infer TypeScript type from schema
type Mutation = z.infer<typeof MutationSchema>;

// Validate at runtime
function processMutation(input: unknown): Mutation {
  const result = MutationSchema.safeParse(input);

  if (!result.success) {
    // Detailed error with path
    const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid mutation: ${errors.join(', ')}`);
  }

  return result.data;
}

// Usage
try {
  const mutation = processMutation({ gene: 'TP53', position: 175 });
} catch (e) {
  // "Invalid mutation: aaChange: Required, consequence: Required, vaf: Required"
}
```

---

### Q2: How do you implement config migrations between versions?

**Answer:**

```typescript
interface Migration {
  fromVersion: number;
  toVersion: number;
  migrate: (config: any) => any;
}

class MigrationRegistry {
  private migrations: Migration[] = [];

  register(migration: Migration) {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => a.fromVersion - b.fromVersion);
  }

  migrate(config: any, targetVersion: number): any {
    let current = config;
    let currentVersion = config.version || 1;

    while (currentVersion < targetVersion) {
      const migration = this.migrations.find((m) => m.fromVersion === currentVersion);

      if (!migration) {
        throw new Error(`No migration from v${currentVersion}`);
      }

      current = migration.migrate(current);
      currentVersion = migration.toVersion;
    }

    return { ...current, version: targetVersion };
  }
}

// Define migrations
registry.register({
  fromVersion: 1,
  toVersion: 2,
  migrate: (config) => ({
    ...config,
    // v2: Renamed 'mutations' to 'variants'
    variants: config.mutations,
    mutations: undefined,
  }),
});

registry.register({
  fromVersion: 2,
  toVersion: 3,
  migrate: (config) => ({
    ...config,
    // v3: Added required 'genome' field
    genome: config.genome || 'hg38',
  }),
});
```

---

### Q3: How do you persist visualization state in URLs?

**Answer:**

```typescript
class URLStateManager {
  // Serialize state to URL
  serialize(state: AppConfig): string {
    // Compress to reduce URL length
    const json = JSON.stringify(state);
    const compressed = btoa(json); // Or use lz-string for better compression
    return compressed;
  }

  // Deserialize from URL
  deserialize(param: string): AppConfig | null {
    try {
      const json = atob(param);
      const parsed = JSON.parse(json);

      // Validate and migrate
      const migrated = this.migrationRegistry.migrate(parsed, CURRENT_VERSION);
      return AppConfigSchema.parse(migrated);
    } catch (e) {
      console.warn('Invalid URL state:', e);
      return null;
    }
  }

  // Update URL without page reload
  updateURL(state: AppConfig) {
    const serialized = this.serialize(state);
    const url = new URL(window.location.href);
    url.searchParams.set('state', serialized);

    window.history.replaceState({}, '', url.toString());
  }

  // Load state on page load
  loadFromURL(): AppConfig {
    const url = new URL(window.location.href);
    const stateParam = url.searchParams.get('state');

    if (stateParam) {
      const state = this.deserialize(stateParam);
      if (state) return state;
    }

    return this.getDefaultConfig();
  }
}
```

**Use case:** Shareable links like `https://app.com?state=eyJnZW5l...`

---

### Q4: How do you build a reactive config store with undo/redo?

**Answer:**

```typescript
class ConfigStore {
  private state: AppConfig;
  private history: AppConfig[] = [];
  private future: AppConfig[] = [];
  private subscribers: ((state: AppConfig) => void)[] = [];

  constructor(initial: AppConfig) {
    this.state = initial;
  }

  update(updater: (state: AppConfig) => AppConfig) {
    // Save current state for undo
    this.history.push(structuredClone(this.state));
    this.future = []; // Clear redo stack

    // Apply update
    this.state = updater(this.state);

    // Validate new state
    const result = AppConfigSchema.safeParse(this.state);
    if (!result.success) {
      this.state = this.history.pop()!; // Rollback
      throw new Error('Invalid config update');
    }

    this.notify();
  }

  undo() {
    if (this.history.length === 0) return;
    this.future.push(structuredClone(this.state));
    this.state = this.history.pop()!;
    this.notify();
  }

  redo() {
    if (this.future.length === 0) return;
    this.history.push(structuredClone(this.state));
    this.state = this.future.pop()!;
    this.notify();
  }

  subscribe(callback: (state: AppConfig) => void) {
    this.subscribers.push(callback);
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach((cb) => cb(this.state));
  }
}
```

---

### Q5: How does ProteinPaint handle configuration?

**Answer:**
**ProteinPaint configuration patterns:**

1. **Layered configuration:**

   ```javascript
   // Default → Server → URL → User
   const config = mergeConfigs(
     defaultConfig, // Hardcoded defaults
     serverConfig, // From server API
     urlConfig, // From URL params
     userPreferences // From localStorage
   );
   ```

2. **Track configuration:**

   ```javascript
   const trackConfig = {
     type: 'mds3',
     name: 'Pediatric Mutations',
     genome: 'hg38',
     dslabel: 'pediatric',

     // Display options
     showLabels: true,
     labelCutoff: 5,

     // Filters
     filters: {
       consequence: ['missense', 'nonsense'],
       minVAF: 0.05,
     },
   };
   ```

3. **URL state preservation:**

   ```javascript
   // Encode current view state
   const state = {
     gene: 'TP53',
     position: 'chr17:7668421-7687490',
     tracks: ['mutations', 'expression'],
     filters: currentFilters,
   };

   // Generate shareable URL
   const shareUrl = `${baseUrl}?config=${encode(state)}`;
   ```

4. **Validation strategy:**
   - Validate at load time
   - Fallback to defaults for invalid values
   - Log warnings for deprecated options
   - Auto-migrate old config formats

---

## Next Steps

- Return to [Capstone Project](../../../capstone/README.md)
- Review [Phase 4 Summary](../README.md)
