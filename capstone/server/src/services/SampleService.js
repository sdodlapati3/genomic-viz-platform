/**
 * Sample Service
 * 
 * Business logic for sample/patient data
 */

import { sampleMutations, sampleSurvivalData } from '../data/sampleData.js';

export class SampleService {
  constructor() {
    // Generate sample data from mutations and survival
    this.samples = this.generateSampleData();
  }

  generateSampleData() {
    const sampleMap = new Map();

    // Add samples from mutations
    sampleMutations.forEach(m => {
      if (!sampleMap.has(m.sample)) {
        sampleMap.set(m.sample, {
          id: m.sample,
          cancerType: m.cancerType,
          mutations: [],
          clinicalData: {}
        });
      }
      sampleMap.get(m.sample).mutations.push(m);
    });

    // Add clinical data from survival
    sampleSurvivalData.forEach(s => {
      if (sampleMap.has(s.sample)) {
        sampleMap.get(s.sample).clinicalData = {
          survivalTime: s.time,
          event: s.event,
          tp53Mutation: s.tp53Mutation
        };
      }
    });

    return Array.from(sampleMap.values());
  }

  /**
   * Get samples with filtering and pagination
   */
  async getSamples(filters = {}, pagination = { page: 1, limit: 100 }) {
    let filtered = [...this.samples];

    if (filters.cancerType) {
      filtered = filtered.filter(s => s.cancerType === filters.cancerType);
    }

    // Pagination
    const total = filtered.length;
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    const data = filtered.slice(start, end);

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        pages: Math.ceil(total / pagination.limit)
      }
    };
  }

  /**
   * Get sample statistics
   */
  async getStats() {
    const cancerTypes = {};
    let totalMutations = 0;

    this.samples.forEach(s => {
      cancerTypes[s.cancerType] = (cancerTypes[s.cancerType] || 0) + 1;
      totalMutations += s.mutations.length;
    });

    return {
      totalSamples: this.samples.length,
      cancerTypes,
      averageMutationsPerSample: (totalMutations / this.samples.length).toFixed(1)
    };
  }

  /**
   * Get sample by ID
   */
  async getSampleById(id) {
    return this.samples.find(s => s.id === id);
  }

  /**
   * Get cancer type distribution
   */
  async getCancerTypeDistribution() {
    const distribution = {};

    this.samples.forEach(s => {
      distribution[s.cancerType] = (distribution[s.cancerType] || 0) + 1;
    });

    return Object.entries(distribution).map(([cancerType, count]) => ({
      cancerType,
      count,
      percentage: (count / this.samples.length * 100).toFixed(1)
    }));
  }
}
