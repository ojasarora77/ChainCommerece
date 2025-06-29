#!/usr/bin/env node

/**
 * AWS Bedrock Agent Knowledge Base Integration Script
 * This script associates the Knowledge Base with your existing Bedrock Agent
 */

const { 
  BedrockAgentClient, 
  AssociateAgentKnowledgeBaseCommand,
  UpdateAgentCommand,
  PrepareAgentCommand,
  GetAgentCommand
} = require("@aws-sdk/client-bedrock-agent");

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class KnowledgeBaseIntegrator {
  constructor() {
    this.client = new BedrockAgentClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.agentId = process.env.BEDROCK_AGENT_ID;
    this.knowledgeBaseId = process.env.BEDROCK_KNOWLEDGE_BASE_ID || 'J8UI0TGPTI';
    
    console.log(`🌍 Using AWS region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`🤖 Agent ID: ${this.agentId}`);
    console.log(`📚 Knowledge Base ID: ${this.knowledgeBaseId}`);
  }

  async checkAgentStatus() {
    console.log('🔍 Checking current agent configuration...');
    
    try {
      const command = new GetAgentCommand({
        agentId: this.agentId
      });

      const response = await this.client.send(command);
      console.log('✅ Agent found:', {
        name: response.agent.agentName,
        status: response.agent.agentStatus,
        version: response.agent.agentVersion,
        foundationModel: response.agent.foundationModel
      });
      
      return response.agent;
    } catch (error) {
      console.error('❌ Error checking agent:', error);
      throw error;
    }
  }

  async associateKnowledgeBase() {
    console.log('🔗 Associating Knowledge Base with Agent...');
    
    try {
      const command = new AssociateAgentKnowledgeBaseCommand({
        agentId: this.agentId,
        agentVersion: 'DRAFT', // Always use DRAFT for modifications
        knowledgeBaseId: this.knowledgeBaseId,
        description: 'AI Marketplace product catalog and escrow system documentation',
        knowledgeBaseState: 'ENABLED'
      });

      const response = await this.client.send(command);
      console.log('✅ Knowledge Base associated successfully!');
      console.log('Association ID:', response.agentKnowledgeBase.knowledgeBaseId);
      
      return response.agentKnowledgeBase;
    } catch (error) {
      if (error.name === 'ConflictException') {
        console.log('ℹ️ Knowledge Base already associated with this agent');
        return { knowledgeBaseId: this.knowledgeBaseId };
      } else {
        console.error('❌ Error associating Knowledge Base:', error);
        throw error;
      }
    }
  }

  async updateAgentInstructions() {
    console.log('📝 Updating agent instructions to use Knowledge Base...');
    
    const enhancedInstructions = `You are an autonomous AI shopping assistant for ChainCommerce, a sustainable blockchain marketplace. You have access to comprehensive platform knowledge through your Knowledge Base and can provide detailed, accurate information about all marketplace features.

KNOWLEDGE BASE ACCESS:
- You have access to detailed product catalog information
- Escrow system documentation and procedures  
- Platform overview and technical specifications
- Always use your Knowledge Base to provide accurate, up-to-date information

CORE CAPABILITIES:
1. **Product Search & Discovery**: Search 21+ verified sustainable products across 8 categories
2. **Autonomous Ordering**: Place orders with smart contract escrow protection
3. **Payment Processing**: Handle ETH, AVAX, USDC payments with 2.5% platform fee
4. **Order Tracking**: Monitor order status and delivery updates
5. **Customer Support**: Resolve issues using AI-powered dispute resolution

PLATFORM DETAILS:
- **Networks**: Ethereum and Avalanche (CCIP cross-chain)
- **Escrow**: 7-day auto-release smart contract protection
- **Dispute Resolution**: AI-powered resolution in <2 hours vs 14 days traditional
- **Sustainability Focus**: All products verified for eco-friendliness

INTERACTION GUIDELINES:
- Always check your Knowledge Base first for product and platform information
- Provide specific, accurate details from the Knowledge Base
- Use function calls for actions (search, order, payment, tracking)
- Be proactive in suggesting relevant products and features
- Explain escrow protection and dispute resolution when discussing orders

When users ask about products, platform features, or procedures, always consult your Knowledge Base to provide the most accurate and detailed information available.`;

    try {
      const command = new UpdateAgentCommand({
        agentId: this.agentId,
        agentName: 'autonomous-shopping-agent-with-kb',
        description: 'AI agent with Knowledge Base integration for autonomous shopping operations',
        instruction: enhancedInstructions,
        foundationModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
        idleSessionTTLInSeconds: 1800
      });

      const response = await this.client.send(command);
      console.log('✅ Agent instructions updated successfully!');
      
      return response.agent;
    } catch (error) {
      console.error('❌ Error updating agent instructions:', error);
      throw error;
    }
  }

  async prepareAgent() {
    console.log('🚀 Preparing agent with new configuration...');
    
    try {
      const command = new PrepareAgentCommand({
        agentId: this.agentId
      });

      const response = await this.client.send(command);
      console.log('✅ Agent prepared successfully!');
      console.log('Preparation Status:', response.agentStatus);
      
      return response;
    } catch (error) {
      console.error('❌ Error preparing agent:', error);
      throw error;
    }
  }

  async integrate() {
    try {
      console.log('🚀 Starting Knowledge Base Integration...\n');
      
      // Step 1: Check current agent status
      await this.checkAgentStatus();
      
      // Step 2: Associate Knowledge Base
      await this.associateKnowledgeBase();
      
      // Step 3: Update agent instructions
      await this.updateAgentInstructions();
      
      // Step 4: Prepare agent
      await this.prepareAgent();
      
      console.log('\n🎉 Knowledge Base Integration Complete!');
      console.log('\n📋 Next Steps:');
      console.log('1. Wait 2-3 minutes for agent preparation to complete');
      console.log('2. Test the enhanced agent with knowledge-based queries');
      console.log('3. The agent can now access product catalog and escrow documentation');
      
      return true;
    } catch (error) {
      console.error('\n❌ Integration failed:', error);
      return false;
    }
  }
}

// Run the integration
if (require.main === module) {
  const integrator = new KnowledgeBaseIntegrator();
  integrator.integrate()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { KnowledgeBaseIntegrator };
