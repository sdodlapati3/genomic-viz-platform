/**
 * API Tests for Mini-ProteinPaint Server
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.version).toBe('1.0.0');
  });
});

describe('Mutations API', () => {
  describe('GET /api/mutations', () => {
    it('should return mutations list', async () => {
      const res = await request(app).get('/api/mutations');
      
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.pagination).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter by gene', async () => {
      const res = await request(app).get('/api/mutations?gene=TP53');
      
      expect(res.status).toBe(200);
      res.body.data.forEach(m => {
        expect(m.gene).toBe('TP53');
      });
    });

    it('should filter by type', async () => {
      const res = await request(app).get('/api/mutations?type=missense');
      
      expect(res.status).toBe(200);
      res.body.data.forEach(m => {
        expect(m.type).toBe('missense');
      });
    });
  });

  describe('GET /api/mutations/stats', () => {
    it('should return mutation statistics', async () => {
      const res = await request(app).get('/api/mutations/stats');
      
      expect(res.status).toBe(200);
      expect(res.body.totalMutations).toBeGreaterThan(0);
      expect(res.body.totalGenes).toBeGreaterThan(0);
      expect(res.body.mutationTypes).toBeDefined();
    });
  });

  describe('GET /api/mutations/gene/:gene', () => {
    it('should return mutations for specific gene', async () => {
      const res = await request(app).get('/api/mutations/gene/TP53');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(m => {
        expect(m.gene).toBe('TP53');
      });
    });
  });

  describe('GET /api/mutations/types', () => {
    it('should return mutation type distribution', async () => {
      const res = await request(app).get('/api/mutations/types');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(d => {
        expect(d.type).toBeDefined();
        expect(d.count).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /api/mutations/top-genes', () => {
    it('should return top mutated genes', async () => {
      const res = await request(app).get('/api/mutations/top-genes?limit=5');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeLessThanOrEqual(5);
      
      // Should be sorted descending
      for (let i = 1; i < res.body.length; i++) {
        expect(res.body[i].count).toBeLessThanOrEqual(res.body[i - 1].count);
      }
    });
  });
});

describe('Expression API', () => {
  describe('GET /api/expression', () => {
    it('should return expression matrix', async () => {
      const res = await request(app).get('/api/expression');
      
      expect(res.status).toBe(200);
      expect(res.body.genes).toBeDefined();
      expect(res.body.samples).toBeDefined();
      expect(res.body.expression).toBeDefined();
    });
  });

  describe('GET /api/expression/genes', () => {
    it('should return gene list', async () => {
      const res = await request(app).get('/api/expression/genes');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});

describe('Survival API', () => {
  describe('GET /api/survival', () => {
    it('should return survival data', async () => {
      const res = await request(app).get('/api/survival');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(d => {
        expect(d.time).toBeDefined();
        expect(d.event).toBeDefined();
      });
    });
  });

  describe('GET /api/survival/kaplan-meier', () => {
    it('should return Kaplan-Meier curves', async () => {
      const res = await request(app).get('/api/survival/kaplan-meier');
      
      expect(res.status).toBe(200);
      expect(res.body['All Patients']).toBeDefined();
    });

    it('should group by cancer type', async () => {
      const res = await request(app).get('/api/survival/kaplan-meier?groupBy=cancerType');
      
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).length).toBeGreaterThan(1);
    });
  });

  describe('GET /api/survival/summary', () => {
    it('should return survival summary statistics', async () => {
      const res = await request(app).get('/api/survival/summary');
      
      expect(res.status).toBe(200);
      expect(res.body.totalPatients).toBeGreaterThan(0);
      expect(res.body.events).toBeDefined();
      expect(res.body.censored).toBeDefined();
    });
  });
});

describe('Samples API', () => {
  describe('GET /api/samples', () => {
    it('should return samples list', async () => {
      const res = await request(app).get('/api/samples');
      
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('GET /api/samples/stats', () => {
    it('should return sample statistics', async () => {
      const res = await request(app).get('/api/samples/stats');
      
      expect(res.status).toBe(200);
      expect(res.body.totalSamples).toBeGreaterThan(0);
      expect(res.body.cancerTypes).toBeDefined();
    });
  });
});

describe('Chat API', () => {
  describe('POST /api/chat', () => {
    it('should process mutation query', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'How many mutations are there?' });
      
      expect(res.status).toBe(200);
      expect(res.body.response).toBeDefined();
    });

    it('should require message', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({});
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/chat/suggestions', () => {
    it('should return query suggestions', async () => {
      const res = await request(app).get('/api/chat/suggestions');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});

describe('Error Handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown');
    
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
  });
});
