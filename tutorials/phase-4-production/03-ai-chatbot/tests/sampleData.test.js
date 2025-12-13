/**
 * Tests for Sample Data and Query Functions
 */

import { describe, it, expect } from 'vitest';
import {
  mutations,
  samples,
  geneStats,
  queryMutations,
  querySamples,
  getStatistics,
  parseNaturalQuery
} from '../src/data/sampleData.js';

describe('Sample Data', () => {
  describe('mutations', () => {
    it('should contain mutation records', () => {
      expect(mutations.length).toBeGreaterThan(0);
    });

    it('should have required fields', () => {
      mutations.forEach(m => {
        expect(m).toHaveProperty('id');
        expect(m).toHaveProperty('gene');
        expect(m).toHaveProperty('position');
        expect(m).toHaveProperty('type');
        expect(m).toHaveProperty('cancer');
      });
    });
  });

  describe('samples', () => {
    it('should contain sample records', () => {
      expect(samples.length).toBeGreaterThan(0);
    });

    it('should have clinical data fields', () => {
      samples.forEach(s => {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('cancer');
        expect(s).toHaveProperty('stage');
        expect(s).toHaveProperty('survival_months');
      });
    });
  });
});

describe('queryMutations', () => {
  it('should return all mutations with no criteria', () => {
    const results = queryMutations();
    expect(results.length).toBe(mutations.length);
  });

  it('should filter by gene', () => {
    const results = queryMutations({ gene: 'TP53' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach(r => {
      expect(r.gene.toUpperCase()).toBe('TP53');
    });
  });

  it('should filter by cancer type', () => {
    const results = queryMutations({ cancer: 'lung' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach(r => {
      expect(r.cancer.toLowerCase()).toBe('lung');
    });
  });

  it('should filter by mutation type', () => {
    const results = queryMutations({ type: 'missense' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach(r => {
      expect(r.type.toLowerCase()).toBe('missense');
    });
  });

  it('should combine multiple criteria', () => {
    const results = queryMutations({ gene: 'KRAS', cancer: 'lung' });
    results.forEach(r => {
      expect(r.gene.toUpperCase()).toBe('KRAS');
      expect(r.cancer.toLowerCase()).toBe('lung');
    });
  });

  it('should filter by minimum samples', () => {
    const results = queryMutations({ minSamples: 300 });
    results.forEach(r => {
      expect(r.samples).toBeGreaterThanOrEqual(300);
    });
  });
});

describe('querySamples', () => {
  it('should return all samples with no criteria', () => {
    const results = querySamples();
    expect(results.length).toBe(samples.length);
  });

  it('should filter by cancer type', () => {
    const results = querySamples({ cancer: 'breast' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach(r => {
      expect(r.cancer.toLowerCase()).toBe('breast');
    });
  });

  it('should filter by stage', () => {
    const results = querySamples({ stage: 'IV' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach(r => {
      expect(r.stage).toBe('IV');
    });
  });

  it('should filter by status', () => {
    const results = querySamples({ status: 'alive' });
    results.forEach(r => {
      expect(r.status).toBe('alive');
    });
  });
});

describe('getStatistics', () => {
  it('should return mutations by gene', () => {
    const stats = getStatistics('mutations_by_gene');
    expect(stats).toBeDefined();
    expect(Array.isArray(stats)).toBe(true);
    expect(stats[0]).toHaveProperty('gene');
    expect(stats[0]).toHaveProperty('count');
  });

  it('should return mutations by cancer', () => {
    const stats = getStatistics('mutations_by_cancer');
    expect(stats).toBeDefined();
    expect(Array.isArray(stats)).toBe(true);
    expect(stats[0]).toHaveProperty('cancer');
    expect(stats[0]).toHaveProperty('count');
  });

  it('should return survival by cancer', () => {
    const stats = getStatistics('survival_by_cancer');
    expect(stats).toBeDefined();
    expect(Array.isArray(stats)).toBe(true);
    expect(stats[0]).toHaveProperty('cancer');
    expect(stats[0]).toHaveProperty('avg_survival');
  });

  it('should return null for unknown stat type', () => {
    const stats = getStatistics('unknown_type');
    expect(stats).toBeNull();
  });
});

describe('parseNaturalQuery', () => {
  it('should detect mutation queries', () => {
    const result = parseNaturalQuery('Show me all mutations');
    expect(result.type).toBe('mutations');
  });

  it('should detect sample queries', () => {
    const result = parseNaturalQuery('List all patients');
    expect(result.type).toBe('samples');
  });

  it('should detect statistics queries', () => {
    const result = parseNaturalQuery('Show me statistics about gene counts');
    expect(result.type).toBe('statistics');
  });

  it('should extract gene names', () => {
    const result = parseNaturalQuery('Show TP53 mutations');
    expect(result.criteria.gene).toBe('TP53');
  });

  it('should extract cancer types', () => {
    const result = parseNaturalQuery('Find mutations in breast cancer');
    expect(result.criteria.cancer).toBe('breast');
  });

  it('should extract mutation types', () => {
    const result = parseNaturalQuery('List all missense mutations');
    expect(result.criteria.type).toBe('missense');
  });

  it('should handle complex queries', () => {
    const result = parseNaturalQuery('Show me KRAS mutations in lung cancer');
    expect(result.type).toBe('mutations');
    expect(result.criteria.gene).toBe('KRAS');
    expect(result.criteria.cancer).toBe('lung');
  });

  it('should return unknown for unclear queries', () => {
    const result = parseNaturalQuery('hello world');
    expect(result.type).toBe('unknown');
  });
});
