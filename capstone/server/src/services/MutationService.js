/**
 * Mutation Service
 * 
 * Business logic for mutation data operations
 */

import { sampleMutations } from '../data/sampleData.js';

export class MutationService {
  constructor() {
    this.mutations = [...sampleMutations];
  }

  /**
   * Get mutations with filtering and pagination
   */
  async getMutations(filters = {}, pagination = { page: 1, limit: 100 }) {
    let filtered = [...this.mutations];

    // Apply filters
    if (filters.gene) {
      filtered = filtered.filter(m => m.gene === filters.gene);
    }
    if (filters.type) {
      filtered = filtered.filter(m => m.type === filters.type);
    }
    if (filters.sample) {
      filtered = filtered.filter(m => m.sample === filters.sample);
    }
    if (filters.cancerType) {
      filtered = filtered.filter(m => m.cancerType === filters.cancerType);
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
   * Get mutation statistics
   */
  async getStats() {
    const genes = [...new Set(this.mutations.map(m => m.gene))];
    const samples = [...new Set(this.mutations.map(m => m.sample))];
    const types = {};
    
    this.mutations.forEach(m => {
      types[m.type] = (types[m.type] || 0) + 1;
    });

    return {
      totalMutations: this.mutations.length,
      totalGenes: genes.length,
      totalSamples: samples.length,
      mutationTypes: types,
      genes
    };
  }

  /**
   * Get mutations for a specific gene
   */
  async getMutationsByGene(gene) {
    return this.mutations.filter(m => 
      m.gene.toLowerCase() === gene.toLowerCase()
    );
  }

  /**
   * Get mutation type distribution
   */
  async getMutationTypeDistribution() {
    const distribution = {};
    
    this.mutations.forEach(m => {
      distribution[m.type] = (distribution[m.type] || 0) + 1;
    });

    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percentage: (count / this.mutations.length * 100).toFixed(1)
    }));
  }

  /**
   * Get top mutated genes
   */
  async getTopMutatedGenes(limit = 10) {
    const geneCounts = {};
    
    this.mutations.forEach(m => {
      geneCounts[m.gene] = (geneCounts[m.gene] || 0) + 1;
    });

    return Object.entries(geneCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([gene, count]) => ({ gene, count }));
  }

  /**
   * Add mutations (batch)
   */
  async addMutations(mutations) {
    const added = mutations.map(m => ({
      id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...m
    }));
    
    this.mutations.push(...added);
    
    return {
      added: added.length,
      total: this.mutations.length
    };
  }
}
