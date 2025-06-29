#!/usr/bin/env node

/**
 * AWS Bedrock Knowledge Base Setup Script
 * Creates and configures a knowledge base for the AI marketplace platform
 */

const { 
  BedrockAgentClient,
  CreateKnowledgeBaseCommand,
  CreateDataSourceCommand,
  StartIngestionJobCommand
} = require("@aws-sdk/client-bedrock-agent");

const fs = require('fs');
const path = require('path');

// Configuration
const KNOWLEDGE_BASE_CONFIG = {
  name: 'ai-marketplace-knowledge-base',
  description: 'Comprehensive knowledge base for AI marketplace platform features, policies, and procedures',
  roleArn: process.env.BEDROCK_KB_ROLE_ARN || 'arn:aws:iam::123456789012:role/AmazonBedrockExecutionRoleForKnowledgeBase',
  storageConfiguration: {
    type: 'OPENSEARCH_SERVERLESS',
    opensearchServerlessConfiguration: {
      collectionArn: process.env.OPENSEARCH_COLLECTION_ARN || 'arn:aws:aoss:us-east-1:123456789012:collection/ai-marketplace-kb',
      vectorIndexName: 'ai-marketplace-index',
      fieldMapping: {
        vectorField: 'vector',
        textField: 'text',
        metadataField: 'metadata'
      }
    }
  },
  embeddingModelArn: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1'
};

const DATA_SOURCE_CONFIG = {
  name: 'marketplace-documentation',
  description: 'Platform documentation and knowledge articles',
  dataSourceConfiguration: {
    type: 'S3',
    s3Configuration: {
      bucketArn: process.env.KNOWLEDGE_BASE_BUCKET_ARN || 'arn:aws:s3:::ai-marketplace-knowledge-base',
      inclusionPrefixes: ['docs/', 'knowledge/']
    }
  }
};

