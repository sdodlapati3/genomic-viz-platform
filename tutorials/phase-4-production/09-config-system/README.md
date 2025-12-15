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

## Next Steps

- Return to [Capstone Project](../../../capstone/README.md)
- Review [Phase 4 Summary](../README.md)
