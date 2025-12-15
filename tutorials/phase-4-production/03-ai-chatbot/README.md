[← Back to Tutorials Index](../../README.md)

---

# Tutorial 4.3: AI Chatbot for Genomic Data Queries

## Overview

Build an AI-powered chatbot that combines Large Language Models (LLMs) with Retrieval-Augmented Generation (RAG) to answer questions about genomic data and cancer biology.

## Learning Objectives

By the end of this tutorial, you will:

1. ✅ Integrate LLM APIs (OpenAI/Anthropic)
2. ✅ Implement RAG for genomic knowledge retrieval
3. ✅ Create natural language data query interfaces
4. ✅ Build conversation context management
5. ✅ Handle streaming responses and token management

## Prerequisites

- Completed Tutorial 4.2 (CI/CD)
- OpenAI or Anthropic API key (optional - mock mode available)
- Node.js 18+ installed

## Project Structure

```
03-ai-chatbot/
├── src/
│   ├── components/       # UI components (if frontend needed)
│   ├── data/
│   │   ├── knowledgeBase.js   # RAG knowledge chunks
│   │   └── sampleData.js      # Sample genomic data
│   ├── services/
│   │   ├── llmService.js      # LLM API integration
│   │   └── chatService.js     # Chat orchestration
│   ├── utils/
│   ├── server.js              # Express API server
│   └── demo.js                # Interactive CLI demo
├── tests/
│   ├── knowledgeBase.test.js
│   ├── sampleData.test.js
│   └── chatService.test.js
├── .env.example               # Environment template
├── package.json
└── README.md
```

## Getting Started

### 1. Install Dependencies

```bash
cd tutorials/phase-4-production/03-ai-chatbot
npm install
```

### 2. Configure Environment (Optional)

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API key
OPENAI_API_KEY=your-key-here
# or
ANTHROPIC_API_KEY=your-key-here
```

### 3. Run Interactive Demo

```bash
npm run demo
```

The demo works without API keys using a mock LLM that provides contextual responses.

### 4. Run API Server

```bash
npm run dev
```

Server runs at `http://localhost:3001`

### 5. Run Tests

```bash
npm test
```

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Chatbot System                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Query ──▶ Chat Service                                │
│                     │                                        │
│                     ├──▶ Parse Data Query                   │
│                     │         │                              │
│                     │         ▼                              │
│                     │    Query Database ──▶ Data Results    │
│                     │                                        │
│                     ├──▶ RAG Retrieval                      │
│                     │         │                              │
│                     │         ▼                              │
│                     │    Knowledge Base ──▶ Context         │
│                     │                                        │
│                     ├──▶ LLM Service                        │
│                     │         │                              │
│                     │         ▼                              │
│                     │    OpenAI/Anthropic                   │
│                     │         │                              │
│                     │         ▼                              │
│                     └──▶ Response ──▶ User                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### RAG Pipeline

```
Query: "Tell me about TP53 mutations in breast cancer"
                    │
                    ▼
┌─────────────────────────────────────┐
│        1. Knowledge Retrieval        │
│  ─────────────────────────────────  │
│  Search knowledge base for:          │
│  • TP53 gene information             │
│  • Mutation types                    │
│  • Breast cancer context             │
│                                      │
│  Score and rank by relevance         │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│        2. Data Query (optional)      │
│  ─────────────────────────────────  │
│  Parse natural language query:       │
│  • Gene: TP53                        │
│  • Cancer: breast                    │
│  • Type: mutations                   │
│                                      │
│  Execute database query              │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│        3. Context Assembly           │
│  ─────────────────────────────────  │
│  Combine:                            │
│  • Knowledge base chunks             │
│  • Data query results                │
│  • Conversation history              │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│        4. LLM Generation             │
│  ─────────────────────────────────  │
│  System prompt + Context + Query     │
│           ↓                          │
│       LLM API                        │
│           ↓                          │
│   Informed Response                  │
└─────────────────────────────────────┘
```

## API Reference

### POST /api/chat

Send a chat message and receive a response.

**Request:**

```json
{
  "message": "What can you tell me about TP53?",
  "conversationId": "optional-uuid"
}
```

**Response:**

```json
{
  "success": true,
  "conversationId": "uuid",
  "message": {
    "id": "message-uuid",
    "role": "assistant",
    "content": "TP53 is a tumor suppressor gene...",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "dataResult": null,
  "usage": {
    "promptTokens": 250,
    "completionTokens": 150,
    "totalTokens": 400
  }
}
```

### GET /api/knowledge/search

Search the genomic knowledge base.

**Request:**

```
GET /api/knowledge/search?q=KRAS%20mutations
```

**Response:**

