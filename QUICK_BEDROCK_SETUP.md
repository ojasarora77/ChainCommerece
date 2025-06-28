# 🚀 Quick AWS Bedrock Agent Setup

Let's get your real Bedrock Agent running in 10 minutes!

## ✅ Prerequisites (Already Done!)
- ✅ AWS credentials configured
- ✅ Region: eu-west-2
- ✅ AWS SDK installed

## 🎯 Step-by-Step Setup

### Step 1: Enable Claude 3 Sonnet (2 minutes)

1. **Open AWS Bedrock Console**: 
   ```
   https://eu-west-2.console.aws.amazon.com/bedrock/home?region=eu-west-2#/modelaccess
   ```

2. **Click "Enable specific models"**

3. **Find "Anthropic Claude 3 Sonnet"** and check the box

4. **Click "Submit"** - Usually approved instantly

5. **Wait for status to show "Access granted"**

### Step 2: Create IAM Role (3 minutes)

1. **Go to IAM Console**:
   ```
   https://console.aws.amazon.com/iam/home?region=eu-west-2#/roles
   ```

2. **Click "Create role"**

3. **Select "AWS service"** → **"Bedrock"** → **"Bedrock - Agent"**

4. **Click "Next"** (permissions are auto-attached)

5. **Role name**: `AmazonBedrockExecutionRoleForAgents_shopping`

6. **Click "Create role"**

7. **Copy the Role ARN** (you'll need this)

### Step 3: Create Bedrock Agent (5 minutes)

1. **Go to Bedrock Agents Console**:
   ```
   https://eu-west-2.console.aws.amazon.com/bedrock/home?region=eu-west-2#/agents
   ```

2. **Click "Create Agent"**

3. **Fill in details**:
   - **Agent name**: `autonomous-shopping-agent`
   - **Description**: `AI agent for autonomous shopping`
   - **Agent resource role**: Select the role you just created
   - **Foundation model**: `Anthropic Claude 3 Sonnet`

4. **Agent instructions** (copy this):
   ```
   You are an autonomous AI shopping assistant for a sustainable blockchain marketplace. 

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

   WORKFLOW:
   1. SEARCH: When users ask about products, use searchProducts function
   2. DETAILS: Provide comprehensive product information
   3. ORDER: When users want to buy, use createOrder function
   4. PAYMENT: Process payments using processPayment function
   5. FOLLOW-UP: Check order status and provide updates

   RULES:
   - Always confirm details before processing payments
   - Explain sustainability scores and certifications
   - Be transparent about blockchain transaction fees
   - Prioritize products with high sustainability scores (80%+)
   ```

5. **Click "Create"**

### Step 4: Add Action Group (Skip for Now)

For the hackathon demo, we'll use the agent without action groups first. The agent will work with natural language responses.

### Step 5: Create Agent Alias

1. **In your agent, click "Create Alias"**

2. **Alias name**: `production`

3. **Description**: `Production alias for shopping agent`

4. **Click "Create"**

### Step 6: Update Environment Variables

1. **Copy your Agent ID** (from the agent details page)

2. **Copy your Agent Alias ID** (from the alias you just created)

3. **Update your .env file**:
   ```bash
   BEDROCK_AGENT_ID=ABCD123456
   BEDROCK_AGENT_ALIAS_ID=EFGH789012
   ```

## 🧪 Test Your Setup

### Option 1: Use the Checker Script
```bash
node scripts/check-bedrock-setup.js
```

### Option 2: Test in Browser
1. Go to http://localhost:3001/marketplace
2. Click "Shopping Assistant" → "Autonomous Agent"
3. Try: "Find sustainable electronics under $100"

## 🎯 Expected Results

✅ **Working**: Agent responds with natural language
✅ **Working**: Agent understands shopping requests
✅ **Working**: Agent provides helpful responses

❌ **Not yet**: Function calling (requires Lambda setup)
❌ **Not yet**: Real order processing (requires action groups)

## 🚀 Quick Test Commands

Test the agent directly:
```bash
# Test 1: Basic conversation
curl -X POST http://localhost:3001/api/ai/autonomous-agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, can you help me find products?"}'

# Test 2: Product search
curl -X POST http://localhost:3001/api/ai/autonomous-agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Find sustainable electronics under $100"}'
```

## 🔧 Troubleshooting

### "Model access denied"
- Go back to Step 1 and enable Claude 3 Sonnet

### "Agent not found" 
- Check your Agent ID in .env file
- Make sure you're in the eu-west-2 region

### "Permission denied"
- Check your IAM role has Bedrock permissions
- Verify your AWS credentials

### "Still using mock responses"
- Restart your Next.js server after updating .env
- Check the console logs for "Real Bedrock Agent" vs "Using mock responses"

## 🎉 Success Indicators

When working correctly, you'll see in the console:
```
🤖 Real Bedrock Agent: Processing "your message"
✅ Real Agent Response: {...}
```

Instead of:
```
🎭 Using mock responses (Bedrock Agent not configured)
```

---

**Ready to start?** Begin with Step 1 and work through each step! 🚀

The whole process should take about 10 minutes, and you'll have a real AWS Bedrock Agent powering your autonomous shopping assistant!
