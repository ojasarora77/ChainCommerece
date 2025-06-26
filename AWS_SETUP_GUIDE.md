# 🚀 AWS Bedrock Setup Guide for ChainCommerce

## Step 1: Create AWS Account (5 minutes)

### 1.1 Sign Up for AWS
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Enter your email and choose account name
4. Verify email and set password
5. Add payment method (required, but we'll use free tier)
6. Verify phone number
7. Choose "Basic Support Plan" (free)

### 1.2 Sign In to AWS Console
1. Go to https://console.aws.amazon.com
2. Sign in with your new account
3. You should see the AWS Management Console

## Step 2: Enable Amazon Bedrock (10 minutes)

### 2.1 Navigate to Bedrock
1. In AWS Console, search for "Bedrock" in the top search bar
2. Click on "Amazon Bedrock"
3. You'll see the Bedrock dashboard

### 2.2 Request Model Access
1. In Bedrock console, click "Model access" in left sidebar
2. Click "Request model access" button
3. Select these models (check the boxes):
   - ✅ **Amazon Titan Text Express** (recommended primary)
   - ✅ **Anthropic Claude 3 Haiku** (for advanced reasoning)
   - ✅ **Mistral 7B Instruct** (for multilingual)
   - ✅ **Amazon Nova Lite** (NEW - for multimodal)
   - ✅ **Amazon Nova Pro** (NEW - for advanced multimodal)

4. Click "Request model access"
5. **Status should show "Access granted"** (usually instant)

### 2.3 Verify Model Access
1. Go to "Playgrounds" → "Chat"
2. Select "Titan Text Express" from dropdown
3. Type "Hello, test message"
4. If you get a response, models are working! ✅

## Step 3: Create IAM User for Your App (10 minutes)

### 3.1 Navigate to IAM
1. Search for "IAM" in AWS Console
2. Click on "IAM" service
3. Click "Users" in left sidebar
4. Click "Create user"

### 3.2 Create User
1. **User name**: `chaincommerce-bedrock-user`
2. **Access type**: Select "Programmatic access"
3. Click "Next"

### 3.3 Set Permissions
1. Click "Attach policies directly"
2. Search for "bedrock" in the policy search
3. Select these policies:
   - ✅ `AmazonBedrockFullAccess`
   - ✅ `AmazonBedrockAgentFullAccess` (for agents)

4. Click "Next" → "Create user"

### 3.4 Get Your Credentials
**⚠️ IMPORTANT: Save these immediately - you won't see them again!**

1. After user creation, you'll see:
   - **Access Key ID**: `AKIA...` (copy this)
   - **Secret Access Key**: `...` (copy this)

2. **Save both values securely** - you'll need them for your app

## Step 4: Configure Your Project (5 minutes)

### 4.1 Create Environment File
```bash
# In your project directory
cd packages/nextjs
cp .env.example .env.local
```

### 4.2 Add Your Credentials
Open `packages/nextjs/.env.local` and replace:

```bash
# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=your_actual_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_actual_secret_access_key_here
AWS_REGION=us-east-1
```

### 4.3 Test Your Setup
```bash
# Start your development server
yarn start

# Visit http://localhost:3000/api/test-aws
# You should see: "AWS Bedrock connection successful!"
```

## Step 5: Test Your AI Features (5 minutes)

### 5.1 Test AI Shopping Assistant
1. Go to `http://localhost:3000/marketplace`
2. Try the AI Shopping Assistant
3. Search for "sustainable electronics"
4. You should get **real AI responses** instead of mock data! 🎉

### 5.2 Test Other Features
- **Pricing Optimizer**: Should give real market analysis
- **Dispute Resolution**: Should provide actual AI analysis

## 🎯 Troubleshooting

### Common Issues:

**1. "Access Denied" Error**
- Check IAM permissions are correct
- Verify model access is granted in Bedrock console

**2. "Model not available"**
- Ensure you requested access to the models
- Check you're using the correct region (us-east-1)

**3. "Invalid credentials"**
- Double-check Access Key ID and Secret Key
- Ensure no extra spaces in .env.local file

## 🚀 You're Ready!

Once you complete these steps, your AI marketplace will have:
- ✅ Real AI-powered product recommendations
- ✅ Actual market analysis for pricing
- ✅ Genuine dispute resolution with AI
- ✅ Production-ready responses for demos

**Total Setup Time**: ~30 minutes
**Total Cost for Hackathon**: ~$0.40 - $1.00

Your project is now ready to showcase real AI capabilities! 🎉
