import { NextRequest, NextResponse } from 'next/server';
import { AutonomousShoppingAgent } from '../../../../services/bedrock/agents/autonomousShoppingAgent';
import { ShoppingAgentFunctions } from '../../../../services/bedrock/agents/shoppingAgentFunctions';
import { cacheService, hashMessage } from '~~/services/cache/CacheService';
import { realPerformanceService } from '~~/services/analytics/RealPerformanceService';

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

    // Check cache for similar messages
    const messageHash = hashMessage(message);
    const cachedResponse = cacheService.getCachedAgentResponse(messageHash);

    if (cachedResponse) {
      console.log('📦 Returning cached response');

      // Track cache hit
      realPerformanceService.trackCacheHit(messageHash, Date.now() - startTime);

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

    // Track cache miss
    realPerformanceService.trackCacheMiss(messageHash, Date.now() - startTime);

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

    // Enhance the response with function results
    let enhancedResponse = agentResponse.response;
    
    if (agentResponse.functionCalls) {
      enhancedResponse = await enhanceResponseWithFunctionResults(
        agentResponse.response,
        agentResponse.functionCalls
      );
    }

    // Cache the response for similar future queries
    cacheService.cacheAgentResponse(messageHash, enhancedResponse, 2 * 60 * 1000); // 2 minutes

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
        agentType: 'autonomous_shopping_agent',
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