class BedrockKnowledgeBaseSetup {
  constructor() {
    this.client = new BedrockAgentClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async createKnowledgeBase() {
    console.log('📚 Creating Bedrock Knowledge Base...');
    
    try {
      const command = new CreateKnowledgeBaseCommand({
        name: KNOWLEDGE_BASE_CONFIG.name,
        description: KNOWLEDGE_BASE_CONFIG.description,
        roleArn: KNOWLEDGE_BASE_CONFIG.roleArn,
        knowledgeBaseConfiguration: {
          type: 'VECTOR',
          vectorKnowledgeBaseConfiguration: {
            embeddingModelArn: KNOWLEDGE_BASE_CONFIG.embeddingModelArn
          }
        },
        storageConfiguration: KNOWLEDGE_BASE_CONFIG.storageConfiguration
      });

      const response = await this.client.send(command);
      console.log('✅ Knowledge Base created successfully!');
      console.log('Knowledge Base ID:', response.knowledgeBase.knowledgeBaseId);
      
      return response.knowledgeBase;
    } catch (error) {
      console.error('❌ Error creating knowledge base:', error);
      throw error;
    }
  }

  async createDataSource(knowledgeBaseId) {
    console.log('📄 Creating Data Source...');
    
    try {
      const command = new CreateDataSourceCommand({
        knowledgeBaseId: knowledgeBaseId,
        name: DATA_SOURCE_CONFIG.name,
        description: DATA_SOURCE_CONFIG.description,
        dataSourceConfiguration: DATA_SOURCE_CONFIG.dataSourceConfiguration
      });

      const response = await this.client.send(command);
      console.log('✅ Data Source created successfully!');
      console.log('Data Source ID:', response.dataSource.dataSourceId);
      
      return response.dataSource;
    } catch (error) {
      console.error('❌ Error creating data source:', error);
      throw error;
    }
  }

  async startIngestionJob(knowledgeBaseId, dataSourceId) {
    console.log('🔄 Starting Ingestion Job...');
    
    try {
      const command = new StartIngestionJobCommand({
        knowledgeBaseId: knowledgeBaseId,
        dataSourceId: dataSourceId
      });

      const response = await this.client.send(command);
      console.log('✅ Ingestion Job started successfully!');
      console.log('Ingestion Job ID:', response.ingestionJob.ingestionJobId);
      
      return response.ingestionJob;
    } catch (error) {
      console.error('❌ Error starting ingestion job:', error);
      throw error;
    }
  }

  async generateKnowledgeBaseDocuments() {
    console.log('📝 Generating Knowledge Base Documents...');
    
    const docsDir = path.join(__dirname, '../knowledge-base-docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Platform Overview
    const platformOverview = `
# AI Marketplace Platform Overview

## Core Features
- **Sustainable Product Marketplace**: Blockchain-verified eco-friendly products
- **AI-Powered Shopping Assistant**: Autonomous product search, ordering, and payment
- **Smart Contract Escrow**: Secure 7-day auto-release escrow system
- **Dispute Resolution**: AI-powered dispute analysis with <2 hour resolution
- **Cross-Chain Support**: Ethereum and Avalanche integration via CCIP
- **VRF-Verified Reviews**: Cryptographically secure review authenticity

## Supported Cryptocurrencies
- **Ethereum (ETH)**: Primary payment method on Ethereum network
- **Avalanche (AVAX)**: Primary payment method on Avalanche network  
- **USDC**: Stablecoin support on both networks
- **Platform Fee**: 2.5% on all transactions

## Smart Contract Addresses
- **ProductRegistry (Avalanche Fuji)**: 0x328118233e846e9c629480F4DE1444cbE7b7189e
- **EscrowManager (Avalanche Fuji)**: 0x959591Bab069599cAbb2A72AA371503ba2d042FF
- **USDC Token (Avalanche Fuji)**: 0x5425890298aed601595a70AB815c96711a31Bc65
`;

    // Escrow System Documentation
    const escrowDocs = `
# Escrow System Documentation

## How Escrow Works
1. **Order Creation**: Buyer places order and funds are locked in smart contract
2. **Seller Notification**: Seller receives notification to ship product
3. **Delivery Confirmation**: Buyer confirms receipt or 7-day auto-release triggers
4. **Fund Release**: Funds released to seller after confirmation
5. **Dispute Handling**: AI-powered resolution if issues arise

## Escrow Timeline
- **Auto-Release**: 7 days after escrow creation
- **Dispute Window**: Available until auto-release
- **Resolution Time**: <2 hours for AI-mediated disputes
- **Appeal Process**: Manual arbitrator review if needed

## Security Features
- **Smart Contract Protection**: Funds held in audited smart contracts
- **Multi-signature Support**: Enhanced security for large transactions
- **Chainlink VRF**: Cryptographic randomness for dispute arbitrators
- **Cross-Chain Compatibility**: CCIP integration for cross-chain payments
`;

    // Product Information
    const productDocs = `
# Product Catalog Information

## Total Products Available
The marketplace currently has 21 verified sustainable products across multiple categories:

### Categories
- **Electronics**: Smart watches, fitness trackers, laptop stands, LED strips, earbuds
- **Clothing**: Organic cotton t-shirts, hemp t-shirts, bamboo joggers
- **Digital**: Blockchain development guides, NFT art guides, crypto handbooks
- **Sports**: Fitness trackers, yoga mats, sports equipment
- **Books**: Web3 development guides, crypto trading handbooks
- **Home & Garden**: Smart planters, eco-friendly home products
- **Beauty**: Sustainable beauty products
- **Automotive**: Eco-friendly car accessories

## Sustainability Scoring
- **Range**: 0-100 sustainability score
- **Verification**: Blockchain-verified certifications
- **Criteria**: Carbon footprint, materials sourcing, manufacturing process
- **Minimum Recommended**: 80+ sustainability score for eco-conscious buyers

## Product Pricing
- **Dynamic Pricing**: Real-time crypto price adjustments
- **Multi-Currency**: ETH, AVAX, and USDC support
- **Price Range**: $0.40 - $6.00 USD equivalent
- **Platform Fee**: 2.5% added to all purchases
`;

    // Write documents
    fs.writeFileSync(path.join(docsDir, 'platform-overview.md'), platformOverview);
    fs.writeFileSync(path.join(docsDir, 'escrow-system.md'), escrowDocs);
    fs.writeFileSync(path.join(docsDir, 'product-catalog.md'), productDocs);

    console.log('✅ Knowledge Base documents generated in:', docsDir);
    return docsDir;
  }

  async updateEnvironmentFile(knowledgeBaseId) {
    console.log('📝 Updating environment variables...');
    
    const envPath = path.join(__dirname, '../.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Add or update knowledge base ID
    if (envContent.includes('BEDROCK_KNOWLEDGE_BASE_ID=')) {
      envContent = envContent.replace(
        /BEDROCK_KNOWLEDGE_BASE_ID=.*/,
        `BEDROCK_KNOWLEDGE_BASE_ID=${knowledgeBaseId}`
      );
    } else {
      envContent += `\n# AWS Bedrock Knowledge Base\nBEDROCK_KNOWLEDGE_BASE_ID=${knowledgeBaseId}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Environment file updated');
  }

  async setupDocumentsOnly() {
    try {
      console.log('📝 Generating Knowledge Base Documents...\n');

      // Generate knowledge base documents
      const docsDir = await this.generateKnowledgeBaseDocuments();

      console.log('\n✅ Documents generated successfully!');
      console.log('\n📋 Manual Setup Steps:');
      console.log('1. Create S3 bucket: aws s3 mb s3://ai-marketplace-knowledge-base');
      console.log('2. Upload documents: aws s3 sync ' + docsDir + ' s3://ai-marketplace-knowledge-base/docs/');
      console.log('3. Create Knowledge Base in AWS Console');
      console.log('4. Update .env with BEDROCK_KNOWLEDGE_BASE_ID');

      return docsDir;
    } catch (error) {
      console.error('❌ Document generation failed:', error);
      throw error;
    }
  }

  async setup() {
    try {
      console.log('🚀 Starting AWS Bedrock Knowledge Base Setup...\n');

      // Step 1: Generate knowledge base documents
      await this.generateKnowledgeBaseDocuments();

      // Step 2: Create knowledge base
      const knowledgeBase = await this.createKnowledgeBase();

      // Step 3: Create data source
      const dataSource = await this.createDataSource(knowledgeBase.knowledgeBaseId);

      // Step 4: Start ingestion job
      await this.startIngestionJob(knowledgeBase.knowledgeBaseId, dataSource.dataSourceId);

      // Step 5: Update environment variables
      await this.updateEnvironmentFile(knowledgeBase.knowledgeBaseId);

      console.log('\n🎉 Knowledge Base setup completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Upload the generated documents to your S3 bucket');
      console.log('2. Wait for ingestion job to complete');
      console.log('3. Update your agent to use the knowledge base');
      console.log('4. Test the enhanced agent capabilities');

    } catch (error) {
      console.error('❌ Setup failed:', error);
      console.log('\n💡 Try the manual setup instead:');
      console.log('node scripts/setup-bedrock-knowledge-base.js --docs-only');
      process.exit(1);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new BedrockKnowledgeBaseSetup();

  // Check for command line arguments
  const args = process.argv.slice(2);
  if (args.includes('--docs-only')) {
    setup.setupDocumentsOnly();
  } else {
    setup.setup();
  }
}

module.exports = BedrockKnowledgeBaseSetup;
