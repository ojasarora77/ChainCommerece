#!/usr/bin/env node

/**
 * Fix Bedrock Agent Function Calling Issues
 * This script diagnoses and fixes the agent's action group configuration
 */

const { 
  BedrockAgentClient, 
  GetAgentCommand,
  ListAgentActionGroupsCommand,
  UpdateAgentActionGroupCommand,
  CreateAgentActionGroupCommand,
  PrepareAgentCommand
} = require("@aws-sdk/client-bedrock-agent");

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

class AgentFunctionFixer {
  constructor() {
    this.client = new BedrockAgentClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.agentId = process.env.BEDROCK_AGENT_ID;
    
    console.log(`🌍 Using AWS region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`🤖 Agent ID: ${this.agentId}`);
  }

  async diagnoseAgent() {
    console.log('🔍 Diagnosing agent configuration...\n');
    
    try {
      // Get agent details
      const agentCommand = new GetAgentCommand({
        agentId: this.agentId
      });
      const agentResponse = await this.client.send(agentCommand);
      
      console.log('✅ Agent Details:');
      console.log(`   Name: ${agentResponse.agent.agentName}`);
      console.log(`   Status: ${agentResponse.agent.agentStatus}`);
      console.log(`   Foundation Model: ${agentResponse.agent.foundationModel}`);
      console.log(`   Version: ${agentResponse.agent.agentVersion || 'DRAFT'}\n`);

      // Get action groups
      const actionGroupsCommand = new ListAgentActionGroupsCommand({
        agentId: this.agentId,
        agentVersion: 'DRAFT'
      });
      const actionGroupsResponse = await this.client.send(actionGroupsCommand);
      
      console.log('📋 Action Groups:');
      if (actionGroupsResponse.actionGroupSummaries && actionGroupsResponse.actionGroupSummaries.length > 0) {
        actionGroupsResponse.actionGroupSummaries.forEach(ag => {
          console.log(`   - ${ag.actionGroupName} (${ag.actionGroupState})`);
          console.log(`     ID: ${ag.actionGroupId}`);
          if (ag.description) console.log(`     Description: ${ag.description}`);
        });
      } else {
        console.log('   ❌ No action groups found!');
      }
      
      return {
        agent: agentResponse.agent,
        actionGroups: actionGroupsResponse.actionGroupSummaries || []
      };

    } catch (error) {
      console.error('❌ Error diagnosing agent:', error);
      throw error;
    }
  }

  async createActionGroup() {
    console.log('\n🔧 Creating new action group with proper function schema...');
    
    // Simplified function schema to avoid serialization issues
    const functionSchema = {
      functions: [
        {
          name: 'searchProducts',
          description: 'Search for products in the marketplace',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for products'
              }
            },
            required: ['query']
          }
        }
      ]
    };

    try {
      const command = new CreateAgentActionGroupCommand({
        agentId: this.agentId,
        agentVersion: 'DRAFT',
        actionGroupName: 'marketplace-functions',
        description: 'Functions for marketplace operations',
        actionGroupExecutor: {
          customControl: 'RETURN_CONTROL'
        },
        functionSchema: {
          functions: [
            {
              name: 'searchProducts',
              description: 'Search for products in the marketplace',
              parameters: {
                query: {
                  type: 'string',
                  description: 'Search query for products',
                  required: true
                }
              }
            }
          ]
        }
      });

      const response = await this.client.send(command);
      console.log('✅ Action group created successfully!');
      console.log(`   Action Group ID: ${response.agentActionGroup.actionGroupId}`);
      
      return response.agentActionGroup;
    } catch (error) {
      if (error.name === 'ConflictException') {
        console.log('ℹ️ Action group already exists, will update instead...');
        return this.updateActionGroup();
      } else {
        console.error('❌ Error creating action group:', error);
        throw error;
      }
    }
  }

  async updateActionGroup() {
    console.log('🔄 Updating existing action group...');
    
    // First, get existing action groups to find the ID
    const listCommand = new ListAgentActionGroupsCommand({
      agentId: this.agentId,
      agentVersion: 'DRAFT'
    });
    
    const listResponse = await this.client.send(listCommand);
    const existingActionGroup = listResponse.actionGroupSummaries?.[0];
    
    if (!existingActionGroup) {
      throw new Error('No existing action group found to update');
    }

    // Update with new configuration
    const updateCommand = new UpdateAgentActionGroupCommand({
      agentId: this.agentId,
      agentVersion: 'DRAFT',
      actionGroupId: existingActionGroup.actionGroupId,
      actionGroupName: 'marketplace-functions',
      description: 'Functions for marketplace operations - search, order, payment, and status checking',
      actionGroupExecutor: {
        customControl: 'RETURN_CONTROL'
      },
      functionSchema: {
        functions: [
          {
            name: 'searchProducts',
            description: 'Search for products in the marketplace',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query for products' }
              },
              required: ['query']
            }
          }
        ]
      },
      actionGroupState: 'ENABLED'
    });

    const response = await this.client.send(updateCommand);
    console.log('✅ Action group updated successfully!');
    
    return response.agentActionGroup;
  }

  async prepareAgent() {
    console.log('\n🚀 Preparing agent with new configuration...');
    
    try {
      const command = new PrepareAgentCommand({
        agentId: this.agentId
      });

      const response = await this.client.send(command);
      console.log('✅ Agent prepared successfully!');
      console.log(`   Status: ${response.agentStatus}`);
      
      return response;
    } catch (error) {
      console.error('❌ Error preparing agent:', error);
      throw error;
    }
  }

  async fixAgent() {
    try {
      console.log('🚀 Starting Agent Function Fix...\n');
      
      // Step 1: Diagnose current state
      const diagnosis = await this.diagnoseAgent();
      
      // Step 2: Create or update action group
      await this.createActionGroup();
      
      // Step 3: Prepare agent
      await this.prepareAgent();
      
      console.log('\n🎉 Agent Function Fix Complete!');
      console.log('\n📋 Next Steps:');
      console.log('1. Wait 2-3 minutes for agent preparation to complete');
      console.log('2. Test the agent with: "Find AI-powered smart watch"');
      console.log('3. The agent should now be able to call marketplace functions');
      console.log('4. Check function call traces in the response');
      
      return true;
    } catch (error) {
      console.error('\n❌ Fix failed:', error);
      return false;
    }
  }
}

// Run the fix
if (require.main === module) {
  const fixer = new AgentFunctionFixer();
  fixer.fixAgent()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { AgentFunctionFixer };
