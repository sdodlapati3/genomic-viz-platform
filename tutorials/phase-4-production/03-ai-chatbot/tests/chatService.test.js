/**
 * Tests for Chat Service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ChatService, createChatService } from '../src/services/chatService.js';

describe('ChatService', () => {
  let chatService;

  beforeEach(() => {
    chatService = createChatService({ useMock: true });
  });

  describe('getConversation', () => {
    it('should create new conversation without ID', () => {
      const conv = chatService.getConversation();
      expect(conv).toBeDefined();
      expect(conv.id).toBeDefined();
    });

    it('should return same conversation for same ID', () => {
      const conv1 = chatService.getConversation();
      const conv2 = chatService.getConversation(conv1.id);
      expect(conv1.id).toBe(conv2.id);
    });

    it('should create new conversation with custom ID', () => {
      const conv = chatService.getConversation('custom-id');
      expect(conv.id).toBe('custom-id');
    });
  });

  describe('chat', () => {
    it('should generate response for message', async () => {
      const result = await chatService.chat('Hello, tell me about TP53');
      
      expect(result).toBeDefined();
      expect(result.conversationId).toBeDefined();
      expect(result.message).toBeDefined();
      expect(result.message.role).toBe('assistant');
      expect(result.message.content).toBeDefined();
      expect(result.message.content.length).toBeGreaterThan(0);
    });

    it('should maintain conversation context', async () => {
      const result1 = await chatService.chat('Tell me about KRAS');
      const result2 = await chatService.chat('What about its mutations?', result1.conversationId);
      
      expect(result2.conversationId).toBe(result1.conversationId);
      
      // Check conversation has messages
      const history = chatService.getHistory(result1.conversationId);
      expect(history.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('should include usage statistics', async () => {
      const result = await chatService.chat('What is a lollipop plot?');
      
      expect(result.usage).toBeDefined();
      expect(result.usage.totalTokens).toBeGreaterThan(0);
    });

    it('should handle data queries', async () => {
      const result = await chatService.chat('Show me TP53 mutations');
      
      expect(result.dataResult).toBeDefined();
      expect(result.dataResult.type).toBe('mutations');
      expect(Array.isArray(result.dataResult.results)).toBe(true);
    });
  });

  describe('processDataQuery', () => {
    it('should process mutation queries', async () => {
      const result = await chatService.processDataQuery('Show mutations in KRAS');
      
      expect(result).toBeDefined();
      expect(result.type).toBe('mutations');
      expect(result.query.gene).toBe('KRAS');
    });

    it('should process sample queries', async () => {
      const result = await chatService.processDataQuery('List breast cancer samples');
      
      expect(result).toBeDefined();
      expect(result.type).toBe('samples');
      expect(result.query.cancer).toBe('breast');
    });

    it('should return null for non-data queries', async () => {
      const result = await chatService.processDataQuery('Hello, how are you?');
      expect(result).toBeNull();
    });
  });

  describe('searchKnowledge', () => {
    it('should search knowledge base', () => {
      const results = chatService.searchKnowledge('BRCA1');
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('conversation management', () => {
    it('should list conversations', async () => {
      await chatService.chat('Hello');
      await chatService.chat('World');
      
      const list = chatService.listConversations();
      expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it('should get conversation history', async () => {
      const result = await chatService.chat('Test message');
      const history = chatService.getHistory(result.conversationId);
      
      expect(history).toBeDefined();
      expect(history.id).toBe(result.conversationId);
      expect(history.messages.length).toBe(2); // user + assistant
    });

    it('should clear conversation', async () => {
      const result = await chatService.chat('Test');
      const success = chatService.clearConversation(result.conversationId);
      
      expect(success).toBe(true);
      
      const history = chatService.getHistory(result.conversationId);
      expect(history.messages.length).toBe(0);
    });

    it('should delete conversation', async () => {
      const result = await chatService.chat('Test');
      const success = chatService.deleteConversation(result.conversationId);
      
      expect(success).toBe(true);
      
      const history = chatService.getHistory(result.conversationId);
      expect(history).toBeNull();
    });

    it('should return false for clearing nonexistent conversation', () => {
      const success = chatService.clearConversation('nonexistent-id');
      expect(success).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should return service status', () => {
      const status = chatService.getStatus();
      
      expect(status).toBeDefined();
      expect(status.provider).toBeDefined();
      expect(status.provider.provider).toBe('mock');
      expect(status.activeConversations).toBeDefined();
      expect(status.options).toBeDefined();
    });
  });
});

describe('createChatService', () => {
  it('should create service with default options', () => {
    const service = createChatService();
    expect(service).toBeInstanceOf(ChatService);
  });

  it('should create service with mock enabled', () => {
    const service = createChatService({ useMock: true });
    const status = service.getStatus();
    expect(status.provider.provider).toBe('mock');
  });

  it('should respect custom options', () => {
    const service = createChatService({
      useMock: true,
      maxHistoryMessages: 5,
      maxContextChunks: 2
    });
    const status = service.getStatus();
    expect(status.options.maxHistoryMessages).toBe(5);
    expect(status.options.maxContextChunks).toBe(2);
  });
});
