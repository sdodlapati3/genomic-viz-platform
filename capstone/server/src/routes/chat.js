/**
 * Chat API Router
 * 
 * AI-powered data querying endpoint
 */

import express from 'express';
import { ChatService } from '../services/ChatService.js';

export const chatRouter = express.Router();
const chatService = new ChatService();

/**
 * POST /api/chat
 * Send a message and get AI response
 */
chatRouter.post('/', async (req, res, next) => {
  try {
    const { message, context = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await chatService.processMessage(message, context);
    
    res.json({
      response: response.text,
      data: response.data,
      suggestions: response.suggestions
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/chat/query
 * Execute a structured data query
 */
chatRouter.post('/query', async (req, res, next) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await chatService.executeQuery(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chat/suggestions
 * Get query suggestions based on current data
 */
chatRouter.get('/suggestions', async (req, res, next) => {
  try {
    const suggestions = await chatService.getSuggestions();
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
});
