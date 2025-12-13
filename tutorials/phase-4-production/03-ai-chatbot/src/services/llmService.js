/**
 * LLM Service
 * Unified interface for OpenAI and Anthropic APIs
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

/**
 * LLM Provider Configuration
 */
const config = {
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: 1024,
    temperature: 0.7
  },
  anthropic: {
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    maxTokens: 1024,
    temperature: 0.7
  }
};

/**
 * System prompt for genomics chatbot
 */
const SYSTEM_PROMPT = `You are a helpful genomics research assistant specializing in cancer genomics, mutations, and data visualization. You help users:

1. Understand genetic mutations and their clinical significance
2. Interpret genomic data and visualizations
3. Query mutation databases and sample information
4. Explain cancer biology concepts

Guidelines:
- Provide accurate, scientifically sound information
- Cite relevant genes, mutations, and databases when applicable
- Suggest appropriate visualizations for data exploration
- Be concise but thorough in explanations
- If uncertain, acknowledge limitations and suggest consulting experts

When provided with context from our knowledge base, use it to give informed answers.
When users ask about data queries, help them formulate proper queries and interpret results.`;

/**
 * Create LLM client based on provider
 */
function createClient(provider) {
  switch (provider) {
    case 'openai':
      return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    case 'anthropic':
      return new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

/**
 * Generate response using OpenAI
 */
async function generateOpenAI(client, messages, context = '') {
  const systemMessage = context 
    ? `${SYSTEM_PROMPT}\n\nRelevant Context:\n${context}`
    : SYSTEM_PROMPT;

  const response = await client.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: 'system', content: systemMessage },
      ...messages
    ],
    max_tokens: config.openai.maxTokens,
    temperature: config.openai.temperature
  });

  return {
    content: response.choices[0].message.content,
    usage: {
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens
    },
    model: response.model
  };
}

/**
 * Generate response using Anthropic
 */
async function generateAnthropic(client, messages, context = '') {
  const systemMessage = context 
    ? `${SYSTEM_PROMPT}\n\nRelevant Context:\n${context}`
    : SYSTEM_PROMPT;

  // Convert messages to Anthropic format
  const anthropicMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content
  }));

  const response = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: config.anthropic.maxTokens,
    system: systemMessage,
    messages: anthropicMessages
  });

  return {
    content: response.content[0].text,
    usage: {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens
    },
    model: response.model
  };
}

/**
 * LLM Service class
 */
export class LLMService {
  constructor(provider = process.env.LLM_PROVIDER || 'openai') {
    this.provider = provider;
    this.client = null;
    this.initialized = false;
  }

  /**
   * Initialize the LLM client
   */
  initialize() {
    if (this.initialized) return;
    
    try {
      this.client = createClient(this.provider);
      this.initialized = true;
      console.log(`✅ LLM Service initialized with ${this.provider}`);
    } catch (error) {
      console.error(`❌ Failed to initialize LLM Service:`, error.message);
      throw error;
    }
  }

  /**
   * Generate a chat response
   */
  async generateResponse(messages, context = '') {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      switch (this.provider) {
        case 'openai':
          return await generateOpenAI(this.client, messages, context);
        case 'anthropic':
          return await generateAnthropic(this.client, messages, context);
        default:
          throw new Error(`Unknown provider: ${this.provider}`);
      }
    } catch (error) {
      console.error('LLM generation error:', error);
      throw error;
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable() {
    const apiKey = this.provider === 'openai' 
      ? process.env.OPENAI_API_KEY 
      : process.env.ANTHROPIC_API_KEY;
    
    return apiKey && apiKey !== 'your-openai-api-key-here' && apiKey !== 'your-anthropic-api-key-here';
  }

  /**
   * Get current provider info
   */
  getProviderInfo() {
    return {
      provider: this.provider,
      model: config[this.provider]?.model || 'unknown',
      initialized: this.initialized,
      available: this.isAvailable()
    };
  }
}

/**
 * Create a mock LLM service for demo/testing
 */
export class MockLLMService {
  constructor() {
    this.provider = 'mock';
    this.initialized = true;
  }

