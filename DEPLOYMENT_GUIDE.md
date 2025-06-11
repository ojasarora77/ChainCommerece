# 🚀 Chromion Deployment Guide

## Quick Start (5 minutes)

### 1. Clone and Install
```bash
git clone https://github.com/ojasarora77/ai-marketplace.git
cd ai-marketplace
yarn install
```

### 2. Start Development Server
```bash
cd packages/nextjs
yarn start
```

### 3. View AI Marketplace
Open `http://localhost:3000/marketplace` to see the complete Amazon Bedrock integration working with mock data.

## 🤖 Enable Real AI (30 minutes)

### Step 1: AWS Account Setup
1. Create AWS account at https://aws.amazon.com
2. Navigate to Amazon Bedrock console
3. Request access to Claude models (usually instant approval)

### Step 2: Create IAM User
1. Go to IAM console → Users → Create User
2. Attach policy with Bedrock permissions:
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
3. Generate Access Key and Secret

### Step 3: Configure Environment
Update `packages/nextjs/.env.local`:
```bash
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
```

### Step 4: Test Real AI
1. Restart development server: `yarn start`
2. Visit marketplace and try AI Shopping Assistant
3. Real Claude AI responses will replace mock data

## 🔗 Deploy Smart Contracts (1 hour)

### Step 1: Chainlink Functions Setup
1. Visit https://functions.chain.link
2. Create subscription and fund with LINK
3. Note subscription ID

### Step 2: Deploy Contracts
```bash
cd packages/hardhat

# Deploy to Sepolia testnet
yarn deploy --network sepolia

# Deploy to Avalanche Fuji
yarn deploy --network avalancheFuji
```

### Step 3: Configure Contract
```bash
# Add consumer to Chainlink subscription
# Set subscription ID in contract
# Set DON ID for your network
```

## 🌐 Production Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd packages/nextjs
vercel --prod
```

### Environment Variables
Set in Vercel dashboard:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `BEDROCK_AGENT_ID` (optional)
- `CHAINLINK_SUBSCRIPTION_ID`

## 🧪 Testing Checklist

### Frontend Tests
- [ ] AI Shopping Assistant loads
- [ ] Search returns recommendations
- [ ] Pricing Optimizer works
- [ ] Dispute Resolution analyzes cases
- [ ] All loading states work
- [ ] Error handling graceful

### Smart Contract Tests
- [ ] Contract deploys successfully
- [ ] Chainlink Functions requests work
- [ ] AI responses stored on-chain
- [ ] Events emitted correctly

### Integration Tests
- [ ] API endpoints respond
- [ ] AWS Bedrock calls succeed
- [ ] Mock data fallbacks work
- [ ] Cross-chain functionality

## 🎯 Demo Preparation

### For Hackathon Demo
1. **Prepare AWS credentials** (real AI responses)
2. **Deploy to testnet** (on-chain functionality)
3. **Test all features** (end-to-end flow)
4. **Prepare fallbacks** (mock data if AWS fails)

### Demo Script
1. **Show AI Shopping Assistant**
   - Natural language search
   - Sustainability filtering
   - Real-time recommendations

2. **Demonstrate Pricing Optimizer**
   - Market analysis
   - Dynamic pricing suggestions
   - Competitiveness scoring

3. **Display Dispute Resolution**
   - Evidence analysis
   - Fair resolution recommendations
   - Automated decision making

4. **Smart Contract Integration**
   - On-chain AI requests
   - Chainlink Functions calls
   - Cross-chain compatibility

## 🔧 Troubleshooting

### Common Issues

**"AWS credentials not found"**
- Check `.env.local` file exists
- Verify credentials are correct
- Ensure IAM permissions set

**"Model not available"**
- Enable Claude models in Bedrock console
- Check region (us-east-1 recommended)
- Verify account has Bedrock access

**"Chainlink Functions failed"**
- Check subscription has LINK balance
- Verify consumer added to subscription
- Ensure DON ID is correct for network

**"Development server won't start"**
- Run `yarn install` in root directory
- Check Node.js version (18+ required)
- Clear cache: `yarn cache clean`

### Support Resources
- **AWS Bedrock Docs**: https://docs.aws.amazon.com/bedrock/
- **Chainlink Functions**: https://docs.chain.link/chainlink-functions
- **Scaffold-ETH 2**: https://docs.scaffoldeth.io/

## 📊 Monitoring

### AWS CloudWatch
- Monitor Bedrock API calls
- Track costs and usage
- Set up billing alerts

### Chainlink Functions
- Monitor request success rate
- Track LINK consumption
- Check response times

### Application Metrics
- User engagement with AI features
- Recommendation accuracy
- Dispute resolution effectiveness

---

**🎉 Your AI-powered decentralized marketplace is ready!**

For questions or issues, check the comprehensive documentation in `packages/nextjs/BEDROCK_INTEGRATION.md`
