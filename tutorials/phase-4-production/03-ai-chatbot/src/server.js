/**
 * Express Server for AI Chatbot
 * REST API for chat interactions
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createChatService } from './services/chatService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create chat service
const chatService = createChatService({
  useMock: !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: chatService.getStatus()
  });
});

/**
 * Chat endpoint
 * POST /api/chat
 * Body: { message: string, conversationId?: string }
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        details: 'Message is required and must be a string'
      });
    }
    
    const result = await chatService.chat(message, conversationId);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * Get conversation history
 * GET /api/conversations/:id
 */
app.get('/api/conversations/:id', (req, res) => {
  const history = chatService.getHistory(req.params.id);
  
  if (!history) {
    return res.status(404).json({
      error: 'Not found',
      details: 'Conversation not found'
    });
  }
  
  res.json(history);
});

/**
 * List all conversations
 * GET /api/conversations
 */
app.get('/api/conversations', (req, res) => {
  res.json({
    conversations: chatService.listConversations()
  });
});

/**
 * Clear conversation
 * POST /api/conversations/:id/clear
 */
app.post('/api/conversations/:id/clear', (req, res) => {
  const success = chatService.clearConversation(req.params.id);
  
  res.json({
    success,
    message: success ? 'Conversation cleared' : 'Conversation not found'
  });
});

/**
 * Delete conversation
 * DELETE /api/conversations/:id
 */
app.delete('/api/conversations/:id', (req, res) => {
  const success = chatService.deleteConversation(req.params.id);
  
  res.json({
    success,
    message: success ? 'Conversation deleted' : 'Conversation not found'
  });
});

/**
 * Search knowledge base
 * GET /api/knowledge/search?q=query
 */
app.get('/api/knowledge/search', (req, res) => {
  const query = req.query.q;
  
  if (!query) {
    return res.status(400).json({
      error: 'Invalid request',
      details: 'Query parameter "q" is required'
    });
  }
  
  const results = chatService.searchKnowledge(query);
  
  res.json({
    query,
    count: results.length,
    results: results.slice(0, 10) // Limit results
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`
🤖 AI Chatbot Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Server running at: http://localhost:${PORT}
🔧 API Endpoints:
   POST /api/chat          - Send message
   GET  /api/conversations - List conversations
   GET  /api/knowledge/search?q=<query>

${chatService.getStatus().provider.available 
  ? '✅ LLM Service: Connected' 
  : '⚠️  LLM Service: Using mock (no API key)'}

Press Ctrl+C to stop
`);
});

export default app;
