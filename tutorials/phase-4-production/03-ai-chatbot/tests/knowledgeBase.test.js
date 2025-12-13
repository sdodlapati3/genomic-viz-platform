/**
 * Tests for Knowledge Base
 */

import { describe, it, expect } from 'vitest';
import {
  genomicKnowledge,
  getKnowledgeByCategory,
  searchKnowledge,
  getRelevantContext
} from '../src/data/knowledgeBase.js';

describe('Knowledge Base', () => {
  describe('genomicKnowledge', () => {
    it('should contain multiple knowledge chunks', () => {
      expect(genomicKnowledge.length).toBeGreaterThan(0);
    });

    it('should have required fields in each chunk', () => {
      genomicKnowledge.forEach(chunk => {
        expect(chunk).toHaveProperty('id');
        expect(chunk).toHaveProperty('category');
        expect(chunk).toHaveProperty('title');
        expect(chunk).toHaveProperty('content');
        expect(chunk).toHaveProperty('keywords');
        expect(Array.isArray(chunk.keywords)).toBe(true);
      });
    });

    it('should cover multiple categories', () => {
      const categories = new Set(genomicKnowledge.map(c => c.category));
      expect(categories.size).toBeGreaterThan(2);
      expect(categories.has('gene')).toBe(true);
      expect(categories.has('concept')).toBe(true);
    });
  });

  describe('getKnowledgeByCategory', () => {
    it('should filter by gene category', () => {
      const genes = getKnowledgeByCategory('gene');
      expect(genes.length).toBeGreaterThan(0);
      genes.forEach(chunk => {
        expect(chunk.category).toBe('gene');
      });
    });

    it('should filter by visualization category', () => {
      const viz = getKnowledgeByCategory('visualization');
      expect(viz.length).toBeGreaterThan(0);
      viz.forEach(chunk => {
        expect(chunk.category).toBe('visualization');
      });
    });

    it('should return empty array for unknown category', () => {
      const result = getKnowledgeByCategory('nonexistent');
      expect(result).toEqual([]);
    });
  });

  describe('searchKnowledge', () => {
    it('should find TP53 related content', () => {
      const results = searchKnowledge('TP53');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should find mutation-related content', () => {
      const results = searchKnowledge('mutation types');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find KRAS content', () => {
      const results = searchKnowledge('KRAS oncogene');
      expect(results.length).toBeGreaterThan(0);
      // KRAS should be highly ranked
      const krasResult = results.find(r => r.id === 'kras-overview');
      expect(krasResult).toBeDefined();
    });

    it('should return results sorted by relevance', () => {
      const results = searchKnowledge('cancer gene');
      expect(results.length).toBeGreaterThan(1);
      // Results should be sorted by score descending
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
      }
    });

    it('should return empty array for no matches', () => {
      const results = searchKnowledge('xyznonexistent12345');
      expect(results).toEqual([]);
    });
  });

  describe('getRelevantContext', () => {
    it('should return context string', () => {
      const context = getRelevantContext('TP53 tumor suppressor');
      expect(typeof context).toBe('string');
      expect(context.length).toBeGreaterThan(0);
    });

    it('should limit number of chunks', () => {
      const context1 = getRelevantContext('cancer gene mutation', 1);
      const context3 = getRelevantContext('cancer gene mutation', 3);
      // More chunks should generally mean longer context
      expect(context3.length).toBeGreaterThanOrEqual(context1.length);
    });

    it('should return empty string for no matches', () => {
      const context = getRelevantContext('xyznonexistent12345');
      expect(context).toBe('');
    });
  });
});
