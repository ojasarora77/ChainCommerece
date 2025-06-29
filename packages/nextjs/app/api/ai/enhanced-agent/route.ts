import { NextRequest, NextResponse } from 'next/server';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { BedrockAgentRuntimeClient as KBClient, RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { ShoppingAgentFunctions } from '../../../../services/bedrock/agents/shoppingAgentFunctions';
import { trackKBQuery } from '../../../../services/analytics/KnowledgeBaseAnalytics';

// Initialize clients
const agentClient = new BedrockAgentRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const kbClient = new KBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const AGENT_ID = process.env.BEDROCK_AGENT_ID!;
const AGENT_ALIAS_ID = process.env.BEDROCK_AGENT_ALIAS_ID!;
const KNOWLEDGE_BASE_ID = process.env.BEDROCK_KNOWLEDGE_BASE_ID || 'J8UI0TGPTI';

// Helper function to check if message needs function calling
function checkIfNeedsFunctionCall(message: string): boolean {
  const functionKeywords = [
    'buy', 'order', 'purchase', 'find', 'search', 'show me', 'get', 'details',
    'AI-powered smart watch', 'smart watch', 'products', 'available'
  ];

  const messageLower = message.toLowerCase();
  return functionKeywords.some(keyword => messageLower.includes(keyword));
}

// Helper function to handle direct function calls using intelligent search
async function handleDirectFunctionCall(message: string, userId?: string): Promise<any> {
  try {
    const messageLower = message.toLowerCase();

    console.log(`🔍 Processing function call for: "${message}"`);

    // Use the new smart search system for better natural language understanding
    const searchResponse = await fetch('http://localhost:3000/api/ai/smart-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: message,
        userId: userId,
        maxResults: 5,
        includeOutOfStock: false
      })
    });

    const searchResult = await searchResponse.json();
    console.log(`🔍 Smart search result:`, searchResult);

    if (!searchResult.success) {
      return {
        action: 'search_error',
        error: searchResult.error || 'Search failed'
      };
    }

    const products = searchResult.results.products;

    // If user wants to order and we found products
    if ((messageLower.includes('buy') || messageLower.includes('order') || messageLower.includes('purchase'))
        && products.length > 0) {

      const product = products[0]; // Take the highest ranked product

      // Create order using the agent functions
      const orderResponse = await fetch('http://localhost:3000/api/ai/agent-functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'createOrder',
          parameters: {
            productId: product.id,
            quantity: 1,
            userAddress: userId || '0x742d35Cc6634C0532925a3b8D4C9db96DfbB8E24'
          }
        })
      });

      const orderResult = await orderResponse.json();
      return {
        action: 'create_order',
        product: product,
        order: orderResult.success ? orderResult.data : null,
        orderError: orderResult.success ? null : orderResult.error,
        searchMetadata: {
          confidence: searchResult.query.confidence,
          intent: searchResult.query.intent,
          searchTime: searchResult.results.searchTime
        }
      };
    }

    // Return smart search results
    return {
      action: 'smart_search',
      results: {
        products: products,
        totalFound: searchResult.results.totalFound,
        searchTime: searchResult.results.searchTime,
        explanation: searchResult.results.explanation
      },
      query: {
        original: searchResult.query.original,
        processed: searchResult.query.processed,
        confidence: searchResult.query.confidence,
        intent: searchResult.query.intent
      },
      suggestions: searchResult.suggestions
    };

  } catch (error) {
    console.error('Intelligent function call error:', error);
    return {
      action: 'function_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, useKnowledgeBase = true, userId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!AGENT_ID || !AGENT_ALIAS_ID) {
      return NextResponse.json(
        { error: 'Bedrock Agent not configured' },
        { status: 500 }
      );
    }

    const startTime = Date.now();
    const currentSessionId = sessionId || `enhanced-session-${Date.now()}`;

    let enhancedMessage = message;
    let knowledgeBaseContext = null;

    // If Knowledge Base integration is enabled, get relevant context first
    if (useKnowledgeBase && KNOWLEDGE_BASE_ID) {
      try {
        console.log('🔍 Retrieving Knowledge Base context...');
        
        const kbCommand = new RetrieveCommand({
          knowledgeBaseId: KNOWLEDGE_BASE_ID,
          retrievalQuery: {
            text: message,
          },
          retrievalConfiguration: {
            vectorSearchConfiguration: {
              numberOfResults: 3,
            },
          },
        });

        const kbResponse = await kbClient.send(kbCommand);
        
        if (kbResponse.retrievalResults && kbResponse.retrievalResults.length > 0) {
          knowledgeBaseContext = kbResponse.retrievalResults.map(result => ({
            content: result.content?.text,
            score: result.score,
            source: result.location?.s3Location?.uri || 'Knowledge Base'
          }));

          // Enhance the message with Knowledge Base context
          const contextText = knowledgeBaseContext
            .map(ctx => ctx.content)
            .join('\n\n');

          enhancedMessage = `Based on the following knowledge base information, please answer the user's question:

KNOWLEDGE BASE CONTEXT:
${contextText}

USER QUESTION: ${message}

Please provide a comprehensive answer using the knowledge base information above, and if you need to perform any actions (like searching products or placing orders), use your available functions.`;
        }
      } catch (kbError) {
        console.log('⚠️ Knowledge Base retrieval failed, proceeding with agent only:', kbError.message);
        // Continue without KB context if it fails
      }
    }

    // Check if this is a product-related query that needs function calling
    const needsFunctionCall = checkIfNeedsFunctionCall(message);
    let functionCallResults = null;

    if (needsFunctionCall) {
      console.log('🔧 Handling function call directly...');
      functionCallResults = await handleDirectFunctionCall(message, userId);

      if (functionCallResults) {
        // If we got function results, enhance the message with the data
        enhancedMessage = `${enhancedMessage}\n\nFunction Call Results:\n${JSON.stringify(functionCallResults, null, 2)}\n\nPlease provide a helpful response based on this data.`;
      }
    }

    // Invoke the Bedrock Agent
    console.log('🤖 Invoking Bedrock Agent...');

    const agentCommand = new InvokeAgentCommand({
      agentId: AGENT_ID,
      agentAliasId: AGENT_ALIAS_ID,
      sessionId: currentSessionId,
      inputText: enhancedMessage,
      enableTrace: true,
    });

    const agentResponse = await agentClient.send(agentCommand);

    // Process the streaming response
    let responseText = '';
    let traces = [];

    if (agentResponse.completion) {
      for await (const chunk of agentResponse.completion) {
        if (chunk.chunk?.bytes) {
          const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
          responseText += chunkText;
        }

        if (chunk.trace) {
          traces.push(chunk.trace);
        }
      }
    }

    const processingTime = Date.now() - startTime;

    // Track analytics
    trackKBQuery(
      message,
      'enhanced_agent_query',
      processingTime,
      knowledgeBaseContext ? 0.9 : 0.7, // Higher confidence with KB context
      knowledgeBaseContext ? ['knowledge_base', 'agent'] : ['agent'],
      true,
      {
        userId,
        sessionId: currentSessionId,
        knowledgeBaseUsed: !!knowledgeBaseContext,
        cacheHit: false,
      }
    );

    // Universal Fallback: If agent gives unhelpful response, try intelligent search
    let finalResponse = responseText || 'Agent response received but no text content';

    // Detect if response is generic/unhelpful
    const isGenericResponse = !responseText ||
      responseText === 'Agent response received but no text content' ||
      responseText.includes('Smart Insights') ||
      responseText.includes('Ready to help with product search') ||
      responseText.includes('not currently available') ||
      responseText.includes('could not find') ||
      responseText.includes('not found') ||
      responseText.includes('couldn\'t search our specific marketplace') ||
      responseText.includes('we do not currently have') ||
      responseText.includes('Unfortunately, we do not') ||
      responseText.includes('I can provide some general information') ||
      responseText.includes('having trouble with the proper function call') ||
      responseText.includes('please provide me with the exact name') ||
      responseText.includes('Could you please provide') ||
      responseText.includes('I apologize, I\'m still having trouble') ||
      responseText.includes('having persistent issues with the proper XML format') ||
      responseText.includes('without more specific details like the brand name') ||
      responseText.includes('unable to look up pricing for the smart fitness tracker') ||
      responseText.includes('provide me with the brand');

    // Detect if user is looking for products (buy, purchase, price, find, etc.)
    const isProductQuery = message.toLowerCase().match(/\b(buy|purchase|price|cost|find|search|order|get|want|need|looking for|show me)\b/) &&
      !message.toLowerCase().includes('help') &&
      !message.toLowerCase().includes('how to');

    if (isGenericResponse && isProductQuery) {
      try {
        console.log('🔄 Agent gave generic response, trying intelligent search fallback...');

        // Use direct ShoppingAgentFunctions for reliable results
        try {
          console.log(`🔍 Fallback: Using direct search for: "${message}"`);

          const agentFunctions = new ShoppingAgentFunctions();

          // Try multiple search variations
          const searchQueries = [
            message.replace(/\b(what is the price of|what is|price of|i want to buy|buy|purchase)\b/gi, '').trim(),
            message.toLowerCase().includes('fitness') ? 'smart fitness tracker' :
            message.toLowerCase().includes('smart watch') ? 'ai powered smart watch' :
            message.toLowerCase().includes('nft') ? 'nft art collection guide' :
            message.toLowerCase().includes('laptop stand') ? 'bamboo laptop stand' :
            message.toLowerCase().includes('phone cover') ? 'phone cover' :
            message.replace(/\b(what|is|the|price|of|i|want|to|buy|purchase|get|find)\b/gi, '').trim()
          ];

          let searchResult = null;
          for (const query of searchQueries) {
            if (!query || query.length < 2) continue;

            try {
              const result = await agentFunctions.searchProducts({ query });
              if (result.success && result.data.products.length > 0) {
                searchResult = result.data;
                console.log(`✅ Found product with query: "${query}"`);
                break;
              }
            } catch (error) {
              console.error(`❌ Search failed for query "${query}":`, error);
            }
          }

          if (searchResult && searchResult.products.length > 0) {
            const product = searchResult.products[0];
            finalResponse = `I found the perfect product for you! 🎯

**${product.name}** - ${product.price} ETH ($${product.priceUSD})
- Category: ${product.category}
- Rating: ${product.averageRating}/5 stars
- Description: ${product.description}
- Sustainability Score: ${product.sustainabilityScore}%

Would you like me to help you place an order for this ${product.name.toLowerCase()}?`;
            console.log('✅ Universal fallback search successful, showing real product');
          } else {
            // Show category overview if no specific product found
            finalResponse = `I couldn't find that specific product, but I can help you explore our marketplace! 🛒

We have 16 verified sustainable products across these categories:
• **Electronics** - Smart watches, fitness trackers, earbuds, LED strips
• **Digital** - NFT guides, development resources, VR trainers
• **Clothing** - Organic hemp t-shirts, bamboo joggers
• **Sports** - Fitness equipment, resistance bands
• **Books** - Crypto handbooks, development guides
• **Home & Garden** - Smart planters, eco-friendly products
• **Beauty** - Sustainable beauty products
• **Automotive** - Eco-friendly car accessories

What type of product are you looking for? I can show you specific options in any category!`;
          }
        } catch (fallbackError) {
          console.error('❌ Universal fallback search failed:', fallbackError);

          // Final fallback - show category overview
          finalResponse = `I'm having trouble searching right now, but I can help you explore our marketplace! 🛒

We have 16 verified sustainable products across these categories:
• **Electronics** - Smart watches, fitness trackers, earbuds, LED strips
• **Digital** - NFT guides, development resources, VR trainers
• **Clothing** - Organic hemp t-shirts, bamboo joggers
• **Sports** - Fitness equipment, resistance bands
• **Books** - Crypto handbooks, development guides
• **Home & Garden** - Smart planters, eco-friendly products
• **Beauty** - Sustainable beauty products
• **Automotive** - Eco-friendly car accessories

What type of product are you looking for? I can show you specific options in any category!`;
        }
      } catch (fallbackError) {
        console.error('❌ Universal fallback search failed:', fallbackError);

        // Final fallback - show category overview
        finalResponse = `I'm having trouble searching right now, but I can help you explore our marketplace! 🛒

We have 16 verified sustainable products across these categories:
• **Electronics** - Smart watches, fitness trackers, earbuds, LED strips
• **Digital** - NFT guides, development resources, VR trainers
• **Clothing** - Organic hemp t-shirts, bamboo joggers
• **Sports** - Fitness equipment, resistance bands
• **Books** - Crypto handbooks, development guides
• **Home & Garden** - Smart planters, eco-friendly products
• **Beauty** - Sustainable beauty products
• **Automotive** - Eco-friendly car accessories

What type of product are you looking for? I can show you specific options in any category!`;
      }
    }

    return NextResponse.json({
      success: true,
      response: finalResponse,
      sessionId: currentSessionId,
      knowledgeBaseUsed: !!knowledgeBaseContext,
      knowledgeBaseContext: knowledgeBaseContext?.slice(0, 2), // Return top 2 for reference
      traces: traces.length > 0 ? traces.slice(-3) : [], // Last 3 traces
      processingTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Enhanced Agent API error:', error);

    // Track error analytics
    const processingTime = Date.now() - startTime;
    trackKBQuery(
      message || 'Unknown query',
      'enhanced_agent_error',
      processingTime,
      0,
      [],
      false,
      {
        userId,
        sessionId,
        knowledgeBaseUsed: false,
        cacheHit: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    );

    return NextResponse.json(
      {
        error: 'Enhanced agent query failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Enhanced Bedrock Agent with Knowledge Base integration',
    agentId: AGENT_ID ? `${AGENT_ID.substring(0, 4)}...` : 'Not configured',
    knowledgeBaseId: KNOWLEDGE_BASE_ID ? `${KNOWLEDGE_BASE_ID.substring(0, 4)}...` : 'Not configured',
    endpoints: {
      POST: 'Send messages to the enhanced agent with Knowledge Base context',
    },
    parameters: {
      message: 'User message/query',
      sessionId: 'Optional session identifier for conversation continuity',
      useKnowledgeBase: 'Boolean - whether to use Knowledge Base context (default: true)',
      userId: 'Optional user identifier for personalization',
    },
    features: [
      'Knowledge Base context retrieval',
      'Enhanced agent responses with platform knowledge',
      'Function calling for shopping operations',
      'Session management',
      'Trace logging for debugging'
    ],
    examples: [
      {
        description: 'Ask about products with KB context',
        request: {
          message: 'What sustainable electronics do you have?',
          useKnowledgeBase: true,
        },
      },
      {
        description: 'Place an order with agent functions',
        request: {
          message: 'I want to buy the AI-Powered Smart Watch',
          sessionId: 'user-123-session',
        },
      },
    ],
  });
}
