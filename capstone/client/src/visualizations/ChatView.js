/**
 * Chat View
 * 
 * AI Assistant interface for querying genomic data
 */

export class ChatView {
  constructor(options) {
    this.container = options.container;
    this.dataService = options.dataService;
    this.messages = [];
    this.isProcessing = false;
  }

  init() {
    this.bindEvents();
    this.addWelcomeMessage();
  }

  bindEvents() {
    const sendBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');
    
    sendBtn?.addEventListener('click', () => this.handleSend());
    
    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    // Quick action buttons
    document.querySelectorAll('.quick-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.dataset.query;
        if (query) {
          document.getElementById('chatInput').value = query;
          this.handleSend();
        }
      });
    });
  }

  addWelcomeMessage() {
    this.addMessage({
      role: 'assistant',
      content: `Welcome to the Mini-ProteinPaint AI Assistant! 🧬

I can help you explore the genomic data in this platform. Try asking questions like:

• "How many mutations are in the TP53 gene?"
• "What are the most common mutation types?"
• "Show me survival statistics"
• "Which genes have the most mutations?"

What would you like to know?`
    });
  }

  render() {
    this.renderMessages();
  }

  renderMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    container.innerHTML = '';
    
    this.messages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `chat-message ${msg.role}`;
      
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.innerHTML = msg.role === 'assistant' ? '🤖' : '👤';
      
      const content = document.createElement('div');
      content.className = 'message-content';
      content.innerHTML = this.formatMessage(msg.content);
      
      messageDiv.appendChild(avatar);
      messageDiv.appendChild(content);
      container.appendChild(messageDiv);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  formatMessage(content) {
    // Convert markdown-like formatting
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  async handleSend() {
    const input = document.getElementById('chatInput');
    const query = input?.value.trim();
    
    if (!query || this.isProcessing) return;
    
    // Add user message
    this.addMessage({ role: 'user', content: query });
    input.value = '';
    
    // Process query
    this.isProcessing = true;
    this.showTypingIndicator();
    
    try {
      // Simulate processing delay
      await this.delay(500 + Math.random() * 1000);
      
      const response = await this.processQuery(query);
      this.addMessage({ role: 'assistant', content: response });
    } catch (error) {
      this.addMessage({
        role: 'assistant',
        content: "I'm sorry, I encountered an error processing your request. Please try again."
      });
    } finally {
      this.isProcessing = false;
      this.hideTypingIndicator();
    }
  }

  async processQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Pattern matching for different query types
    if (this.matchesPattern(lowerQuery, ['mutation', 'mutations', 'how many'])) {
      return this.handleMutationQuery(query);
    }
    
    if (this.matchesPattern(lowerQuery, ['gene', 'genes', 'most mutated', 'top'])) {
      return this.handleGeneQuery(query);
    }
    
    if (this.matchesPattern(lowerQuery, ['survival', 'outcome', 'prognosis'])) {
      return this.handleSurvivalQuery(query);
    }
    
    if (this.matchesPattern(lowerQuery, ['type', 'types', 'variant', 'variants'])) {
      return this.handleMutationTypeQuery(query);
    }
    
    if (this.matchesPattern(lowerQuery, ['sample', 'samples', 'patient', 'patients'])) {
      return this.handleSampleQuery(query);
    }
    
    if (this.matchesPattern(lowerQuery, ['cancer', 'disease', 'diagnosis'])) {
      return this.handleCancerTypeQuery(query);
    }
    
    if (this.matchesPattern(lowerQuery, ['expression', 'expressed'])) {
      return this.handleExpressionQuery(query);
    }
    
    if (this.matchesPattern(lowerQuery, ['help', 'what can', 'commands'])) {
      return this.handleHelpQuery();
    }
    
    // Use data service query for complex questions
    const result = this.dataService.queryData(query);
    return this.formatQueryResult(result);
  }

  matchesPattern(text, patterns) {
    return patterns.some(pattern => text.includes(pattern));
  }

  handleMutationQuery(query) {
    const stats = this.dataService.getGlobalStats();
    const mutations = this.dataService.getFilteredMutations();
    
    // Check if asking about specific gene
    const geneMatch = query.match(/\b(TP53|BRCA1|BRCA2|EGFR|KRAS|PIK3CA|PTEN|APC|RB1|MYC)\b/i);
    
    if (geneMatch) {
      const gene = geneMatch[1].toUpperCase();
      const geneMutations = this.dataService.getMutationsByGene(gene);
      
      if (geneMutations.length === 0) {
        return `I didn't find any mutations in **${gene}** in the current dataset. The genes with mutations are: ${[...new Set(mutations.map(m => m.gene))].join(', ')}.`;
      }
      
      const types = {};
      geneMutations.forEach(m => {
        types[m.type] = (types[m.type] || 0) + 1;
      });
      
      const typeBreakdown = Object.entries(types)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
      
      return `Found **${geneMutations.length} mutations** in **${gene}**:

• Mutation types: ${typeBreakdown}
• Affected samples: ${[...new Set(geneMutations.map(m => m.sample))].length}
• Positions: ${geneMutations.map(m => m.position).join(', ')}

The most common mutation type is **${Object.entries(types).sort((a, b) => b[1] - a[1])[0][0]}**.`;
    }
    
    return `The dataset contains **${stats.totalMutations} mutations** across **${stats.totalGenes} genes** and **${stats.totalSamples} samples**.

Here's the breakdown by mutation type:
${Object.entries(stats.mutationTypes).map(([type, count]) => `• ${type}: **${count}**`).join('\n')}

Would you like details about a specific gene?`;
  }

  handleGeneQuery(query) {
    const topGenes = this.dataService.getTopMutatedGenes(5);
    
    return `Here are the **top 5 most mutated genes** in the dataset:

${topGenes.map((g, i) => `${i + 1}. **${g.gene}** - ${g.count} mutations`).join('\n')}

Click on the **Mutations** tab to see the lollipop plot for any of these genes, or ask me about a specific gene for more details.`;
  }

  handleSurvivalQuery(query) {
    const survivalData = this.dataService.getSurvivalData();
    const events = survivalData.filter(d => d.event === 1).length;
    const censored = survivalData.filter(d => d.event === 0).length;
    const medianTime = this.calculateMedian(survivalData.map(d => d.time));
    
    return `**Survival Analysis Summary:**

• Total patients: **${survivalData.length}**
• Events (deaths): **${events}** (${((events / survivalData.length) * 100).toFixed(1)}%)
• Censored: **${censored}** (${((censored / survivalData.length) * 100).toFixed(1)}%)
• Median follow-up time: **${medianTime.toFixed(1)} months**

Visit the **Survival** tab to see the Kaplan-Meier curve and explore survival by different groupings (cancer type, mutation status).`;
  }

  handleMutationTypeQuery(query) {
    const typeData = this.dataService.getMutationTypeDistribution();
    const total = typeData.reduce((sum, d) => sum + d.count, 0);
    
    return `**Mutation Type Distribution:**

${typeData.map(d => `• **${d.type}**: ${d.count} (${((d.count / total) * 100).toFixed(1)}%)`).join('\n')}

**Missense** mutations are typically the most common, as they result in a single amino acid change. **Nonsense** and **frameshift** mutations often have more severe effects on protein function.`;
  }

  handleSampleQuery(query) {
    const stats = this.dataService.getGlobalStats();
    const cancerTypes = this.dataService.getCancerTypeDistribution();
    
    return `**Sample Statistics:**

• Total samples: **${stats.totalSamples}**
• Samples with mutations: **${stats.totalSamples}**
• Average mutations per sample: **${(stats.totalMutations / stats.totalSamples).toFixed(1)}**

**Distribution by cancer type:**
${cancerTypes.map(d => `• ${d.cancerType}: **${d.count}** samples`).join('\n')}`;
  }

  handleCancerTypeQuery(query) {
    const cancerTypes = this.dataService.getCancerTypeDistribution();
    
    return `**Cancer Types in Dataset:**

${cancerTypes.map(d => `• **${d.cancerType}**: ${d.count} samples`).join('\n')}

St. Jude focuses on pediatric cancers including leukemias (ALL, AML), solid tumors (Neuroblastoma, Osteosarcoma), and brain tumors. This dataset represents a sample of these cancer types.`;
  }

  handleExpressionQuery(query) {
    const expressionData = this.dataService.getExpressionData();
    
    return `**Gene Expression Data:**

• Number of genes: **${expressionData.genes.length}**
• Number of samples: **${expressionData.samples.length}**

The expression data shows log2-transformed values, where:
- Positive values (red) indicate **up-regulation**
- Negative values (blue) indicate **down-regulation**

Visit the **Expression** tab to explore the heatmap, volcano plot, and UMAP visualization.`;
  }

  handleHelpQuery() {
    return `**Available Commands:**

📊 **Data Queries:**
• "How many mutations are there?"
• "Show me mutations in [gene name]"
• "What are the top mutated genes?"
• "What mutation types are there?"

🏥 **Sample Queries:**
• "How many samples/patients?"
• "What cancer types are in the data?"

📈 **Analysis Queries:**
• "Show survival statistics"
• "Tell me about gene expression"

💡 **Tips:**
• Ask about specific genes like TP53, BRCA1, EGFR
• Use the tabs above to view visualizations
• The data is based on pediatric cancer samples`;
  }

  formatQueryResult(result) {
    if (result.type === 'stats') {
      return `Found ${result.data.totalMutations} mutations across ${result.data.totalGenes} genes.`;
    }
    
    if (result.type === 'mutations') {
      return `Found ${result.data.length} mutations matching your query.`;
    }
    
    return "I found some data, but I'm not sure how to display it. Try asking a more specific question!";
  }

  addMessage(message) {
    this.messages.push(message);
    this.renderMessages();
  }

  showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'chat-message assistant typing';
    indicator.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <span class="typing-dots">
          <span></span><span></span><span></span>
        </span>
      </div>
    `;
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
  }

  hideTypingIndicator() {
    document.getElementById('typingIndicator')?.remove();
  }

  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
