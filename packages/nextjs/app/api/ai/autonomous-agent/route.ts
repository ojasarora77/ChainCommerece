import { NextRequest, NextResponse } from 'next/server';
import { AutonomousShoppingAgent } from '../../../../services/bedrock/agents/autonomousShoppingAgent';
import { ShoppingAgentFunctions } from '../../../../services/bedrock/agents/shoppingAgentFunctions';
import { cacheService, hashMessage } from '~~/services/cache/CacheService';
import { realPerformanceService } from '~~/services/analytics/RealPerformanceService';
import { enhancedShoppingAgent, SearchContext } from '~~/services/ai/EnhancedShoppingAgent';
import { productKnowledgeBase } from '~~/services/ai/ProductKnowledgeBase';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { message, sessionId, userId } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`🤖 Autonomous Agent API: Processing message from user ${userId}`);

    // Create more specific cache key that includes query type and context
    const queryType = determineQueryType(message);
    const contextualCacheKey = `${hashMessage(message)}_${queryType}_${userId}`;

    // Only cache non-personalized, non-transactional queries
    const shouldCache = !isPersonalizedQuery(message, queryType);

    if (shouldCache) {
      const cachedResponse = cacheService.getCachedAgentResponse(contextualCacheKey);

      if (cachedResponse) {
        console.log('📦 Returning cached response for query type:', queryType);

        // Track cache hit
        realPerformanceService.trackCacheHit(contextualCacheKey, Date.now() - startTime);

        return NextResponse.json({
          success: true,
          data: {
            message: cachedResponse,
            sessionId: sessionId || `session-${Date.now()}`,
            cached: true,
            responseTime: Date.now() - startTime
          }
        });
      }
    }

    // Track cache miss
    realPerformanceService.trackCacheMiss(contextualCacheKey, Date.now() - startTime);

    // Initialize the autonomous shopping agent
    const agent = new AutonomousShoppingAgent();
    const agentFunctions = new ShoppingAgentFunctions();

    // Get response from the agent
    const agentResponse = await agent.chat(message, userId);

    // Process any function calls that the agent made
    if (agentResponse.functionCalls && agentResponse.functionCalls.length > 0) {
      console.log(`🔧 Processing ${agentResponse.functionCalls.length} function calls`);
      
      for (const functionCall of agentResponse.functionCalls) {
        try {
          let result;

          switch (functionCall.function) {
            case 'searchProducts':
              result = await agentFunctions.searchProducts(functionCall.parameters as { query: string; category?: string; maxPrice?: number; sustainabilityMin?: number });
              break;

            case 'getProductDetails':
              result = await agentFunctions.getProductDetails(functionCall.parameters as { productId: number });
              break;

            case 'createOrder':
              result = await agentFunctions.createOrder(functionCall.parameters as { productId: number; quantity: number; userAddress: string });
              break;

            case 'processPayment':
              result = await agentFunctions.processPayment(functionCall.parameters as { orderId: string; paymentMethod: string; amount: string });
              break;

            case 'checkOrderStatus':
              result = await agentFunctions.checkOrderStatus(functionCall.parameters as { orderId: string });
              break;
              
            default:
              console.warn(`⚠️ Unknown function: ${functionCall.function}`);
              result = {
                success: false,
                error: `Unknown function: ${functionCall.function}`
              };
          }
          
          functionCall.result = result;
          console.log(`✅ Function ${functionCall.function} executed:`, result);
          
        } catch (error) {
          console.error(`❌ Error executing function ${functionCall.function}:`, error);
          functionCall.result = {
            success: false,
            error: `Failed to execute ${functionCall.function}`
          };
        }
      }
    }

    // Enhance the response with AI intelligence and function results
    let enhancedResponse = agentResponse.response;

    // If the query seems like a product search, enhance with our AI agent
    const isProductQuery = message.toLowerCase().includes('find') ||
                          message.toLowerCase().includes('search') ||
                          message.toLowerCase().includes('show') ||
                          message.toLowerCase().includes('recommend') ||
                          message.toLowerCase().includes('product');

    if (isProductQuery && (!agentResponse.functionCalls || agentResponse.functionCalls.length === 0)) {
      try {
        // Use enhanced shopping agent for better responses
        const searchContext: SearchContext = {
          query: message,
          category: undefined,
          maxPrice: undefined,
          sustainabilityMin: undefined
        };

        const aiResponse = await enhancedShoppingAgent.processQuery(searchContext);

        if (aiResponse.products.length > 0) {
          enhancedResponse = `${aiResponse.message}

🛍️ **Found ${aiResponse.products.length} product${aiResponse.products.length > 1 ? 's' : ''}:**

${aiResponse.products.map((product, index) =>
  `${index + 1}. **${product.name}** - $${product.priceUSD} (${product.price} AVAX)
   ${product.description}
   ⭐ ${product.averageRating}/5.0 | 🌱 ${product.sustainabilityScore}/100 sustainability score
   ${product.features.slice(0, 3).join(', ')}`
).join('\n\n')}

💡 **AI Insights:**
${aiResponse.suggestions.join('\n')}

🤔 **Follow-up questions:**
${aiResponse.followUpQuestions.join('\n')}

**Confidence:** ${Math.round(aiResponse.confidence * 100)}% | **Reasoning:** ${aiResponse.reasoning}`;
        }
      } catch (error) {
        console.error('Enhanced AI response failed:', error);
      }
    }

    if (agentResponse.functionCalls) {
      enhancedResponse = await enhanceResponseWithFunctionResults(
        enhancedResponse,
        agentResponse.functionCalls
      );
    }

    // Add general marketplace context
    enhancedResponse += `

💡 **Smart Insights:**
${agentResponse.functionCalls && agentResponse.functionCalls.length > 0
  ? `• Successfully executed ${agentResponse.functionCalls.length} function${agentResponse.functionCalls.length > 1 ? 's' : ''}`
  : '• Ready to help with product search, orders, and recommendations'
}
• All products are verified on the Avalanche blockchain
• Sustainability scores and certifications are blockchain-verified
• Secure payments and transparent transactions

🎯 **What I can help you with:**
• Find products by category, price, or sustainability score
• Get detailed product information and specifications
• Place orders and track purchases
• Compare products and get recommendations
• Check order status and handle issues

Just ask me anything about our marketplace! 🛒✨`;

    // Cache the response with appropriate TTL based on query type
    if (shouldCache) {
      const cacheTTL = getCacheTTL(queryType);
      cacheService.cacheAgentResponse(contextualCacheKey, enhancedResponse, cacheTTL);
      console.log(`💾 Cached response for ${queryType} with TTL: ${cacheTTL}ms`);
    }

    // Track successful response
    realPerformanceService.trackResponseTime('autonomous_agent', startTime, Date.now(), {
      messageLength: message.length,
      responseLength: enhancedResponse.length,
      hasFunctionCalls: !!agentResponse.functionCalls,
      sessionId: agentResponse.sessionId
    });

    const response = {
      success: true,
      data: {
        message: enhancedResponse,
        sessionId: agentResponse.sessionId,
        functionCalls: agentResponse.functionCalls,
        timestamp: new Date().toISOString(),
        agentType: 'enhanced_autonomous_shopping_agent',
        responseTime: Date.now() - startTime,
        cached: false
      }
    };

    console.log(`✅ Autonomous Agent Response:`, response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Autonomous Agent API Error:', error);

    // Track error
    realPerformanceService.trackError(
      error instanceof Error ? error.message : 'Unknown error',
      'autonomous_agent_api'
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Determine the type of query for better caching and response handling
 */
function determineQueryType(message: string): string {
  const messageLower = message.toLowerCase();

  if (messageLower.includes('order') || messageLower.includes('buy') || messageLower.includes('purchase')) {
    return 'order_intent';
  }
  if (messageLower.includes('pay') || messageLower.includes('payment') || messageLower.includes('checkout')) {
    return 'payment_intent';
  }
  if (messageLower.includes('search') || messageLower.includes('find') || messageLower.includes('show')) {
    return 'product_search';
  }
  if (messageLower.includes('status') || messageLower.includes('track') || messageLower.includes('order')) {
    return 'order_status';
  }
  if (messageLower.includes('dispute') || messageLower.includes('problem') || messageLower.includes('issue')) {
    return 'dispute_resolution';
  }
  if (messageLower.includes('help') || messageLower.includes('how') || messageLower.includes('what')) {
    return 'general_inquiry';
  }

  return 'general_chat';
}

/**
 * Check if a query is personalized and shouldn't be cached
 */
function isPersonalizedQuery(message: string, queryType: string): boolean {
  const personalizedTypes = ['order_intent', 'payment_intent', 'order_status', 'dispute_resolution'];
  return personalizedTypes.includes(queryType);
}

/**
 * Get appropriate cache TTL based on query type
 */
function getCacheTTL(queryType: string): number {
  const ttlMap: Record<string, number> = {
    'product_search': 5 * 60 * 1000,      // 5 minutes for product searches
    'general_inquiry': 10 * 60 * 1000,    // 10 minutes for general info
    'general_chat': 2 * 60 * 1000,        // 2 minutes for general chat
    'order_intent': 0,                     // No caching for order intents
    'payment_intent': 0,                   // No caching for payment intents
    'order_status': 0,                     // No caching for order status
    'dispute_resolution': 0                // No caching for disputes
  };

  return ttlMap[queryType] || 1 * 60 * 1000; // Default 1 minute
}

/**
 * Enhance the agent response with actual function results
 */
async function enhanceResponseWithFunctionResults(
  originalResponse: string,
  functionCalls: any[]
): Promise<string> {
  let enhancedResponse = originalResponse;

  for (const functionCall of functionCalls) {
    if (!functionCall.result?.success) continue;

    switch (functionCall.function) {
      case 'searchProducts':
        enhancedResponse += await formatProductSearchResults(functionCall.result.data);
        break;
        
      case 'getProductDetails':
        enhancedResponse += await formatProductDetails(functionCall.result.data);
        break;
        
      case 'createOrder':
        enhancedResponse += await formatOrderCreation(functionCall.result.data);
        break;
        
      case 'processPayment':
        enhancedResponse += await formatPaymentProcessing(functionCall.result.data);
        break;
        
      case 'checkOrderStatus':
        enhancedResponse += await formatOrderStatus(functionCall.result.data);
        break;
    }
  }

  return enhancedResponse;
}

async function formatProductSearchResults(data: any): Promise<string> {
  if (!data.products || data.products.length === 0) {
    return '\n\n❌ No products found matching your criteria.';
  }

  let formatted = `\n\n🔍 **Found ${data.products.length} products:**\n\n`;
  
  data.products.forEach((product: any, index: number) => {
    formatted += `**${index + 1}. ${product.name}**\n`;
    formatted += `💰 Price: $${product.priceUSD}\n`;
    formatted += `🌱 Sustainability: ${product.sustainabilityScore || 'N/A'}%\n`;
    formatted += `⭐ Rating: ${product.averageRating}/5\n`;
    formatted += `📦 Category: ${product.category}\n\n`;
  });

  formatted += `💡 Would you like more details about any of these products, or shall I help you place an order?`;
  
  return formatted;
}

async function formatProductDetails(data: any): Promise<string> {
  const product = data.product;
  
  return `\n\n📋 **Product Details:**\n\n` +
    `**${product.name}**\n` +
    `💰 Price: $${product.priceUSD}\n` +
    `🌱 Sustainability Score: ${product.sustainabilityScore || 'N/A'}% (Grade: ${product.sustainabilityGrade})\n` +
    `⭐ Rating: ${product.averageRating}/5\n` +
    `📦 Category: ${product.category}\n` +
    `🚚 Estimated Delivery: ${product.estimatedDelivery}\n` +
    `🌍 Carbon Footprint: ${product.carbonFootprint}\n` +
    `💎 Value Score: ${product.valueScore}/100\n\n` +
    `📝 Description: ${product.description}\n\n` +
    `Ready to order? Just say "Order this product" and I'll handle everything!`;
}

async function formatOrderCreation(data: any): Promise<string> {
  const order = data.order;
  
  return `\n\n🛒 **Order Created Successfully!**\n\n` +
    `📋 Order ID: ${order.orderId}\n` +
    `📦 Product: ${order.productName}\n` +
    `🔢 Quantity: ${order.quantity}\n` +
    `💰 Subtotal: $${order.subtotal.toFixed(2)}\n` +
    `🏪 Platform Fee: $${order.platformFee.toFixed(2)}\n` +
    `💳 **Total: $${order.total.toFixed(2)}**\n` +
    `🌱 Sustainability Impact: ${order.sustainabilityImpact}\n` +
    `🚚 Estimated Delivery: ${order.estimatedDelivery}\n\n` +
    `✅ Your order is ready for payment! Say "Pay with ETH" (or your preferred crypto) to complete the purchase.`;
}

async function formatPaymentProcessing(data: any): Promise<string> {
  return `\n\n💳 **Payment Transaction Prepared!**\n\n` +
    `🔗 Transaction Hash: ${data.transactionHash}\n` +
    `💰 Amount: ${data.amount} ${data.paymentMethod}\n` +
    `⛽ Estimated Gas Fee: ~$${data.gasEstimate.toFixed(2)}\n` +
    `🔐 Escrow Contract: ${data.escrowAddress}\n` +
    `⏱️ Confirmation Time: ${data.estimatedConfirmation}\n\n` +
    `🚀 **Next Steps:**\n` +
    `1. Approve the transaction in your wallet\n` +
    `2. Wait for blockchain confirmation\n` +
    `3. I'll notify you when payment is confirmed!\n\n` +
    `💡 Your payment will be held in escrow until delivery is confirmed for buyer protection.`;
}

async function formatOrderStatus(data: any): Promise<string> {
  const statusEmojis: { [key: string]: string } = {
    'pending_payment': '⏳',
    'payment_confirmed': '✅',
    'processing': '📦',
    'shipped': '🚚',
    'delivered': '📬',
    'completed': '🎉'
  };

  const emoji = statusEmojis[data.status] || '📋';
  
  let formatted = `\n\n${emoji} **Order Status Update**\n\n` +
    `📋 Order ID: ${data.orderId}\n` +
    `📊 Status: ${data.status.replace('_', ' ').toUpperCase()}\n` +
    `🕐 Last Updated: ${new Date(data.lastUpdated).toLocaleString()}\n`;

  if (data.trackingNumber) {
    formatted += `📦 Tracking: ${data.trackingNumber}\n`;
  }

  formatted += `🚚 Estimated Delivery: ${data.estimatedDelivery}\n\n`;

  if (data.statusHistory && data.statusHistory.length > 0) {
    formatted += `📈 **Status History:**\n`;
    data.statusHistory.forEach((entry: any) => {
      formatted += `• ${entry.status.replace('_', ' ')} - ${new Date(entry.timestamp).toLocaleDateString()}\n`;
    });
  }

  return formatted;
}

export async function GET() {
  return NextResponse.json({
    message: 'Autonomous Shopping Agent API is running',
    endpoints: {
      POST: 'Send messages to the autonomous agent',
    },
    capabilities: [
      'Product search and discovery',
      'Autonomous order placement',
      'Payment processing',
      'Order tracking',
      'Customer service'
    ]
  });
}
