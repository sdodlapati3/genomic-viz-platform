/**
 * Chat Service
 * Manages conversation state and integrates LLM with RAG
 */

import { v4 as uuidv4 } from 'uuid';
import { createLLMService } from './llmService.js';
import { getRelevantContext, searchKnowledge } from '../data/knowledgeBase.js';
import { queryMutations, querySamples, getStatistics, parseNaturalQuery } from '../data/sampleData.js';

/**
 * Conversation session
 */
class Conversation {
  constructor(id = uuidv4()) {
    this.id = id;
    this.messages = [];
    this.metadata = {
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0
    };
  }

  addMessage(role, content, metadata = {}) {
    const message = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date().toISOString(),
      ...metadata
    };
    this.messages.push(message);
    this.metadata.lastActivity = message.timestamp;
    this.metadata.messageCount++;
    return message;
  }

  getMessages() {
    return this.messages;
  }

  getChatHistory(limit = 10) {
    return this.messages.slice(-limit).map(m => ({
      role: m.role,
      content: m.content
    }));
  }

  clear() {
    this.messages = [];
    this.metadata.messageCount = 0;
  }
}

/**
 * Chat Service class
 */
export class ChatService {
  constructor(options = {}) {
    this.llm = createLLMService(options);
    this.conversations = new Map();
    this.options = {
      maxHistoryMessages: options.maxHistoryMessages || 10,
      useRAG: options.useRAG !== false,
      maxContextChunks: options.maxContextChunks || 3
    };
  }

  /**
   * Get or create a conversation
   */
  getConversation(conversationId = null) {
    if (conversationId && this.conversations.has(conversationId)) {
      return this.conversations.get(conversationId);
    }
    
    const conversation = new Conversation(conversationId);
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /**
   * Process user message and generate response
   */
  async chat(userMessage, conversationId = null) {
    const conversation = this.getConversation(conversationId);
    
    // Add user message to conversation
    const userMsg = conversation.addMessage('user', userMessage);
    
    try {
      // Step 1: Analyze query for data requests
      const dataResult = await this.processDataQuery(userMessage);
      
      // Step 2: Retrieve relevant context (RAG)
      let context = '';
      if (this.options.useRAG) {
        context = getRelevantContext(userMessage, this.options.maxContextChunks);
      }
      
      // Step 3: Prepare context with data results
      if (dataResult) {
        context = `Data Query Result:\n${JSON.stringify(dataResult, null, 2)}\n\n${context}`;
      }
      
      // Step 4: Get chat history
      const history = conversation.getChatHistory(this.options.maxHistoryMessages);
      
      // Step 5: Generate LLM response
      const response = await this.llm.generateResponse(history, context);
      
      // Step 6: Add assistant response to conversation
      const assistantMsg = conversation.addMessage('assistant', response.content, {
        usage: response.usage,
        model: response.model,
        dataResult: dataResult ? true : false
      });
      
      return {
        conversationId: conversation.id,
        message: assistantMsg,
        dataResult,
        usage: response.usage
      };
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message to conversation
      const errorMsg = conversation.addMessage('assistant', 
        'I apologize, but I encountered an error processing your request. Please try again.',
        { error: error.message }
      );
      
      return {
        conversationId: conversation.id,
        message: errorMsg,
        error: error.message
      };
    }
  }

  /**
   * Process potential data queries
   */
  async processDataQuery(message) {
    const parsed = parseNaturalQuery(message);
    
    if (parsed.type === 'unknown') {
      return null;
    }
    
    switch (parsed.type) {
      case 'mutations':
        return {
          type: 'mutations',
          query: parsed.criteria,
          results: queryMutations(parsed.criteria)
        };
      
      case 'samples':
        return {
          type: 'samples',
          query: parsed.criteria,
          results: querySamples(parsed.criteria)
        };
      
      case 'statistics':
        const statType = parsed.criteria.gene ? 'mutations_by_gene' : 
                        parsed.criteria.cancer ? 'mutations_by_cancer' : 
                        'mutations_by_gene';
        return {
          type: 'statistics',
          query: statType,
          results: getStatistics(statType)
        };
      
      default:
        return null;
    }
  }

  /**
   * Search knowledge base
   */
  searchKnowledge(query) {
    return searchKnowledge(query);
  }

  /**
   * Get conversation history
   */
  getHistory(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return null;
    }
    return {
      id: conversation.id,
      metadata: conversation.metadata,
      messages: conversation.getMessages()
    };
  }

  /**
   * Clear conversation
   */
  clearConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.clear();
      return true;
    }
    return false;
  }

  /**
   * Delete conversation
   */
  deleteConversation(conversationId) {
    return this.conversations.delete(conversationId);
  }

  /**
   * Get all active conversations
   */
  listConversations() {
    return Array.from(this.conversations.values()).map(c => ({
      id: c.id,
      metadata: c.metadata
    }));
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      provider: this.llm.getProviderInfo(),
      activeConversations: this.conversations.size,
      options: this.options
    };
  }
}

/**
 * Create chat service instance
 */
export function createChatService(options = {}) {
  return new ChatService(options);
}
