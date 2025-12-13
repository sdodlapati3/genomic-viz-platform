/**
 * Demo Script for AI Chatbot
 * Interactive command-line chat interface
 */

import readline from 'readline';
import { createChatService } from './services/chatService.js';

// Create chat service with mock LLM
const chatService = createChatService({ useMock: true });

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Welcome message
console.log(`
🧬 Genomic AI Chatbot Demo
━━━━━━━━━━━━━━━━━━━━━━━━━━━

This demo uses a mock LLM to demonstrate the chatbot functionality.
To use real LLM APIs, set OPENAI_API_KEY or ANTHROPIC_API_KEY.

Commands:
  /clear   - Clear conversation history
  /status  - Show service status
  /search <query> - Search knowledge base
  /exit    - Exit the demo

Example questions:
  • What can you tell me about TP53?
  • Show me KRAS mutations in pancreatic cancer
  • What types of mutations exist?
  • How do I visualize mutation data?

━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

let conversationId = null;

/**
 * Process user input
 */
async function processInput(input) {
  const trimmed = input.trim();
  
  if (!trimmed) return;
  
  // Handle commands
  if (trimmed.startsWith('/')) {
    const [command, ...args] = trimmed.slice(1).split(' ');
    
    switch (command.toLowerCase()) {
      case 'exit':
      case 'quit':
        console.log('\n👋 Goodbye!\n');
        rl.close();
        process.exit(0);
        break;
        
      case 'clear':
        if (conversationId) {
          chatService.clearConversation(conversationId);
        }
        conversationId = null;
        console.log('\n🗑️  Conversation cleared\n');
        break;
        
      case 'status':
        const status = chatService.getStatus();
        console.log('\n📊 Service Status:');
        console.log(JSON.stringify(status, null, 2));
        console.log('');
        break;
        
      case 'search':
        const query = args.join(' ');
        if (!query) {
          console.log('\n⚠️  Usage: /search <query>\n');
        } else {
          const results = chatService.searchKnowledge(query);
          console.log(`\n🔍 Search results for "${query}":\n`);
          if (results.length === 0) {
            console.log('No results found');
          } else {
            results.slice(0, 5).forEach((r, i) => {
              console.log(`${i + 1}. ${r.title} (score: ${r.score})`);
              console.log(`   Category: ${r.category}`);
              console.log('');
            });
          }
        }
        break;
        
      case 'help':
        console.log(`
Available commands:
  /clear   - Clear conversation history
  /status  - Show service status
  /search <query> - Search knowledge base
  /help    - Show this help
  /exit    - Exit the demo
`);
        break;
        
      default:
        console.log(`\n⚠️  Unknown command: /${command}. Type /help for available commands.\n`);
    }
    return;
  }
  
  // Send message to chat service
  console.log('\n🤔 Thinking...\n');
  
  try {
    const result = await chatService.chat(trimmed, conversationId);
    conversationId = result.conversationId;
    
    console.log('🤖 Assistant:');
    console.log('─'.repeat(50));
    console.log(result.message.content);
    console.log('─'.repeat(50));
    
    if (result.dataResult) {
      console.log('\n📊 Data Query Results:');
      console.log(JSON.stringify(result.dataResult, null, 2));
    }
    
    if (result.usage) {
      console.log(`\n📈 Tokens: ${result.usage.totalTokens} (prompt: ${result.usage.promptTokens}, completion: ${result.usage.completionTokens})`);
    }
    
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
  }
}

/**
 * Main prompt loop
 */
function prompt() {
  rl.question('👤 You: ', async (input) => {
    await processInput(input);
    prompt();
  });
}

// Handle Ctrl+C
rl.on('close', () => {
  console.log('\n👋 Goodbye!\n');
  process.exit(0);
});

// Start the prompt loop
prompt();
