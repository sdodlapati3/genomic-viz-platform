/**
 * Chat/AI Interface for Natural Language Genomic Queries
 *
 * Parses natural language queries and translates them into data requests
 * Provides a conversational interface for exploring genomic data
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    query?: ParsedQuery;
    data?: unknown;
    visualization?: string;
  };
}

export interface ParsedQuery {
  intent: QueryIntent;
  entities: QueryEntities;
  confidence: number;
  rawText: string;
}

export type QueryIntent =
  | 'gene_info'
  | 'mutation_search'
  | 'sample_filter'
  | 'survival_analysis'
  | 'expression_query'
  | 'cnv_analysis'
  | 'fusion_search'
  | 'pathway_analysis'
  | 'compare_samples'
  | 'navigate_to'
  | 'help'
  | 'unknown';

export interface QueryEntities {
  genes?: string[];
  samples?: string[];
  cancerTypes?: string[];
  mutationTypes?: string[];
  chromosomes?: string[];
  positions?: { chr: string; start: number; end?: number }[];
  thresholds?: { field: string; op: string; value: number }[];
  visualizations?: string[];
}

/**
 * Keyword patterns for intent detection
 */
const INTENT_PATTERNS: Record<QueryIntent, RegExp[]> = {
  gene_info: [
    /(?:tell me about|what is|describe|show|info about)\s+(\w+)\s*(?:gene)?/i,
    /gene\s+(\w+)/i,
  ],
  mutation_search: [
    /(?:mutations?|variants?)\s+(?:in|for|of)\s+(\w+)/i,
    /(\w+)\s+mutations?/i,
    /(?:find|search|show)\s+mutations?/i,
  ],
  sample_filter: [
    /(?:samples?|cases?|patients?)\s+with\s+(.+)/i,
    /(?:filter|select)\s+(?:samples?|cases?)/i,
  ],
  survival_analysis: [
    /survival\s+(?:analysis|curve|plot)/i,
    /kaplan[\s-]meier/i,
    /(?:overall|progression-free)\s+survival/i,
  ],
  expression_query: [
    /expression\s+(?:of|for|in)\s+(\w+)/i,
    /(\w+)\s+expression/i,
    /(?:differential|gene)\s+expression/i,
  ],
  cnv_analysis: [
    /(?:copy number|cnv|amplification|deletion)/i,
    /(?:gains?|losses?)\s+(?:in|on)\s+(?:chr(?:omosome)?)?/i,
  ],
  fusion_search: [
    /fusion(?:s)?\s+(?:in|for|of|involving)/i,
    /(\w+)[-\/](\w+)\s+fusion/i,
    /gene\s+fusion/i,
  ],
  pathway_analysis: [
    /pathway(?:s)?\s+(?:analysis|enrichment)/i,
    /(?:go|kegg|reactome)\s+(?:analysis|enrichment)/i,
  ],
  compare_samples: [
    /compare\s+(?:samples?|patients?|cases?)/i,
    /(?:difference|comparison)\s+between/i,
  ],
  navigate_to: [
    /(?:go to|navigate to|open|show|display)\s+(.+)/i,
    /(?:chr(?:omosome)?)\s*(\d+|[XY]):(\d+)/i,
  ],
  help: [/(?:help|how do|what can|commands?|usage)/i],
  unknown: [],
};

/**
 * Gene symbols pattern
 */
const GENE_PATTERN = /\b([A-Z][A-Z0-9]{1,10})\b/g;

/**
 * Chromosome pattern
 */
const CHR_PATTERN = /chr(?:omosome)?\s*(\d+|[XY])/gi;

/**
 * Cancer type patterns
 */
const CANCER_TYPES: Record<string, string[]> = {
  lung: ['lung', 'nsclc', 'sclc', 'lung cancer', 'lung adenocarcinoma'],
  breast: ['breast', 'brca', 'breast cancer'],
  colorectal: ['colorectal', 'colon', 'crc', 'colon cancer'],
  leukemia: ['leukemia', 'aml', 'all', 'cml', 'cll'],
  lymphoma: ['lymphoma', 'dlbcl', 'hodgkin'],
  brain: ['brain', 'glioma', 'gbm', 'glioblastoma', 'medulloblastoma'],
  pancreatic: ['pancreas', 'pancreatic', 'pdac'],
  prostate: ['prostate', 'prostate cancer'],
  ovarian: ['ovarian', 'ovary', 'ovarian cancer'],
  melanoma: ['melanoma', 'skin cancer'],
};

/**
 * Chat/AI Interface Class
 */
export class ChatInterface {
  private messages: ChatMessage[] = [];
  private context: Map<string, unknown> = new Map();
  private messageHandlers: Map<QueryIntent, (query: ParsedQuery) => Promise<string>> = new Map();

  constructor() {
    // Add initial system message
    this.messages.push({
      id: this.generateId(),
      role: 'system',
      content: 'Genomic Visualization Assistant initialized. How can I help you explore your data?',
      timestamp: new Date(),
    });
  }