```json
{
  "query": "KRAS mutations",
  "count": 3,
  "results": [
    {
      "id": "kras-overview",
      "title": "KRAS Oncogene",
      "category": "gene",
      "score": 15,
      "content": "..."
    }
  ]
}
```

### GET /api/conversations

List all active conversations.

### GET /api/conversations/:id

Get conversation history.

### DELETE /api/conversations/:id

Delete a conversation.

## Knowledge Base

The RAG system uses pre-defined knowledge chunks covering:

| Category          | Topics                                                   |
| ----------------- | -------------------------------------------------------- |
| **Genes**         | TP53, BRCA1, KRAS, EGFR, BRAF, PIK3CA                    |
| **Concepts**      | Mutation types, ACMG classification, Hallmarks of cancer |
| **Visualization** | Lollipop plots, OncoPrint, survival curves               |
| **Formats**       | VCF, MAF file formats                                    |
| **Databases**     | COSMIC, ClinVar                                          |

### Adding Knowledge

Edit `src/data/knowledgeBase.js`:

```javascript
export const genomicKnowledge = [
  {
    id: 'unique-id',
    category: 'gene|concept|visualization|format|database',
    title: 'Display Title',
    content: 'Detailed content for RAG context...',
    keywords: ['keyword1', 'keyword2'],
  },
  // ... more chunks
];
```

## LLM Integration

### Supported Providers

| Provider  | Model               | Use Case            |
| --------- | ------------------- | ------------------- |
| OpenAI    | gpt-4-turbo-preview | Best quality        |
| OpenAI    | gpt-3.5-turbo       | Fast, economical    |
| Anthropic | claude-3-sonnet     | Alternative         |
| Mock      | -                   | Development/testing |

### System Prompt

The chatbot uses a genomics-specific system prompt:

```
You are a helpful genomics research assistant specializing in:
- Cancer genomics and mutations
- Data interpretation and visualization
- Gene function and clinical significance

Guidelines:
- Provide scientifically accurate information
- Cite relevant genes, databases when applicable
- Suggest appropriate visualizations
- Acknowledge uncertainty when present
```

## Example Queries

### Gene Information

```
You: What can you tell me about TP53?
Bot: TP53 is a tumor suppressor gene located on chromosome 17p13.1...
```

### Data Queries

```
You: Show me KRAS mutations in lung cancer
Bot: Here are the KRAS mutations found in lung cancer samples:
     [Data results displayed]
```

### Visualization Suggestions

```
You: How should I visualize mutation data?
Bot: For mutation data, I recommend:
     1. Lollipop Plot - shows mutations along protein
     2. OncoPrint - matrix view across samples...
```

## Exercises

### Exercise 1: Add New Knowledge

Add a new gene to the knowledge base:

1. Create entry for PTEN gene in `knowledgeBase.js`
2. Include relevant keywords
3. Test with search queries

### Exercise 2: Custom Data Query

Implement a new query type:

1. Add query parsing for protein domains
2. Create corresponding data structure
3. Test with natural language queries

### Exercise 3: Streaming Responses

Implement streaming for real-time responses:

1. Use OpenAI streaming API
2. Send partial responses via Server-Sent Events
3. Update client to handle streaming

### Exercise 4: Conversation Memory

Improve conversation context:

1. Implement conversation summarization
2. Add important fact extraction
3. Persist across sessions

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Specific test file
npm test -- tests/knowledgeBase.test.js
```

### Test Coverage

| Module         | Tests | Coverage |
| -------------- | ----- | -------- |
| Knowledge Base | 12    | ✅       |
| Sample Data    | 18    | ✅       |
| Chat Service   | 15    | ✅       |

## Troubleshooting

### Common Issues

| Issue            | Solution                            |
| ---------------- | ----------------------------------- |
| No API key       | Use mock mode or set OPENAI_API_KEY |
| Rate limited     | Add retry logic or reduce requests  |
| Context too long | Reduce maxContextChunks             |
| Slow responses   | Use gpt-3.5-turbo or mock mode      |

### Debug Mode

```bash
# Enable verbose logging
DEBUG=chat:* npm run dev
```

## Next Steps

After completing this tutorial:

1. **Tutorial 4.4**: Rust for High-Performance Parsing
2. **Capstone Project**: Integrate chatbot into full application
3. **Advanced RAG**: Implement vector embeddings with pgvector

## Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [LangChain JS](https://js.langchain.com/)

---

## Summary

In this tutorial, you learned to:

✅ Integrate multiple LLM providers (OpenAI, Anthropic)
✅ Implement RAG with a genomic knowledge base
✅ Parse natural language into structured queries
✅ Build conversation context management
✅ Create REST API for chat interactions
✅ Test LLM-based applications

Your genomic visualization platform now has AI-powered query capabilities! 🤖🧬

---

[← Back to Tutorials Index](../../README.md)
