/**
 * Configuration Migration System
 *
 * Handles version migrations for configuration objects.
 * Ensures backward compatibility as schemas evolve.
 */

// ============================================
// Migration Types
// ============================================

export interface Migration {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate: (config: unknown) => unknown;
  rollback?: (config: unknown) => unknown;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: string;
  toVersion: string;
  migrationsApplied: string[];
  config: unknown;
  errors?: string[];
}

// ============================================
// Version Utilities
// ============================================

/**
 * Parse semver version string to components
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Compare two version strings
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  if (vA.major !== vB.major) return vA.major < vB.major ? -1 : 1;
  if (vA.minor !== vB.minor) return vA.minor < vB.minor ? -1 : 1;
  if (vA.patch !== vB.patch) return vA.patch < vB.patch ? -1 : 1;
  return 0;
}

/**
 * Check if version is within range
 */
export function isVersionInRange(version: string, min: string, max: string): boolean {
  return compareVersions(version, min) >= 0 && compareVersions(version, max) <= 0;
}

// ============================================
// Migration Registry
// ============================================

class MigrationRegistry {
  private migrations: Migration[] = [];

  /**
   * Register a migration
   */
  register(migration: Migration): void {
    // Validate migration
    parseVersion(migration.fromVersion);
    parseVersion(migration.toVersion);

    if (compareVersions(migration.fromVersion, migration.toVersion) >= 0) {
      throw new Error('Migration toVersion must be greater than fromVersion');
    }

    // Check for duplicates
    const existing = this.migrations.find(
      (m) => m.fromVersion === migration.fromVersion && m.toVersion === migration.toVersion
    );
    if (existing) {
      throw new Error(
        `Migration from ${migration.fromVersion} to ${migration.toVersion} already registered`
      );
    }

    this.migrations.push(migration);
    // Sort by fromVersion
    this.migrations.sort((a, b) => compareVersions(a.fromVersion, b.fromVersion));
  }

  /**
   * Get migration path from one version to another
   */
  getMigrationPath(fromVersion: string, toVersion: string): Migration[] {
    if (compareVersions(fromVersion, toVersion) >= 0) {
      return []; // No migration needed or rollback required
    }

    const path: Migration[] = [];
    let currentVersion = fromVersion;

    while (compareVersions(currentVersion, toVersion) < 0) {
      // Find next migration
      const nextMigration = this.migrations.find((m) => m.fromVersion === currentVersion);

      if (!nextMigration) {
        // Try to find a migration that covers this version
        const coveringMigration = this.migrations.find(
          (m) =>
            compareVersions(m.fromVersion, currentVersion) <= 0 &&
            compareVersions(m.toVersion, currentVersion) > 0
        );

        if (!coveringMigration) {
          throw new Error(`No migration path from ${currentVersion} to ${toVersion}`);
        }
        path.push(coveringMigration);
        currentVersion = coveringMigration.toVersion;
      } else {
        path.push(nextMigration);
        currentVersion = nextMigration.toVersion;
      }

      // Safety check to prevent infinite loops
      if (path.length > 100) {
        throw new Error('Migration path too long, possible circular dependency');
      }
    }

    return path;
  }

  /**
   * Apply migrations to a config
   */
  migrate(config: unknown, fromVersion: string, toVersion: string): MigrationResult {
    const result: MigrationResult = {
      success: false,
      fromVersion,
      toVersion,
      migrationsApplied: [],
      config,
      errors: [],
    };

    try {
      const path = this.getMigrationPath(fromVersion, toVersion);
      let currentConfig = config;

      for (const migration of path) {
        try {
          currentConfig = migration.migrate(currentConfig);
          result.migrationsApplied.push(`${migration.fromVersion} → ${migration.toVersion}`);
        } catch (error) {
          result.errors?.push(
            `Migration ${migration.fromVersion} → ${migration.toVersion} failed: ${error}`
          );
          return result;
        }
      }

      result.config = currentConfig;
      result.success = true;
    } catch (error) {
      result.errors?.push(`Migration failed: ${error}`);
    }

    return result;
  }

  /**
   * Get all registered migrations
   */
  getMigrations(): Migration[] {
    return [...this.migrations];
  }

  /**
   * Clear all migrations (useful for testing)
   */
  clear(): void {
    this.migrations = [];
  }
}

// Singleton instance
export const migrationRegistry = new MigrationRegistry();

// ============================================
// Built-in Migrations
// ============================================

// Migration: 1.0.0 → 1.1.0 (Add preferences.theme)
migrationRegistry.register({
  fromVersion: '1.0.0',
  toVersion: '1.1.0',
  description: 'Add theme preference and animation settings',
  migrate: (config: unknown) => {
    const c = config as Record<string, unknown>;
    return {
      ...c,
      version: '1.1.0',
      preferences: {
        ...((c.preferences as Record<string, unknown>) || {}),
        theme: 'light',
        animationsEnabled: true,
        animationDuration: 300,
      },
    };
  },
});

// Migration: 1.1.0 → 1.2.0 (Add feature flags)
migrationRegistry.register({
  fromVersion: '1.1.0',
  toVersion: '1.2.0',
  description: 'Add feature flags configuration',
  migrate: (config: unknown) => {
    const c = config as Record<string, unknown>;
    return {
      ...c,
      version: '1.2.0',
      features: {
        exportEnabled: true,
        exportFormats: ['png', 'svg'],
        shareEnabled: true,
        historyEnabled: true,
        historyMaxEntries: 50,
      },
    };
  },
});

// Migration: 1.2.0 → 2.0.0 (Restructure layout)
migrationRegistry.register({
  fromVersion: '1.2.0',
  toVersion: '2.0.0',
  description: 'Restructure layout configuration for multi-view support',
  migrate: (config: unknown) => {
    const c = config as Record<string, unknown>;
    const oldTracks = (c.tracks as unknown[]) || [];

    return {
      ...c,
      version: '2.0.0',
      layout: {
        type: 'single',
        views: [
          {
            id: 'main',
            name: 'Main View',
            type: 'main',
            tracks: oldTracks,
            linkedViews: [],
            zoom: { enabled: true, minScale: 0.1, maxScale: 10, currentScale: 1 },
          },
        ],
        gap: 10,
        responsive: true,
      },
      tracks: undefined, // Remove old tracks field
    };
  },
});
