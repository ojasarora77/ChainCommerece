# Amazon Bedrock Integration for Chromion Marketplace

This document describes the complete Amazon Bedrock AI integration implemented for the Chromion decentralized marketplace.

## Overview

The integration provides three main AI-powered features:
1. **AI Shopping Assistant** - Personalized product recommendations
2. **Pricing Optimizer** - Dynamic pricing strategies for sellers
3. **Dispute Resolution** - Automated dispute analysis and resolution

## Architecture

### Service Layer (`services/bedrock/`)
- `index.ts` - Core Bedrock client initialization and base functions
- `agents/shoppingAgent.ts` - Shopping recommendation logic
- `agents/pricingAgent.ts` - Price optimization algorithms
- `agents/disputeAgent.ts` - Dispute resolution analysis

### API Routes (`app/api/ai/`)
- `shopping/route.ts` - Shopping assistant endpoint
- `pricing/route.ts` - Price optimization endpoint
- `dispute/route.ts` - Dispute resolution endpoint

### React Components (`components/ai/`)
- `AIShoppingAssistant.tsx` - Shopping interface
- `PricingOptimizer.tsx` - Seller pricing tool
- `DisputeResolver.tsx` - Dispute resolution interface

### React Hooks (`hooks/bedrock/`)
- `useShoppingAgent.ts` - Shopping agent state management

### Types (`types/bedrock.ts`)
- TypeScript interfaces for all AI-related data structures

## Setup Instructions

### 1. AWS Configuration

1. **Create AWS Account** and set up Amazon Bedrock access
2. **Enable Claude Models** in Amazon Bedrock console
3. **Create IAM User** with Bedrock permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "bedrock:InvokeModel",
           "bedrock:InvokeAgent",
           "bedrock:GetAgent",
           "bedrock:ListAgents"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

### 2. Environment Variables

Update `packages/nextjs/.env.local`:
```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1

# Bedrock IDs (optional - for agent-based features)
BEDROCK_AGENT_ID=your_agent_id
BEDROCK_AGENT_ALIAS_ID=your_agent_alias_id
BEDROCK_KNOWLEDGE_BASE_ID=your_knowledge_base_id

# Chainlink Functions (for smart contract integration)
CHAINLINK_SUBSCRIPTION_ID=your_subscription_id
CHAINLINK_DON_ID=your_don_id
```

### 3. Dependencies

All required AWS SDK packages are already installed:
- `@aws-sdk/client-bedrock-agent`
- `@aws-sdk/client-bedrock-agent-runtime`
- `@aws-sdk/client-bedrock-runtime`
- `@aws-sdk/client-s3`
- `@aws-sdk/credential-providers`

## Features

### AI Shopping Assistant

**Location**: `/marketplace` page, left panel

**Features**:
- Natural language product search
- Sustainability score filtering
- Budget constraints
- Chain preference (Ethereum/Avalanche)
- Category filtering
- Real-time AI recommendations

**Usage**:
1. Connect wallet
2. Set preferences (sustainability score, budget, chain)
3. Enter search query (e.g., "sustainable laptop bag")
4. View AI-curated recommendations

### Pricing Optimizer

**Location**: `/marketplace` page, right panel

**Features**:
- Market analysis
- Competitor price comparison
- Sustainability premium calculation
- Cross-chain arbitrage opportunities
- Dynamic pricing suggestions

**Usage**:
1. Enter current product price
2. Click "Optimize Price"
3. Review AI suggestions and reasoning
4. Apply recommended pricing strategy

### Dispute Resolution

**Location**: `/marketplace` page, right panel

**Features**:
- Automated dispute analysis
- Evidence evaluation
- Fair resolution recommendations
- Percentage-based refund calculations
- Additional action suggestions

**Usage**:
1. Enter dispute details (order ID, parties, issue)
2. Add evidence items
3. Click "Analyze Dispute"
4. Review AI resolution recommendation

## Smart Contract Integration

### AIMarketplace.sol

**Location**: `packages/hardhat/contracts/AIMarketplace.sol`

**Features**:
- Chainlink Functions integration
- On-chain AI recommendation requests
- Decentralized dispute resolution
- Cross-chain compatibility

**Deployment**:
```bash
cd packages/hardhat
yarn deploy --network sepolia
```

## API Endpoints

### POST /api/ai/shopping
Request AI shopping recommendations.

**Request Body**:
```json
{
  "query": "sustainable electronics",
  "preferences": {
    "sustainabilityMin": 70,
    "budgetMax": 1000,
    "preferredChain": "ethereum",
    "categories": ["electronics"],
    "ethicalConcerns": ["fair-trade"]
  },
  "userId": "0x..."
}
```

### POST /api/ai/pricing
Get pricing optimization suggestions.

**Request Body**:
```json
{
  "productId": "product-123",
  "currentPrice": 99.99,
  "marketData": { "fearGreedIndex": 65 },
  "competitorPrices": [95, 105, 110]
}
```

### POST /api/ai/dispute
Analyze dispute and get resolution recommendation.

**Request Body**:
```json
{
  "orderId": "order-123",
  "buyer": "0x...",
  "seller": "0x...",
  "issue": "Product not received",
  "evidence": ["Tracking shows no delivery", "No seller response"]
}
```

## Error Handling

The integration includes comprehensive error handling:
- **AWS Credential Issues**: Falls back to mock data
- **Network Errors**: Graceful degradation
- **Rate Limiting**: Automatic retry logic
- **Invalid Responses**: Error messages to users

## Cost Optimization

- Uses Claude Haiku model for cost efficiency
- Implements request caching where appropriate
- Provides mock responses during development
- Monitors usage through CloudWatch

## Testing

Run the integration tests:
```bash
# Note: Test script needs to be added to package.json
npm test __tests__/bedrock.test.ts
```

## Development Mode

When AWS credentials are not configured, the system automatically falls back to mock data, allowing development without AWS setup.

## Production Deployment

1. Configure AWS credentials in production environment
2. Set up CloudWatch monitoring
3. Configure rate limiting
4. Enable request logging
5. Set up cost alerts

## Troubleshooting

### Common Issues

1. **"AWS credentials not found"**
   - Check `.env.local` file
   - Verify AWS IAM permissions

2. **"Model not available"**
   - Enable Claude models in Bedrock console
   - Check region configuration

3. **"Rate limit exceeded"**
   - Implement request throttling
   - Consider upgrading AWS plan

### Support

For issues with the Bedrock integration, check:
1. AWS CloudWatch logs
2. Next.js console output
3. Browser developer tools
4. Network tab for API calls

## Future Enhancements

- Multi-language support
- Advanced ML model fine-tuning
- Real-time price monitoring
- Automated dispute resolution execution
- Integration with additional AI providers
