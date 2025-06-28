#!/usr/bin/env node

/**
 * AWS Bedrock Agent Setup Script
 * This script creates and configures the autonomous shopping agent
 */

const { 
  BedrockAgentClient, 
  CreateAgentCommand,
  CreateAgentActionGroupCommand,
  CreateAgentAliasCommand,
  PrepareAgentCommand
} = require("@aws-sdk/client-bedrock-agent");

const fs = require('fs');
const path = require('path');

// Configuration
const AGENT_CONFIG = {
  agentName: 'autonomous-shopping-agent',
  description: 'AI agent that can autonomously search, order, and pay for sustainable products',
  foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
  instruction: `You are an autonomous AI shopping assistant for a sustainable blockchain marketplace. Your role is to help users find, order, and pay for eco-friendly products.

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
You: Process payment, provide transaction hash, confirm order status`,
  idleSessionTTLInSeconds: 1800, // 30 minutes
};

// Function schemas for the agent
const FUNCTION_SCHEMAS = [
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

class BedrockAgentSetup {
  constructor() {
    this.client = new BedrockAgentClient({
      region: process.env.AWS_REGION || 'eu-west-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log(`🌍 Using AWS region: ${process.env.AWS_REGION || 'eu-west-2'}`);
  }

  async createAgent() {
    console.log('🤖 Creating Bedrock Agent...');
    
    try {
      const createAgentCommand = new CreateAgentCommand({
        agentName: AGENT_CONFIG.agentName,
        description: AGENT_CONFIG.description,
        foundationModel: AGENT_CONFIG.foundationModel,
        instruction: AGENT_CONFIG.instruction,
        idleSessionTTLInSeconds: AGENT_CONFIG.idleSessionTTLInSeconds,
        agentResourceRoleArn: await this.getOrCreateAgentRole(),
      });

      const response = await this.client.send(createAgentCommand);
      console.log('✅ Agent created successfully!');
      console.log('Agent ID:', response.agent.agentId);
      
      return response.agent;
    } catch (error) {
      console.error('❌ Error creating agent:', error);
      throw error;
    }
  }

  async createActionGroup(agentId, agentVersion) {
    console.log('🔧 Creating Action Group...');
    
    try {
      const actionGroupCommand = new CreateAgentActionGroupCommand({
        agentId: agentId,
        agentVersion: agentVersion,
        actionGroupName: 'shopping-functions',
        description: 'Functions for autonomous shopping operations',
        actionGroupExecutor: {
          lambda: process.env.LAMBDA_FUNCTION_ARN || 'arn:aws:lambda:us-east-1:123456789012:function:shopping-agent-executor'
        },
        functionSchema: {
          functions: FUNCTION_SCHEMAS
        }
      });

      const response = await this.client.send(actionGroupCommand);
      console.log('✅ Action Group created successfully!');
      
      return response.agentActionGroup;
    } catch (error) {
      console.error('❌ Error creating action group:', error);
      throw error;
    }
  }

  async createAgentAlias(agentId) {
    console.log('🏷️ Creating Agent Alias...');
    
    try {
      const aliasCommand = new CreateAgentAliasCommand({
        agentId: agentId,
        agentAliasName: 'production',
        description: 'Production alias for the shopping agent'
      });

      const response = await this.client.send(aliasCommand);
      console.log('✅ Agent Alias created successfully!');
      console.log('Alias ID:', response.agentAlias.agentAliasId);
      
      return response.agentAlias;
    } catch (error) {
      console.error('❌ Error creating agent alias:', error);
      throw error;
    }
  }

  async prepareAgent(agentId) {
    console.log('🚀 Preparing Agent...');
    
    try {
      const prepareCommand = new PrepareAgentCommand({
        agentId: agentId
      });

      const response = await this.client.send(prepareCommand);
      console.log('✅ Agent prepared successfully!');
      
      return response;
    } catch (error) {
      console.error('❌ Error preparing agent:', error);
      throw error;
    }
  }

  async getOrCreateAgentRole() {
    // For now, return a placeholder ARN
    // In production, you would create an IAM role with proper permissions
    return 'arn:aws:iam::123456789012:role/AmazonBedrockExecutionRoleForAgents_shopping';
  }

  async updateEnvironmentFile(agentId, agentAliasId) {
    console.log('📝 Updating environment variables...');
    
    const envPath = path.join(__dirname, '../.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add Bedrock Agent variables
    const updates = {
      'BEDROCK_AGENT_ID': agentId,
      'BEDROCK_AGENT_ALIAS_ID': agentAliasId
    };
    
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment file updated!');
  }

  async setup() {
    try {
      console.log('🚀 Starting AWS Bedrock Agent Setup...\n');
      
      // Step 1: Create the agent
      const agent = await this.createAgent();
      
      // Step 2: Create action group
      await this.createActionGroup(agent.agentId, agent.agentVersion);
      
      // Step 3: Prepare the agent
      await this.prepareAgent(agent.agentId);
      
      // Step 4: Create alias
      const alias = await this.createAgentAlias(agent.agentId);
      
      // Step 5: Update environment variables
      await this.updateEnvironmentFile(agent.agentId, alias.agentAliasId);
      
      console.log('\n🎉 AWS Bedrock Agent Setup Complete!');
      console.log('\n📋 Summary:');
      console.log(`Agent ID: ${agent.agentId}`);
      console.log(`Agent Alias ID: ${alias.agentAliasId}`);
      console.log(`Foundation Model: ${AGENT_CONFIG.foundationModel}`);
      console.log('\n✅ Your autonomous shopping agent is ready to use!');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    }
  }
}

// Run the setup if called directly
if (require.main === module) {
  const setup = new BedrockAgentSetup();
  setup.setup();
}

module.exports = BedrockAgentSetup;
