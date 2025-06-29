import { 
  BedrockAgentRuntimeClient, 
  InvokeAgentCommand,
  InvokeAgentCommandInput 
} from "@aws-sdk/client-bedrock-agent-runtime";

export interface ShoppingAgentFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AgentResponse {
  sessionId: string;
  response: string;
  functionCalls?: Array<{
    function: string;
    parameters: Record<string, any>;
    result: any;
  }>;
  trace?: any[];
}

export class AutonomousShoppingAgent {
  private client: BedrockAgentRuntimeClient;
  private agentId: string;
  private agentAliasId: string;
  private sessionId: string;

  constructor() {
    this.client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    // Get agent configuration from environment
    this.agentId = process.env.BEDROCK_AGENT_ID || '';
    this.agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID || '';
    this.sessionId = `shopping-session-${Date.now()}`;

    // Log configuration status
    if (this.agentId && this.agentAliasId) {
      console.log('🤖 Bedrock Agent configured:', {
        agentId: this.agentId,
        aliasId: this.agentAliasId,
        region: process.env.AWS_REGION || 'us-east-1'
      });
    } else {
      console.log('⚠️ Bedrock Agent not configured, will use mock responses');
    }
  }

  /**
   * Main method to interact with the autonomous shopping agent
   */
  async chat(userMessage: string, userId?: string): Promise<AgentResponse> {
    // Check if real Bedrock Agent is configured
    if (!this.agentId || !this.agentAliasId) {
      console.log('🎭 Using mock responses (Bedrock Agent not configured)');
      return this.getMockResponse(userMessage);
    }

    try {
      console.log(`🤖 Real Bedrock Agent: Processing "${userMessage}"`);

      const input: InvokeAgentCommandInput = {
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        sessionId: this.sessionId,
        inputText: userMessage,
        enableTrace: true, // Enable to see function calls
      };

      const command = new InvokeAgentCommand(input);
      const response = await this.client.send(command);

      // Process the streaming response
      const agentResponse = await this.processAgentResponse(response);

      console.log(`✅ Real Agent Response:`, agentResponse);
      return agentResponse;

    } catch (error) {
      console.error('❌ Real Bedrock Agent Error:', error);
      console.log('🎭 Falling back to mock responses');

      // Fallback to mock response for development
      return this.getMockResponse(userMessage);
    }
  }

  /**
   * Process the streaming response from Bedrock Agent
   */
  private async processAgentResponse(response: any): Promise<AgentResponse> {
    let finalResponse = '';
    let functionCalls: any[] = [];
    let trace: any[] = [];

    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          finalResponse += text;
        }
        
