/**
 * Expression Service
 * 
 * Business logic for gene expression data
 */

import { sampleExpressionData } from '../data/sampleData.js';

export class ExpressionService {
  constructor() {
    this.expressionData = { ...sampleExpressionData };
  }

  /**
   * Get expression matrix
   */
  async getExpressionMatrix(filters = {}) {
    let { genes, samples, expression } = this.expressionData;

    // Filter genes if specified
    if (filters.genes && filters.genes.length > 0) {
      const geneIndices = filters.genes
        .map(g => genes.indexOf(g))
        .filter(i => i !== -1);
      
      genes = geneIndices.map(i => genes[i]);
      expression = geneIndices.map(i => expression[i]);
    }

    // Filter samples if specified
    if (filters.samples && filters.samples.length > 0) {
      const sampleIndices = filters.samples
        .map(s => samples.indexOf(s))
        .filter(i => i !== -1);
      
      samples = sampleIndices.map(i => samples[i]);
      expression = expression.map(row => 
        sampleIndices.map(i => row[i])
      );
    }

    return { genes, samples, expression };
  }

  /**
   * Get list of available genes
   */
  async getGeneList() {
    return this.expressionData.genes;
  }

  /**
   * Get expression for specific gene
   */
  async getGeneExpression(gene) {
    const geneIndex = this.expressionData.genes.indexOf(gene);
    
    if (geneIndex === -1) {
      return null;
    }

    return {
      gene,
      samples: this.expressionData.samples,
      expression: this.expressionData.expression[geneIndex]
    };
  }

  /**
   * Get differential expression results (mock)
   */
  async getDifferentialExpression(group1, group2, threshold = 0.05) {
    // Generate mock differential expression data
    return this.expressionData.genes.map(gene => ({
      gene,
      log2FoldChange: (Math.random() - 0.5) * 6,
      pValue: Math.random() * 0.1,
      adjustedPValue: Math.random() * 0.15,
      baseMean: Math.random() * 1000 + 100
    })).filter(d => d.adjustedPValue < threshold);
  }

  /**
   * Get UMAP coordinates (mock)
   */
  async getUMAPCoordinates() {
    const cancerTypes = ['ALL', 'AML', 'Neuroblastoma', 'Osteosarcoma'];
    const clusterCenters = {
      'ALL': { x: -3, y: 2 },
      'AML': { x: 2, y: 3 },
      'Neuroblastoma': { x: -2, y: -3 },
      'Osteosarcoma': { x: 3, y: -2 }
    };

    return this.expressionData.samples.map((sample, i) => {
      const cancerType = cancerTypes[i % cancerTypes.length];
      const center = clusterCenters[cancerType];
      
      return {
        sample,
        cancerType,
        umap1: center.x + (Math.random() - 0.5) * 2,
        umap2: center.y + (Math.random() - 0.5) * 2
      };
    });
  }
}
