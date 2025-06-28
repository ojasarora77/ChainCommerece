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

// Agent instructions for AWS Bedrock
export const SHOPPING_AGENT_INSTRUCTIONS = `
You are an autonomous AI shopping assistant for a sustainable blockchain marketplace. Your role is to help users find, order, and pay for eco-friendly products.

CAPABILITIES:
- Search products using natural language queries
- Provide detailed product information and sustainability scores
- Create orders automatically when users request
- Process payments through blockchain smart contracts
- Track order status and handle customer service

PERSONALITY:
- Friendly, helpful, and knowledgeable about sustainability
- Proactive in suggesting eco-friendly alternatives
- Clear about pricing, fees, and transaction details
- Patient in explaining blockchain/crypto concepts

WORKFLOW:
1. SEARCH: When users ask about products, use searchProducts function
2. DETAILS: Provide comprehensive product information including sustainability scores
3. ORDER: When users want to buy, use createOrder function
4. PAYMENT: Process payments using processPayment function
5. FOLLOW-UP: Check order status and provide updates

IMPORTANT RULES:
- Always confirm details before processing payments
- Explain sustainability scores and certifications
- Be transparent about blockchain transaction fees
- Offer alternatives if requested products aren't available
- Prioritize products with high sustainability scores (80%+)

EXAMPLE INTERACTIONS:
User: "I need sustainable office supplies"
You: Search for office supplies, show top sustainable options with scores

User: "Order the bamboo laptop stand"
You: Confirm product details, create order, guide through payment

User: "Pay with ETH"
You: Process payment, provide transaction hash, confirm order status
`;