  /**
   * Register a handler for a specific query intent
   */
  onIntent(intent: QueryIntent, handler: (query: ParsedQuery) => Promise<string>): void {
    this.messageHandlers.set(intent, handler);
  }

  /**
   * Process a user message and generate response
   */
  async processMessage(text: string): Promise<ChatMessage> {
    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    this.messages.push(userMessage);

    // Parse the query
    const query = this.parseQuery(text);
    userMessage.metadata = { query };

    // Generate response
    let responseText: string;
    let responseData: unknown;

    // Check for registered handler
    const handler = this.messageHandlers.get(query.intent);
    if (handler) {
      try {
        responseText = await handler(query);
      } catch (error) {
        responseText = `I encountered an error processing your request: ${error}`;
      }
    } else {
      // Default response
      responseText = this.getDefaultResponse(query);
    }

    // Add assistant response
    const assistantMessage: ChatMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: responseText,
      timestamp: new Date(),
      metadata: { query, data: responseData },
    };
    this.messages.push(assistantMessage);

    return assistantMessage;
  }

  /**
   * Parse a natural language query
   */
  parseQuery(text: string): ParsedQuery {
    const intent = this.detectIntent(text);
    const entities = this.extractEntities(text);

    // Calculate confidence based on entity extraction
    let confidence = 0.5;
    if (intent !== 'unknown') confidence += 0.2;
    if (entities.genes && entities.genes.length > 0) confidence += 0.15;
    if (entities.cancerTypes && entities.cancerTypes.length > 0) confidence += 0.15;

    return {
      intent,
      entities,
      confidence: Math.min(confidence, 1.0),
      rawText: text,
    };
  }

  /**
   * Detect query intent
   */
  private detectIntent(text: string): QueryIntent {
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return intent as QueryIntent;
        }
      }
    }
    return 'unknown';
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string): QueryEntities {
    const entities: QueryEntities = {};

    // Extract genes
    const geneMatches = text.toUpperCase().match(GENE_PATTERN);
    if (geneMatches) {
      // Filter to likely gene symbols (length 2-10, contains at least one letter)
      entities.genes = geneMatches.filter(
        (g) => g.length >= 2 && g.length <= 10 && /[A-Z]/.test(g)
      );
    }

    // Extract chromosomes
    const chrMatches = [...text.matchAll(CHR_PATTERN)];
    if (chrMatches.length > 0) {
      entities.chromosomes = chrMatches.map((m) => `chr${m[1]}`);
    }

    // Extract cancer types
    const cancerTypes: string[] = [];
    for (const [type, keywords] of Object.entries(CANCER_TYPES)) {
      for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword)) {
          cancerTypes.push(type);
          break;
        }
      }
    }
    if (cancerTypes.length > 0) {
      entities.cancerTypes = cancerTypes;
    }

    // Extract mutation types
    const mutationTypes: string[] = [];
    const mutationPatterns = [
      { pattern: /missense/i, type: 'missense' },
      { pattern: /nonsense/i, type: 'nonsense' },
      { pattern: /frameshift/i, type: 'frameshift' },
      { pattern: /splice/i, type: 'splice' },
      { pattern: /silent|synonymous/i, type: 'silent' },
      { pattern: /inframe|in-frame/i, type: 'inframe' },
    ];
    for (const { pattern, type } of mutationPatterns) {
      if (pattern.test(text)) {
        mutationTypes.push(type);
      }
    }
    if (mutationTypes.length > 0) {
      entities.mutationTypes = mutationTypes;
    }

    return entities;
  }

  /**
   * Get default response for unhandled queries
   */
  private getDefaultResponse(query: ParsedQuery): string {
    if (query.intent === 'help') {
      return this.getHelpText();
    }

    if (query.intent === 'unknown') {
      return `I'm not sure I understand. You can ask me about:
      
• **Gene information**: "Tell me about TP53"
• **Mutations**: "Show mutations in BRCA1"
• **Samples**: "Find samples with KRAS mutations"
• **Survival**: "Show survival analysis for lung cancer"
• **Expression**: "Show TP53 expression"
• **Navigation**: "Go to chr17:7577120"

Type "help" for more examples.`;
    }

    // Build response based on intent and entities
    let response = '';

    switch (query.intent) {
      case 'gene_info':
        if (query.entities.genes && query.entities.genes.length > 0) {
          response = `Looking up information for gene${query.entities.genes.length > 1 ? 's' : ''}: ${query.entities.genes.join(', ')}`;
        } else {
          response = 'Please specify which gene you want to learn about.';
        }
        break;

      case 'mutation_search':
        response = this.buildMutationSearchResponse(query);
        break;

      case 'sample_filter':
        response = 'I can help you filter samples. What criteria would you like to use?';
        break;

      case 'survival_analysis':
        response = 'Opening survival analysis view...';
        break;

      case 'expression_query':
        if (query.entities.genes && query.entities.genes.length > 0) {
          response = `Fetching expression data for: ${query.entities.genes.join(', ')}`;
        } else {
          response = 'Which gene would you like to see expression data for?';
        }
        break;

      case 'cnv_analysis':
        response = 'Opening copy number analysis view...';
        break;

      case 'fusion_search':
        response = 'Searching for gene fusions...';
        break;

      case 'pathway_analysis':
        response = 'Which pathway or gene set would you like to analyze?';
        break;

      case 'compare_samples':
        response = 'What samples would you like to compare?';
        break;

      case 'navigate_to':
        if (query.entities.chromosomes && query.entities.chromosomes.length > 0) {
          response = `Navigating to ${query.entities.chromosomes[0]}...`;
        } else {
          response = 'Please specify a genomic location (e.g., chr17:7577120).';
        }
        break;

      default:
        response = 'How can I help you explore your genomic data?';
    }

    return response;
  }

  /**
   * Build mutation search response
   */
  private buildMutationSearchResponse(query: ParsedQuery): string {
    const parts: string[] = ['Searching for mutations'];

    if (query.entities.genes && query.entities.genes.length > 0) {
      parts.push(
        `in gene${query.entities.genes.length > 1 ? 's' : ''}: ${query.entities.genes.join(', ')}`
      );
    }

    if (query.entities.mutationTypes && query.entities.mutationTypes.length > 0) {
      parts.push(`of type: ${query.entities.mutationTypes.join(', ')}`);
    }

    if (query.entities.cancerTypes && query.entities.cancerTypes.length > 0) {
      parts.push(`in ${query.entities.cancerTypes.join(', ')} samples`);
    }

    return parts.join(' ') + '...';
  }

  /**
   * Get help text
   */
  private getHelpText(): string {
    return `# Genomic Visualization Assistant

I can help you explore genomic data using natural language. Here are some things you can ask:

## Gene Queries
- "Tell me about TP53"
- "What is BRCA1?"
- "Show gene EGFR"

## Mutation Searches
- "Show mutations in TP53"
- "Find missense mutations in KRAS"
- "Mutations in lung cancer samples"

## Sample Filtering
- "Samples with TP53 mutations"
- "Filter samples by cancer type"

## Survival Analysis
- "Show survival analysis"
- "Kaplan-Meier plot for BRCA1 mutated vs wild-type"

## Expression Queries
- "TP53 expression levels"
- "Differential expression analysis"

## Navigation
- "Go to chr17:7577120"
- "Navigate to BRCA1 locus"

## Analysis
- "Compare high vs low expression samples"
- "Pathway enrichment analysis"

Feel free to ask questions in natural language!`;
  }

  /**
   * Get conversation history
   */
  getMessages(): ChatMessage[] {
    return this.messages;
  }

  /**
   * Clear conversation
   */
  clearMessages(): void {
    this.messages = [
      {
        id: this.generateId(),
        role: 'system',
        content: 'Conversation cleared. How can I help you?',
        timestamp: new Date(),
      },
    ];
  }

  /**
   * Set context for query resolution
   */
  setContext(key: string, value: unknown): void {
    this.context.set(key, value);
  }

  /**
   * Get context value
   */
  getContext(key: string): unknown {
    return this.context.get(key);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Chat UI Component HTML
 */
export function createChatUI(containerId: string): string {
  return `
    <div id="${containerId}" class="chat-container">
      <div class="chat-header">
        <h3>🤖 Genomic Assistant</h3>
        <button class="chat-clear-btn" title="Clear conversation">🗑️</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        <!-- Messages render here -->
      </div>
      <div class="chat-input-container">
        <input type="text" 
               id="chat-input" 
               placeholder="Ask about genes, mutations, samples..." 
               autocomplete="off" />
        <button id="chat-send-btn">Send</button>
      </div>
    </div>
  `;
}

/**
 * CSS styles for chat UI
 */
export const chatStyles = `
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 400px;
    background: #1a1a2e;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #16213e;
    border-bottom: 1px solid #0f3460;
  }
  
  .chat-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #e0e0e0;
  }
  
  .chat-clear-btn {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  
  .chat-clear-btn:hover {
    opacity: 1;
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .chat-message {
    max-width: 85%;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 0.9rem;
    line-height: 1.4;
  }
  
  .chat-message.user {
    align-self: flex-end;
    background: #3498db;
    color: white;
    border-bottom-right-radius: 4px;
  }
  
  .chat-message.assistant {
    align-self: flex-start;
    background: #16213e;
    color: #e0e0e0;
    border-bottom-left-radius: 4px;
  }
  
  .chat-message.system {
    align-self: center;
    background: transparent;
    color: #666;
    font-style: italic;
    font-size: 0.85rem;
  }
  
  .chat-input-container {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #16213e;
    border-top: 1px solid #0f3460;
  }
  
  #chat-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    background: #1a1a2e;
    border: 1px solid #0f3460;
    border-radius: 6px;
    color: #e0e0e0;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s;
  }
  
  #chat-input:focus {
    border-color: #3498db;
  }
  
  #chat-send-btn {
    padding: 0.5rem 1rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }
  
  #chat-send-btn:hover {
    background: #2980b9;
  }
`;
