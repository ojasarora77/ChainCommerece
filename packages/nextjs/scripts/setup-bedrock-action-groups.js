#!/usr/bin/env node

/**
 * Script to set up Bedrock Agent Action Groups
 * This script helps configure your Bedrock agent with the necessary action groups
 * so it can call functions to search products, create orders, and process payments.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Bedrock Agent Action Groups Setup Guide');
console.log('==========================================\n');

console.log('Your Bedrock agent is working but needs Action Groups to call functions.');
console.log('Follow these steps to enable function calling:\n');

console.log('📋 STEP 1: Create a Lambda Function');
console.log('-----------------------------------');
console.log('1. Go to AWS Lambda Console: https://console.aws.amazon.com/lambda/');
console.log('2. Click "Create function"');
console.log('3. Choose "Author from scratch"');
console.log('4. Function name: "bedrock-shopping-agent-functions"');
console.log('5. Runtime: "Node.js 18.x" or later');
console.log('6. Click "Create function"\n');

console.log('📝 STEP 2: Upload Lambda Code');
console.log('-----------------------------');
console.log('1. In the Lambda function editor, replace the default code with the contents of:');
console.log('   packages/nextjs/lambda/bedrock-agent-functions.js');
console.log('2. Click "Deploy" to save the function\n');

console.log('🔗 STEP 3: Create Action Group in Bedrock');
console.log('----------------------------------------');
console.log('1. Go to your Bedrock Agent: https://console.aws.amazon.com/bedrock/');
console.log('2. Select your agent: "autonomous-shopping-agent"');
console.log('3. Click "Action groups" tab');
console.log('4. Click "Add action group"');
console.log('5. Fill in the details:');
console.log('   - Action group name: "shopping-functions"');
console.log('   - Description: "Functions for autonomous shopping operations"');
console.log('   - Action group type: "Define with function details"');
console.log('6. Add these functions:\n');

const functions = [
  {
    name: 'searchProducts',
    description: 'Search for products in the marketplace based on user criteria',
    parameters: {
      query: { type: 'string', description: 'Search query for products', required: true },
      category: { type: 'string', description: 'Product category filter', required: false },
      maxPrice: { type: 'number', description: 'Maximum price in USD', required: false },
      sustainabilityMin: { type: 'number', description: 'Minimum sustainability score (0-100)', required: false }
    }
  },
  {
    name: 'createOrder',
    description: 'Create a new order for the user',
    parameters: {
      productId: { type: 'number', description: 'Product ID to order', required: true },
      quantity: { type: 'number', description: 'Quantity to order', required: true },
      userAddress: { type: 'string', description: 'User wallet address', required: true }
    }
  },
  {
    name: 'processPayment',
    description: 'Process payment for an order',
    parameters: {
      orderId: { type: 'string', description: 'Order ID to process payment for', required: true },
      paymentMethod: { type: 'string', description: 'Payment method (ETH, USDC, etc.)', required: true },
      amount: { type: 'string', description: 'Payment amount', required: true }
    }
  }
];

functions.forEach((func, index) => {
  console.log(`   Function ${index + 1}: ${func.name}`);
  console.log(`   Description: ${func.description}`);
  console.log(`   Parameters:`);
  Object.entries(func.parameters).forEach(([name, details]) => {
    console.log(`     - ${name} (${details.type}): ${details.description} ${details.required ? '[REQUIRED]' : '[OPTIONAL]'}`);
  });
  console.log('');
});

console.log('🔧 STEP 4: Configure Lambda Integration');
console.log('--------------------------------------');
console.log('1. In the action group configuration:');
console.log('   - Select "Select an existing Lambda function"');
console.log('   - Choose your Lambda function: "bedrock-shopping-agent-functions"');
console.log('   - Lambda version: "$LATEST"');
console.log('2. Click "Add action group"\n');

console.log('🔄 STEP 5: Prepare and Test');
console.log('---------------------------');
console.log('1. Click "Prepare" button to update your agent');
console.log('2. Wait for the agent to be prepared (this may take a few minutes)');
console.log('3. Test your agent with: "Find sustainable electronics under $100"');
console.log('4. The agent should now be able to call functions!\n');

console.log('🎯 ALTERNATIVE: Quick Setup with OpenAPI Schema');
console.log('===============================================');
console.log('Instead of manually adding functions, you can use an OpenAPI schema:');
console.log('1. In action group configuration, choose "Define with API schemas"');
console.log('2. Upload this OpenAPI schema:\n');

// Generate OpenAPI schema
const openApiSchema = {
  "openapi": "3.0.0",
  "info": {
    "title": "Shopping Agent Functions",
    "version": "1.0.0"
  },
  "paths": {
    "/searchProducts": {
      "post": {
        "summary": "Search products",
        "operationId": "searchProducts",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "query": { "type": "string", "description": "Search query" },
                  "category": { "type": "string", "description": "Category filter" },
                  "maxPrice": { "type": "number", "description": "Max price in USD" },
                  "sustainabilityMin": { "type": "number", "description": "Min sustainability score" }
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
                    "products": { "type": "array" }
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
        "summary": "Create order",
        "operationId": "createOrder",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "productId": { "type": "number" },
                  "quantity": { "type": "number" },
                  "userAddress": { "type": "string" }
                },
                "required": ["productId", "quantity", "userAddress"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Order created",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "orderId": { "type": "string" }
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

// Save the schema to a file
const schemaPath = path.join(__dirname, '..', 'lambda', 'openapi-schema.json');
fs.writeFileSync(schemaPath, JSON.stringify(openApiSchema, null, 2));

console.log(`📁 OpenAPI schema saved to: ${schemaPath}`);
console.log('   Upload this file when configuring the action group.\n');

console.log('✅ EXPECTED RESULT');
console.log('=================');
console.log('After setup, your agent should:');
console.log('- Execute function calls when searching for products');
console.log('- Create orders when users want to buy something');
console.log('- Process payments when users want to pay');
console.log('- Show detailed function call traces in responses\n');

console.log('🔍 TROUBLESHOOTING');
console.log('==================');
console.log('If functions still don\'t work:');
console.log('1. Check Lambda function logs in CloudWatch');
console.log('2. Verify IAM permissions for Bedrock to call Lambda');
console.log('3. Ensure the agent is "Prepared" after adding action groups');
console.log('4. Test individual functions in Lambda console first\n');

console.log('🎉 Ready to test your autonomous shopping agent!');
console.log('Try: "Find sustainable electronics under $100"');