  async generateResponse(messages, context = '') {
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    // Generate contextual mock responses
    const response = this.generateMockResponse(lastMessage, context);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    return {
      content: response,
      usage: {
        promptTokens: Math.floor(lastMessage.length / 4),
        completionTokens: Math.floor(response.length / 4),
        totalTokens: Math.floor((lastMessage.length + response.length) / 4)
      },
      model: 'mock-gpt-4'
    };
  }

  generateMockResponse(query, context) {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('tp53')) {
      return `**TP53 Overview**

TP53 is one of the most important tumor suppressor genes, often called the "guardian of the genome." Here's what you should know:

- **Location**: Chromosome 17p13.1
- **Function**: Regulates cell cycle, apoptosis, and DNA repair
- **Cancer Role**: Mutated in ~50% of all human cancers

**Common Hotspot Mutations**:
- R175H (most frequent)
- R248Q/W
- R273H/C
- R282W

${context ? '\n*Based on our knowledge base, ' + context.substring(0, 200) + '...*' : ''}

Would you like to know more about specific TP53 mutations or see visualization options?`;
    }
    
    if (queryLower.includes('kras')) {
      return `**KRAS Oncogene Information**

KRAS is a key oncogene in the RAS/MAPK signaling pathway.

**Key Facts**:
- Found mutated in 25% of all cancers
- Highest frequency in pancreatic cancer (~90%)
- Common mutations: G12D, G12V, G12C

**Recent Breakthroughs**:
KRAS G12C inhibitors (sotorasib, adagrasib) have shown success in lung cancer treatment.

Would you like me to query our database for KRAS mutation statistics?`;
    }
    
    if (queryLower.includes('mutation') && (queryLower.includes('type') || queryLower.includes('kind'))) {
      return `**Types of Genetic Mutations**

1. **Missense**: Single nucleotide change → different amino acid
2. **Nonsense**: Creates premature stop codon
3. **Frameshift**: Insertions/deletions shifting reading frame
4. **Splice site**: Affects RNA splicing
5. **Silent**: No amino acid change

**Clinical Impact** varies from benign to pathogenic based on:
- Location in protein
- Conservation across species
- Functional domain affected

Need help classifying a specific variant?`;
    }

    if (queryLower.includes('visualiz') || queryLower.includes('plot') || queryLower.includes('chart')) {
      return `**Genomic Visualization Options**

Based on your data, I recommend:

1. **Lollipop Plot** - Best for showing mutations along a protein
2. **OncoPrint** - Matrix view of alterations across samples
3. **Survival Curve** - Kaplan-Meier for clinical outcomes
4. **Heatmap** - Gene expression patterns

Which visualization would you like to explore?`;
    }

    // Default response
    return `I can help you with genomic data analysis and visualization. Here are some things I can assist with:

- **Gene Information**: Ask about specific genes (TP53, KRAS, BRCA1, etc.)
- **Mutation Analysis**: Query mutations by gene, cancer type, or classification
- **Data Queries**: Help formulate queries for your genomic data
- **Visualizations**: Recommend appropriate plots for your data

What would you like to know more about?`;
  }

  isAvailable() {
    return true;
  }

  getProviderInfo() {
    return {
      provider: 'mock',
      model: 'mock-gpt-4',
      initialized: true,
      available: true
    };
  }
}

/**
 * Factory function to create appropriate LLM service
 */
export function createLLMService(options = {}) {
  const { useMock = false, provider } = options;
  
  if (useMock) {
    return new MockLLMService();
  }
  
  const service = new LLMService(provider);
  
  // Return mock if no API keys configured
  if (!service.isAvailable()) {
    console.log('⚠️ No API keys configured, using mock LLM service');
    return new MockLLMService();
  }
  
  return service;
}
