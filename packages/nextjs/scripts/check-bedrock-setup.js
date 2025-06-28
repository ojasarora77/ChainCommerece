#!/usr/bin/env node

/**
 * Check Bedrock Agent Setup Status
 * This script verifies your AWS Bedrock Agent configuration
 */

const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime");
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class BedrockSetupChecker {
  constructor() {
    this.agentId = process.env.BEDROCK_AGENT_ID;
    this.agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID;
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  }

  checkEnvironmentVariables() {
    console.log('🔍 Checking Environment Variables...\n');
    
    const required = {
      'AWS_REGION': this.region,
      'AWS_ACCESS_KEY_ID': this.accessKeyId ? '✅ Set' : '❌ Missing',
      'AWS_SECRET_ACCESS_KEY': this.secretAccessKey ? '✅ Set' : '❌ Missing',
      'BEDROCK_AGENT_ID': this.agentId || '❌ Missing',
      'BEDROCK_AGENT_ALIAS_ID': this.agentAliasId || '❌ Missing'
    };

    for (const [key, value] of Object.entries(required)) {
      console.log(`${key}: ${value}`);
    }

    const allSet = this.accessKeyId && this.secretAccessKey && this.agentId && this.agentAliasId;
    
    if (allSet) {
      console.log('\n✅ All required environment variables are set!');
      return true;
    } else {
      console.log('\n❌ Some environment variables are missing.');
      console.log('\n📝 To fix this:');
      console.log('1. Copy .env.example to .env');
      console.log('2. Fill in your AWS credentials');
      console.log('3. Run the Bedrock Agent setup script');
      return false;
    }
  }

  async testBedrockConnection() {
    if (!this.agentId || !this.agentAliasId) {
      console.log('\n⚠️ Skipping Bedrock test - Agent not configured');
      return false;
    }

    console.log('\n🤖 Testing Bedrock Agent Connection...\n');

    try {
      const client = new BedrockAgentRuntimeClient({
        region: this.region,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });

      const command = new InvokeAgentCommand({
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        sessionId: `test-session-${Date.now()}`,
        inputText: 'Hello, can you help me find products?',
        enableTrace: true
      });

      console.log('📞 Sending test message to agent...');
      const response = await client.send(command);
      
      console.log('✅ Bedrock Agent responded successfully!');
      console.log('🎉 Your autonomous shopping agent is ready to use!');
      
      return true;

    } catch (error) {
      console.error('❌ Bedrock Agent test failed:', error.message);
      
      if (error.name === 'ResourceNotFoundException') {
        console.log('\n💡 This usually means:');
        console.log('- Agent ID or Alias ID is incorrect');
        console.log('- Agent hasn\'t been created yet');
        console.log('- Agent is in a different region');
      } else if (error.name === 'UnauthorizedOperation') {
        console.log('\n💡 This usually means:');
        console.log('- AWS credentials don\'t have Bedrock permissions');
        console.log('- Bedrock model access not enabled');
      }
      
      return false;
    }
  }

  async testLocalAPI() {
    console.log('\n🌐 Testing Local API Endpoints...\n');

    try {
      // Test agent functions endpoint
      const response = await fetch('http://localhost:3001/api/ai/agent-functions');
      
      if (response.ok) {
        console.log('✅ Agent Functions API is running');
      } else {
        console.log('❌ Agent Functions API returned error:', response.status);
      }

      // Test autonomous agent endpoint
      const agentResponse = await fetch('http://localhost:3001/api/ai/autonomous-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test message',
          sessionId: 'test-session'
        })
      });

      if (agentResponse.ok) {
        console.log('✅ Autonomous Agent API is running');
        const data = await agentResponse.json();
        console.log('📝 Response type:', data.success ? 'Success' : 'Error');
      } else {
        console.log('❌ Autonomous Agent API returned error:', agentResponse.status);
      }

      return true;

    } catch (error) {
      console.log('❌ Local API test failed:', error.message);
      console.log('\n💡 Make sure your Next.js server is running:');
      console.log('cd packages/nextjs && yarn dev');
      return false;
    }
  }

  printSetupInstructions() {
    console.log('\n📋 Setup Instructions:\n');
    
    if (!this.agentId || !this.agentAliasId) {
      console.log('🔧 To set up AWS Bedrock Agent:');
      console.log('1. Follow the guide in BEDROCK_AGENT_SETUP.md');
      console.log('2. Or run: node scripts/setup-bedrock-agent.js');
      console.log('3. Update your .env file with the agent IDs\n');
    }

    console.log('🚀 To test your setup:');
    console.log('1. Start the Next.js server: yarn dev');
    console.log('2. Go to http://localhost:3001/marketplace');
    console.log('3. Click "Shopping Assistant" → "Autonomous Agent"');
    console.log('4. Try: "Find sustainable electronics under $100"\n');

    console.log('📚 Useful resources:');
    console.log('- Setup guide: BEDROCK_AGENT_SETUP.md');
    console.log('- AWS Bedrock Console: https://console.aws.amazon.com/bedrock/');
    console.log('- Function logs: Check CloudWatch for Lambda logs');
  }

  async run() {
    console.log('🤖 AWS Bedrock Agent Setup Checker\n');
    console.log('=' .repeat(50));

    // Check environment variables
    const envOk = this.checkEnvironmentVariables();

    // Test local API
    await this.testLocalAPI();

    // Test Bedrock connection if configured
    if (envOk) {
      await this.testBedrockConnection();
    }

    // Print setup instructions
    this.printSetupInstructions();

    console.log('\n' + '='.repeat(50));
    console.log('🎯 Setup check complete!');
  }
}

// Run the checker
if (require.main === module) {
  const checker = new BedrockSetupChecker();
  checker.run().catch(console.error);
}

module.exports = BedrockSetupChecker;
