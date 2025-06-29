import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { cacheService, hashMessage } from '../cache/CacheService';

interface QueryContext {
  userQuery: string;
  userId?: string;
  sessionId?: string;
  userPreferences?: {
    categories?: string[];
    maxPrice?: number;
    minSustainabilityScore?: number;
  };
  conversationHistory?: string[];
  currentPage?: string;
}

interface QueryResult {
  response: string;
  confidence: number;
  sources: ('knowledge_base' | 'agent' | 'smart_contract' | 'cache')[];
  processingTime: number;
  queryType: QueryType;
  additionalData?: any;
  suggestions?: string[];
}

type QueryType = 
  | 'product_search'
  | 'product_info'
  | 'platform_info'
  | 'order_intent'
  | 'payment_intent'
  | 'order_status'
  | 'dispute_resolution'
  | 'comparison'
  | 'recommendation'
  | 'general_chat';

export class HybridQueryRouter {
  private kbClient: BedrockAgentRuntimeClient;
  private agentClient: BedrockAgentRuntimeClient;
  private knowledgeBaseId: string;
  private agentId: string;
  private agentAliasId: string;

  constructor() {
    this.kbClient = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.agentClient = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    this.knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID || 'J8UI0TGPTI';
    this.agentId = process.env.BEDROCK_AGENT_ID!;
    this.agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID!;
  }