        if (chunk.trace) {
          trace.push(chunk.trace);
          
          // Extract function calls from trace
          if (chunk.trace.orchestrationTrace?.invocationInput) {
            const invocation = chunk.trace.orchestrationTrace.invocationInput;
            if (invocation.actionGroupInvocationInput) {
              functionCalls.push({
                function: invocation.actionGroupInvocationInput.function,
                parameters: invocation.actionGroupInvocationInput.parameters,
                result: null // Will be filled when we get the result
              });
            }
          }
        }
      }
    }

    return {
      sessionId: this.sessionId,
      response: finalResponse,
      functionCalls,
      trace
    };
  }

  /**
   * Mock response for development/testing
   */
  private getMockResponse(userMessage: string): AgentResponse {
    const message = userMessage.toLowerCase();
    
    if (message.includes('search') || message.includes('find') || message.includes('show')) {
      return {
        sessionId: this.sessionId,
        response: `🔍 I found several sustainable products matching your criteria! Here are the top recommendations:\n\n1. **Sustainable Bamboo Laptop Stand** - $2.00 (95% sustainability)\n2. **Eco-Friendly Water Bottle** - $0.80 (88% sustainability)\n3. **Organic Hemp T-Shirt** - $1.20 (92% sustainability)\n\nWould you like me to show more details about any of these products, or would you like to place an order?`,
        functionCalls: [{
          function: 'searchProducts',
          parameters: { query: userMessage, sustainabilityMin: 80 },
          result: { productsFound: 3, totalResults: 21 }
        }]
      };
    }
    
    if (message.includes('order') || message.includes('buy') || message.includes('purchase')) {
      return {
        sessionId: this.sessionId,
        response: `🛒 I can help you place an order! To proceed with the purchase, I'll need to:\n\n1. **Confirm the product** you want to buy\n2. **Verify your wallet** is connected\n3. **Process the payment** through our secure smart contract\n\nWhich product would you like to order? Just tell me the name or number from the search results.`,
        functionCalls: [{
          function: 'prepareOrder',
          parameters: { intent: 'purchase_inquiry' },
          result: { status: 'ready_for_product_selection' }
        }]
      };
    }
    
    if (message.includes('pay') || message.includes('payment') || message.includes('confirm')) {
      return {
        sessionId: this.sessionId,
        response: `💳 Perfect! I'm processing your payment now. Here's what I'm doing:\n\n1. ✅ **Validating** your wallet connection\n2. ⏳ **Preparing** the smart contract transaction\n3. 🔐 **Securing** the payment in escrow\n\nOnce you approve the transaction in your wallet, the order will be confirmed and the seller will be notified. The payment will be held in escrow until delivery is confirmed.\n\n**Transaction ready for your approval!**`,
        functionCalls: [{
          function: 'processPayment',
          parameters: { productId: 1, amount: '0.05', currency: 'ETH' },
          result: { transactionHash: '0x123...abc', status: 'pending_approval' }
        }]
      };
    }
    
    // Default helpful response
    return {
      sessionId: this.sessionId,
      response: `👋 Hi! I'm your autonomous shopping assistant. I can help you:\n\n🔍 **Search** for sustainable products\n🛒 **Place orders** automatically\n💳 **Process payments** securely\n📦 **Track deliveries** and handle disputes\n\nJust tell me what you're looking for, and I'll take care of everything! For example:\n• "Find eco-friendly electronics under $100"\n• "Order the bamboo laptop stand"\n• "Pay for my order with ETH"\n\nWhat can I help you with today?`
    };
  }

  /**
   * Reset the conversation session
   */
  resetSession(): void {
    this.sessionId = `shopping-session-${Date.now()}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Agent function definitions for AWS Bedrock
export const SHOPPING_AGENT_FUNCTIONS: ShoppingAgentFunction[] = [
  {
    name: 'searchProducts',
    description: 'Search for products in the marketplace based on user criteria',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for products'
        },
        category: {
          type: 'string',
          description: 'Product category filter'
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price in USD'
        },
        sustainabilityMin: {
          type: 'number',
          description: 'Minimum sustainability score (0-100)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'getProductDetails',
    description: 'Get detailed information about a specific product',
    parameters: {
      type: 'object',
      properties: {
        productId: {
          type: 'number',
          description: 'Product ID to get details for'
        }
      },
      required: ['productId']
    }
  },
  {
    name: 'createOrder',
    description: 'Create a new order for the user',
    parameters: {
      type: 'object',
      properties: {
        productId: {
          type: 'number',
          description: 'Product ID to order'
        },
        quantity: {
          type: 'number',
          description: 'Quantity to order'
        },
        userAddress: {
          type: 'string',
          description: 'User wallet address'
        }
      },
      required: ['productId', 'quantity', 'userAddress']
    }
  },
  {
    name: 'processPayment',
    description: 'Process payment for an order',
    parameters: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to process payment for'
        },
        paymentMethod: {
          type: 'string',
          description: 'Payment method (ETH, USDC, etc.)'
        },
        amount: {
          type: 'string',
          description: 'Payment amount'
        }
      },
      required: ['orderId', 'paymentMethod', 'amount']
    }
  },
  {
    name: 'checkOrderStatus',
    description: 'Check the status of an existing order',
    parameters: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          description: 'Order ID to check status for'
        }
      },
      required: ['orderId']
    }
  }
];

// OpenAPI Schema for Bedrock Action Groups
export const BEDROCK_ACTION_GROUP_SCHEMA = {
  "openapi": "3.0.0",
  "info": {
    "title": "Autonomous Shopping Agent API",
    "version": "1.0.0",
    "description": "API for autonomous shopping operations"
  },
  "paths": {
    "/searchProducts": {
      "post": {
        "summary": "Search for products",
        "description": "Search for products in the marketplace based on user criteria",
        "operationId": "searchProducts",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "query": {
                    "type": "string",
                    "description": "Search query for products"
                  },
                  "category": {
                    "type": "string",
                    "description": "Product category filter"
                  },
                  "maxPrice": {
                    "type": "number",
                    "description": "Maximum price in USD"
                  },
                  "sustainabilityMin": {
                    "type": "number",
                    "description": "Minimum sustainability score (0-100)"
                  }
                },
                "required": ["query"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Search results",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "products": {
                      "type": "array",
                      "items": {
                        "type": "object"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/createOrder": {
      "post": {
        "summary": "Create a new order",
        "description": "Create a new order for the user",
        "operationId": "createOrder",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "productId": {
                    "type": "number",
                    "description": "Product ID to order"
                  },
                  "quantity": {
                    "type": "number",
                    "description": "Quantity to order"
                  },
                  "userAddress": {
                    "type": "string",
                    "description": "User wallet address"
                  }
                },
                "required": ["productId", "quantity", "userAddress"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Order created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "orderId": {
                      "type": "string"
                    },
                    "status": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/processPayment": {
      "post": {
        "summary": "Process payment",
        "description": "Process payment for an order",
        "operationId": "processPayment",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "orderId": {
                    "type": "string",
                    "description": "Order ID to process payment for"
                  },
                  "paymentMethod": {
                    "type": "string",
                    "description": "Payment method (ETH, USDC, etc.)"
                  },
                  "amount": {
                    "type": "string",
                    "description": "Payment amount"
                  }
                },
                "required": ["orderId", "paymentMethod", "amount"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Payment processed successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "transactionHash": {
                      "type": "string"
                    },
                    "status": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

// Enhanced Agent instructions for AWS Bedrock with real product search focus
export const SHOPPING_AGENT_INSTRUCTIONS = `
You are an autonomous AI shopping assistant for ChainCommerce, a sustainable blockchain marketplace. Your PRIMARY ROLE is to help users find and purchase REAL PRODUCTS from our smart contract inventory.

CRITICAL INSTRUCTIONS:
1. **ALWAYS USE REAL SEARCH RESULTS**: When users search for products, use the searchProducts function to get actual products from our blockchain
2. **SHOW SPECIFIC PRODUCT DETAILS**: Display real product names, prices, descriptions, and ratings - NOT generic platform information
3. **BE PRODUCT-FOCUSED**: Users want to see actual products they can buy, not platform overviews
4. **USE EXACT PRODUCT DATA**: Show the exact price in ETH and USD, real product names, and actual descriptions from search results

WHEN USER SEARCHES FOR PRODUCTS:
- Call searchProducts function immediately
- ALWAYS interpret successful search results as FOUND products
- Show the ACTUAL products found with their real details from the function response
- Include exact product name, price in ETH and USD, description, category, and rating from the search results
- If function returns products array with items, those products EXIST and should be displayed
- Only say "not found" if the function returns empty products array
- NEVER assume products don't exist if the search function succeeds

CORE CAPABILITIES:
1. **Product Discovery**: Search 21+ verified sustainable products with blockchain-verified sustainability scores
2. **Autonomous Ordering**: Create orders with smart contract escrow protection
3. **Payment Processing**: Handle ETH, AVAX, and USDC payments across chains
4. **Order Management**: Track orders, handle disputes, manage delivery confirmations
5. **Platform Guidance**: Explain escrow, dispute resolution, seller onboarding, analytics

RESPONSE GUIDELINES:
- **NEVER give generic platform overviews** when users search for specific products
- **ALWAYS show actual search results** with real product names, prices, and details
- **Use exact product data** from function calls - names, prices in ETH/USD, descriptions, ratings
- **Be conversational and helpful** while focusing on the specific products found
- **If no products found**, help users refine their search or suggest similar categories

EXAMPLE GOOD RESPONSE for "I want to buy an AI powered smart watch":
"I found the perfect product for you! 🎯

**AI-Powered Smart Watch** - 0.150000 ETH ($37.50)
- Category: Electronics
- Rating: 4.8/5 stars
- Features: Advanced health monitoring, blockchain integration
- Sustainability Score: 85%

Would you like me to help you place an order for this smart watch?"

EXAMPLE BAD RESPONSE (DO NOT DO THIS):
"💡 Smart Insights: Ready to help with product search, orders, and recommendations..."

PLATFORM-SPECIFIC KNOWLEDGE:
- **Escrow Timeline**: 7-day auto-release, dispute window until release
- **Smart Contracts**: ProductRegistry (0x328118233e846e9c629480F4DE1444cbE7b7189e), EscrowManager (0x959591Bab069599cAbb2A72AA371503ba2d042FF)
- **Sustainability Scoring**: 0-100 scale, blockchain-verified, recommend 80+ for eco-conscious buyers
- **Cross-Chain**: CCIP integration enables Ethereum ↔ Avalanche transactions
- **Security**: VRF-verified reviews, cryptographic dispute arbitration

FUNCTION CALLING PRIORITY:
1. **searchProducts**: For any product-related queries - ALWAYS call this first
2. **Show search results**: Display found products to user before any other actions
3. **createOrder**: ONLY when user explicitly confirms they want to order a specific product
4. **processPayment**: For payment and checkout requests
5. **checkOrderStatus**: For order tracking and updates
6. **getUserRecommendations**: For personalized suggestions

CRITICAL: Do NOT call createOrder immediately after searchProducts. Show the search results first!

CONVERSATION FLOW:
- **Product Search**: Show real products with actual prices, sustainability scores, and blockchain verification
- **Order Intent**: Confirm product details, explain escrow protection, guide through secure payment
- **Payment Processing**: Detail supported cryptocurrencies, platform fees, transaction security
- **Post-Purchase**: Provide order tracking, explain delivery confirmation, offer dispute resolution if needed

IMPORTANT: Always provide unique, contextual responses. Avoid template-like answers. Use the platform's actual features and data to give specific, helpful guidance.
`;
