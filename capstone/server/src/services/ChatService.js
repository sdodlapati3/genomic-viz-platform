/**
 * Chat Service
 * 
 * AI-powered data querying service
 */

import { MutationService } from './MutationService.js';
import { SurvivalService } from './SurvivalService.js';
import { ExpressionService } from './ExpressionService.js';
import { SampleService } from './SampleService.js';

export class ChatService {
  constructor() {
    this.mutationService = new MutationService();
    this.survivalService = new SurvivalService();
    this.expressionService = new ExpressionService();
    this.sampleService = new SampleService();
  }

  /**
   * Process natural language message
   */
  async processMessage(message, context = []) {
    const lowerMessage = message.toLowerCase();

    // Pattern matching for different query types
    if (this.matchesPattern(lowerMessage, ['mutation', 'mutations', 'variant'])) {
      return this.handleMutationQuery(message, lowerMessage);
    }

    if (this.matchesPattern(lowerMessage, ['gene', 'genes', 'top', 'most mutated'])) {
      return this.handleGeneQuery(message, lowerMessage);
    }

    if (this.matchesPattern(lowerMessage, ['survival', 'outcome', 'prognosis'])) {
      return this.handleSurvivalQuery(message, lowerMessage);
    }

    if (this.matchesPattern(lowerMessage, ['sample', 'samples', 'patient'])) {
      return this.handleSampleQuery(message, lowerMessage);
    }

    if (this.matchesPattern(lowerMessage, ['expression', 'expressed'])) {
      return this.handleExpressionQuery(message, lowerMessage);
    }

    if (this.matchesPattern(lowerMessage, ['help', 'what can'])) {
      return this.getHelpResponse();
    }

    // Default response
    return {
      text: "I can help you explore the genomic data. Try asking about mutations, genes, survival, or samples.",
      suggestions: [
        "How many mutations are there?",
        "What are the top mutated genes?",
        "Show me survival statistics"
      ]
    };
  }

  matchesPattern(text, patterns) {
    return patterns.some(p => text.includes(p));
  }

  async handleMutationQuery(message, lowerMessage) {
    const stats = await this.mutationService.getStats();
    
    // Check for specific gene
    const geneMatch = message.match(/\b(TP53|BRCA1|BRCA2|EGFR|KRAS|PIK3CA|PTEN|APC|RB1|MYC)\b/i);
    
    if (geneMatch) {
      const gene = geneMatch[1].toUpperCase();
      const geneMutations = await this.mutationService.getMutationsByGene(gene);
      
      if (geneMutations.length === 0) {
        return {
          text: `No mutations found in ${gene} in the current dataset.`,
          data: { gene, count: 0 }
        };
      }

      return {
        text: `Found ${geneMutations.length} mutations in ${gene}.`,
        data: {
          gene,
          count: geneMutations.length,
          mutations: geneMutations.slice(0, 10)
        },
        suggestions: [
          `Show all ${gene} mutation types`,
          "What are the top mutated genes?"
        ]
      };
    }

    return {
      text: `The dataset contains ${stats.totalMutations} mutations across ${stats.totalGenes} genes and ${stats.totalSamples} samples.`,
      data: stats,
      suggestions: [
        "What are the mutation types?",
        "Which genes have the most mutations?"
      ]
    };
  }

  async handleGeneQuery(message, lowerMessage) {
    const topGenes = await this.mutationService.getTopMutatedGenes(10);
    
    const geneList = topGenes.map((g, i) => `${i + 1}. ${g.gene}: ${g.count} mutations`).join('\n');
    
    return {
      text: `Top 10 most mutated genes:\n${geneList}`,
      data: { topGenes },
      suggestions: topGenes.slice(0, 3).map(g => `Tell me about ${g.gene} mutations`)
    };
  }

  async handleSurvivalQuery(message, lowerMessage) {
    const summary = await this.survivalService.getSummaryStatistics();
    
    return {
      text: `Survival Summary:\n- Total patients: ${summary.totalPatients}\n- Events: ${summary.events} (${summary.eventRate}%)\n- Median follow-up: ${summary.medianFollowUp.toFixed(1)} months`,
      data: summary,
      suggestions: [
        "Show survival by cancer type",
        "What are the hazard ratios?"
      ]
    };
  }

  async handleSampleQuery(message, lowerMessage) {
    const stats = await this.sampleService.getStats();
    const distribution = await this.sampleService.getCancerTypeDistribution();
    
    return {
      text: `Sample Statistics:\n- Total samples: ${stats.totalSamples}\n- Average mutations per sample: ${stats.averageMutationsPerSample}`,
      data: { stats, distribution },
      suggestions: [
        "Show cancer type distribution",
        "How many mutations are there?"
      ]
    };
  }

  async handleExpressionQuery(message, lowerMessage) {
    const genes = await this.expressionService.getGeneList();
    
    return {
      text: `Expression data available for ${genes.length} genes across multiple samples.`,
      data: { geneCount: genes.length, genes: genes.slice(0, 10) },
      suggestions: [
        "Show expression heatmap",
        "Get differential expression"
      ]
    };
  }

  getHelpResponse() {
    return {
      text: `I can help you explore:\n- Mutations (counts, types, by gene)\n- Genes (top mutated, specific gene info)\n- Survival (statistics, Kaplan-Meier)\n- Samples (counts, cancer types)\n- Expression (heatmap, differential)`,
      suggestions: [
        "How many mutations are there?",
        "What are the top mutated genes?",
        "Show survival statistics"
      ]
    };
  }

  /**
   * Execute structured query
   */
  async executeQuery(query) {
    switch (query.type) {
      case 'mutations':
        return this.mutationService.getMutations(query.filters, query.pagination);
      case 'genes':
        return this.mutationService.getTopMutatedGenes(query.limit);
      case 'survival':
        return this.survivalService.getSurvivalData(query.filters);
      case 'samples':
        return this.sampleService.getSamples(query.filters, query.pagination);
      default:
        throw new Error(`Unknown query type: ${query.type}`);
    }
  }

  /**
   * Get query suggestions
   */
  async getSuggestions() {
    const topGenes = await this.mutationService.getTopMutatedGenes(3);
    
    return [
      "How many mutations are in the dataset?",
      `Tell me about ${topGenes[0]?.gene || 'TP53'} mutations`,
      "What are the survival statistics?",
      "Show cancer type distribution"
    ];
  }
}
