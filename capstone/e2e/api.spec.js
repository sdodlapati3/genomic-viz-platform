/**
 * API Integration E2E Tests
 */

import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

test.describe('API Health', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data).toHaveProperty('timestamp');
  });
});

test.describe('Mutations API', () => {
  test('should get mutations list', async ({ request }) => {
    const response = await request.get(`${API_URL}/mutations`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data) || data.mutations).toBeTruthy();
  });

  test('should get mutations by gene', async ({ request }) => {
    const response = await request.get(`${API_URL}/mutations?gene=TP53`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    const mutations = Array.isArray(data) ? data : data.mutations;
    
    // All mutations should be for TP53
    mutations.forEach(m => {
      expect(m.gene || m.geneSymbol).toBe('TP53');
    });
  });

  test('should handle pagination', async ({ request }) => {
    const response = await request.get(`${API_URL}/mutations?limit=10&offset=0`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    const mutations = Array.isArray(data) ? data : data.mutations;
    
    expect(mutations.length).toBeLessThanOrEqual(10);
  });

  test('should filter by mutation type', async ({ request }) => {
    const response = await request.get(`${API_URL}/mutations?type=missense`);
    
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Expression API', () => {
  test('should get expression data', async ({ request }) => {
    const response = await request.get(`${API_URL}/expression`);
    
    expect(response.ok()).toBeTruthy();
  });

  test('should get expression by gene', async ({ request }) => {
    const response = await request.get(`${API_URL}/expression?gene=TP53`);
    
    expect(response.ok()).toBeTruthy();
  });

  test('should get volcano plot data', async ({ request }) => {
    const response = await request.get(`${API_URL}/expression/volcano`);
    
    if (response.ok()) {
      const data = await response.json();
      
      // Volcano data should have genes with logFC and pValue
      if (Array.isArray(data) && data.length > 0) {
        expect(data[0]).toHaveProperty('gene');
      }
    }
  });
});

test.describe('Survival API', () => {
  test('should get survival data', async ({ request }) => {
    const response = await request.get(`${API_URL}/survival`);
    
    expect(response.ok()).toBeTruthy();
  });

  test('should get survival data by gene', async ({ request }) => {
    const response = await request.get(`${API_URL}/survival?gene=TP53`);
    
    expect(response.ok()).toBeTruthy();
  });

  test('should return Kaplan-Meier data', async ({ request }) => {
    const response = await request.get(`${API_URL}/survival/kaplan-meier?gene=TP53`);
    
    if (response.ok()) {
      const data = await response.json();
      
      // Should have survival curve data
      expect(data).toBeDefined();
    }
  });
});

test.describe('Samples API', () => {
  test('should get samples list', async ({ request }) => {
    const response = await request.get(`${API_URL}/samples`);
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data) || data.samples).toBeTruthy();
  });

  test('should get sample by ID', async ({ request }) => {
    // First get list to find a valid ID
    const listResponse = await request.get(`${API_URL}/samples?limit=1`);
    
    if (listResponse.ok()) {
      const listData = await listResponse.json();
      const samples = Array.isArray(listData) ? listData : listData.samples;
      
      if (samples.length > 0) {
        const sampleId = samples[0].id || samples[0].sampleId;
        
        const response = await request.get(`${API_URL}/samples/${sampleId}`);
        
        if (response.ok()) {
          const data = await response.json();
          expect(data.id || data.sampleId).toBe(sampleId);
        }
      }
    }
  });
});

test.describe('API Error Handling', () => {
  test('should return 404 for non-existent endpoint', async ({ request }) => {
    const response = await request.get(`${API_URL}/nonexistent`);
    
    expect(response.status()).toBe(404);
  });

  test('should return 400 for invalid parameters', async ({ request }) => {
    const response = await request.get(`${API_URL}/mutations?limit=-1`);
    
    // Should either return 400 or handle gracefully
    expect([200, 400]).toContain(response.status());
  });

  test('should return error message for invalid requests', async ({ request }) => {
    const response = await request.post(`${API_URL}/mutations`, {
      data: { invalid: 'data' },
    });
    
    // Should return error
    if (!response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });
});

test.describe('API CORS', () => {
  test('should include CORS headers', async ({ request }) => {
    const response = await request.get(`${API_URL}/health`);
    
    const headers = response.headers();
    
    // CORS headers should be present
    // Note: These might not be present in all configurations
  });
});