  async processQuery(context: QueryContext): Promise<QueryResult> {
    const startTime = Date.now();
    const cacheKey = hashMessage(`hybrid-${context.userQuery}-${context.userId}`);

    // Check cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        sources: [...cached.sources, 'cache'],
        processingTime: Date.now() - startTime,
      };
    }

    // Analyze query to determine optimal routing strategy
    const queryAnalysis = this.analyzeQuery(context);
    
    let result: QueryResult;

    switch (queryAnalysis.strategy) {
      case 'knowledge_base_primary':
        result = await this.handleKnowledgeBasePrimary(context, queryAnalysis);
        break;
      case 'agent_primary':
        result = await this.handleAgentPrimary(context, queryAnalysis);
        break;
      case 'hybrid_parallel':
        result = await this.handleHybridParallel(context, queryAnalysis);
        break;
      case 'smart_contract_primary':
        result = await this.handleSmartContractPrimary(context, queryAnalysis);
        break;
      default:
        result = await this.handleFallback(context, queryAnalysis);
    }

    result.processingTime = Date.now() - startTime;

    // Cache non-personalized results
    if (!this.isPersonalizedQuery(queryAnalysis.queryType)) {
      await cacheService.set(cacheKey, result, 300); // 5 minutes
    }

    return result;
  }

  private analyzeQuery(context: QueryContext): {
    queryType: QueryType;
    strategy: 'knowledge_base_primary' | 'agent_primary' | 'hybrid_parallel' | 'smart_contract_primary' | 'fallback';
    confidence: number;
    keywords: string[];
  } {
    const query = context.userQuery.toLowerCase();
    const keywords = query.split(' ').filter(word => word.length > 2);

    // Knowledge Base primary queries
    if (this.matchesPatterns(query, [
      'what.*products', 'how.*escrow', 'explain.*dispute', 'tell me about',
      'what is', 'how does.*work', 'platform.*features', 'categories',
      'sustainability.*score', 'compare.*products'
    ])) {
      return {
        queryType: this.determineQueryType(query),
        strategy: 'knowledge_base_primary',
        confidence: 0.85,
        keywords
      };
    }

    // Agent primary queries (transactional)
    if (this.matchesPatterns(query, [
      'buy.*', 'order.*', 'purchase.*', 'pay.*', 'checkout',
      'add to cart', 'place order', 'track.*order', 'cancel.*order'
    ])) {
      return {
        queryType: this.determineQueryType(query),
        strategy: 'agent_primary',
        confidence: 0.9,
        keywords
      };
    }

    // Hybrid parallel queries (complex searches)
    if (this.matchesPatterns(query, [
      'find.*', 'search.*', 'recommend.*', 'suggest.*', 'show me.*',
      'looking for', 'need.*', 'want.*product'
    ])) {
      return {
        queryType: this.determineQueryType(query),
        strategy: 'hybrid_parallel',
        confidence: 0.8,
        keywords
      };
    }

    // Smart contract primary queries
    if (this.matchesPatterns(query, [
      'price.*', 'stock.*', 'available.*', 'inventory.*', 'seller.*',
      'contract.*', 'blockchain.*', 'transaction.*'
    ])) {
      return {
        queryType: this.determineQueryType(query),
        strategy: 'smart_contract_primary',
        confidence: 0.75,
        keywords
      };
    }

    return {
      queryType: 'general_chat',
      strategy: 'fallback',
      confidence: 0.5,
      keywords
    };
  }

  private async handleKnowledgeBasePrimary(context: QueryContext, analysis: any): Promise<QueryResult> {
    try {
      const command = new RetrieveAndGenerateCommand({
        input: {
          text: context.userQuery,
        },
        retrieveAndGenerateConfiguration: {
          type: 'KNOWLEDGE_BASE',
          knowledgeBaseConfiguration: {
            knowledgeBaseId: this.knowledgeBaseId,
            modelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
            retrievalConfiguration: {
              vectorSearchConfiguration: {
                numberOfResults: 5,
              },
            },
          },
        },
      });

      const response = await this.kbClient.send(command);
      
      return {
        response: response.output?.text || 'No information found in knowledge base.',
        confidence: 0.85,
        sources: ['knowledge_base'],
        processingTime: 0,
        queryType: analysis.queryType,
        additionalData: {
          citations: response.citations,
        },
        suggestions: this.generateSuggestions(analysis.queryType),
      };
    } catch (error) {
      console.log('KB primary failed, falling back to agent:', error.message);
      return this.handleAgentPrimary(context, analysis);
    }
  }

  private async handleAgentPrimary(context: QueryContext, analysis: any): Promise<QueryResult> {
    try {
      const command = new InvokeAgentCommand({
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        sessionId: context.sessionId || `hybrid-${Date.now()}`,
        inputText: context.userQuery,
        enableTrace: true,
      });

      const response = await this.agentClient.send(command);
      
      // Process streaming response
      let responseText = '';
      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            responseText += new TextDecoder().decode(chunk.chunk.bytes);
          }
        }
      }

      return {
        response: responseText || 'Agent processed your request.',
        confidence: 0.9,
        sources: ['agent'],
        processingTime: 0,
        queryType: analysis.queryType,
        suggestions: this.generateSuggestions(analysis.queryType),
      };
    } catch (error) {
      console.log('Agent primary failed:', error.message);
      return this.handleFallback(context, analysis);
    }
  }

  private async handleHybridParallel(context: QueryContext, analysis: any): Promise<QueryResult> {
    // Run KB and Agent queries in parallel, then combine results
    const promises = [
      this.handleKnowledgeBasePrimary(context, analysis).catch(() => null),
      this.handleAgentPrimary(context, analysis).catch(() => null),
    ];

    const results = await Promise.all(promises);
    const kbResult = results[0];
    const agentResult = results[1];

    if (kbResult && agentResult) {
      // Combine both results intelligently
      const combinedResponse = this.combineResponses(kbResult.response, agentResult.response, analysis.queryType);
      
      return {
        response: combinedResponse,
        confidence: Math.max(kbResult.confidence, agentResult.confidence),
        sources: ['knowledge_base', 'agent'],
        processingTime: 0,
        queryType: analysis.queryType,
        additionalData: {
          kbData: kbResult.additionalData,
          agentData: agentResult.additionalData,
        },
        suggestions: this.generateSuggestions(analysis.queryType),
      };
    }

    return kbResult || agentResult || this.handleFallback(context, analysis);
  }

  private async handleSmartContractPrimary(context: QueryContext, analysis: any): Promise<QueryResult> {
    // For now, delegate to agent which has smart contract integration
    // In the future, this could directly query smart contracts
    return this.handleAgentPrimary(context, analysis);
  }

  private async handleFallback(context: QueryContext, analysis: any): Promise<QueryResult> {
    return {
      response: `I understand you're asking about "${context.userQuery}". I can help you with product searches, platform information, orders, and general questions. Could you be more specific about what you'd like to know?`,
      confidence: 0.5,
      sources: [],
      processingTime: 0,
      queryType: 'general_chat',
      suggestions: [
        'What products do you have available?',
        'How does the escrow system work?',
        'Find sustainable electronics',
        'I want to buy a smart watch',
      ],
    };
  }

  private matchesPatterns(query: string, patterns: string[]): boolean {
    return patterns.some(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(query);
    });
  }

  private determineQueryType(query: string): QueryType {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('buy') || queryLower.includes('order') || queryLower.includes('purchase')) {
      return 'order_intent';
    }
    if (queryLower.includes('pay') || queryLower.includes('payment') || queryLower.includes('checkout')) {
      return 'payment_intent';
    }
    if (queryLower.includes('find') || queryLower.includes('search') || queryLower.includes('show')) {
      return 'product_search';
    }
    if (queryLower.includes('compare') || queryLower.includes('vs') || queryLower.includes('difference')) {
      return 'comparison';
    }
    if (queryLower.includes('recommend') || queryLower.includes('suggest')) {
      return 'recommendation';
    }
    if (queryLower.includes('escrow') || queryLower.includes('dispute') || queryLower.includes('platform')) {
      return 'platform_info';
    }
    if (queryLower.includes('status') || queryLower.includes('track')) {
      return 'order_status';
    }
    
    return 'general_chat';
  }

  private combineResponses(kbResponse: string, agentResponse: string, queryType: QueryType): string {
    switch (queryType) {
      case 'product_search':
        return `${kbResponse}\n\n**Additional Options:**\n${agentResponse}`;
      case 'recommendation':
        return `**From our knowledge base:**\n${kbResponse}\n\n**Personalized for you:**\n${agentResponse}`;
      default:
        return kbResponse.length > agentResponse.length ? kbResponse : agentResponse;
    }
  }

  private generateSuggestions(queryType: QueryType): string[] {
    const suggestions = {
      product_search: [
        'Compare these products',
        'Show me similar items',
        'What are the sustainability scores?',
        'Add to cart'
      ],
      platform_info: [
        'How do I place an order?',
        'What payment methods do you accept?',
        'Tell me about dispute resolution',
        'Show me product categories'
      ],
      order_intent: [
        'How does checkout work?',
        'What are the shipping options?',
        'Can I pay with crypto?',
        'What is your return policy?'
      ],
      general_chat: [
        'What products do you have?',
        'How does the platform work?',
        'Find sustainable electronics',
        'I want to make a purchase'
      ]
    };

    return suggestions[queryType] || suggestions.general_chat;
  }

  private isPersonalizedQuery(queryType: QueryType): boolean {
    const personalizedTypes: QueryType[] = ['order_intent', 'payment_intent', 'order_status', 'dispute_resolution'];
    return personalizedTypes.includes(queryType);
  }
}
