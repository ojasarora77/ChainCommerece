# 🤖 AWS Bedrock Agent Setup Guide

This guide will help you set up a real AWS Bedrock Agent for your autonomous shopping assistant.

## 📋 Prerequisites

### 1. AWS Account Setup
- AWS account with Bedrock access
- AWS CLI configured or environment variables set
- Bedrock model access enabled (Claude 3 Sonnet)

### 2. Required Permissions
Your AWS user/role needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PassRole",
        "lambda:CreateFunction",
        "lambda:InvokeFunction"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🚀 Quick Setup (Automated)

### Step 1: Install Dependencies
```bash
cd packages/nextjs
npm install @aws-sdk/client-bedrock-agent
```

### Step 2: Set Environment Variables
Make sure your `.env` file has:
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### Step 3: Run Setup Script
```bash
node scripts/setup-bedrock-agent.js
```

## 🔧 Manual Setup (Step by Step)

If you prefer manual setup or the script fails:

### 1. Enable Bedrock Model Access

1. Go to AWS Bedrock Console
2. Navigate to "Model access" in the left sidebar
3. Click "Enable specific models"
4. Enable: **Anthropic Claude 3 Sonnet**
5. Wait for approval (usually instant)

### 2. Create IAM Role for Agent

Create an IAM role with this trust policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Attach this policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "lambda:InvokeFunction"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3. Create Lambda Function (Function Executor)

Create a Lambda function to handle agent function calls:

```javascript
// Lambda function code
exports.handler = async (event) => {
  console.log('Agent function call:', JSON.stringify(event, null, 2));
  
  const { function: functionName, parameters } = event;
  
  // Call your Next.js API endpoint
  const response = await fetch('https://your-domain.com/api/ai/agent-functions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ function: functionName, parameters })
  });
  
  const result = await response.json();
  
  return {
    statusCode: 200,
    body: result
  };
};
```

### 4. Create Bedrock Agent

1. Go to AWS Bedrock Console
2. Click "Agents" in the left sidebar
3. Click "Create Agent"
4. Fill in:
   - **Agent name**: `autonomous-shopping-agent`
   - **Description**: `AI agent for autonomous shopping`
   - **Foundation model**: `Anthropic Claude 3 Sonnet`
   - **Instructions**: Copy from the setup script

### 5. Add Action Group

1. In your agent, click "Add Action Group"
2. Fill in:
   - **Action group name**: `shopping-functions`
   - **Description**: `Functions for shopping operations`
   - **Lambda function**: Select your Lambda function
3. Add function schemas (copy from setup script)

### 6. Create Agent Alias

1. Click "Create Alias"
2. Name: `production`
3. Description: `Production alias`

### 7. Update Environment Variables

Add to your `.env` file:
```bash
BEDROCK_AGENT_ID=your_agent_id
BEDROCK_AGENT_ALIAS_ID=your_alias_id
```

## 🧪 Testing the Setup

### 1. Test Agent Response
```bash
# Test the agent directly
curl -X POST http://localhost:3001/api/ai/autonomous-agent \
  -H "Content-Type: application/json" \
  -d '{"message": "Find sustainable electronics under $100"}'
```

### 2. Check Agent Logs
- Go to AWS Bedrock Console
- Click on your agent
- Check "Invocation logs" for debugging

### 3. Monitor Function Calls
- Check Lambda function logs in CloudWatch
- Verify function calls are reaching your API

## 🔍 Troubleshooting

### Common Issues:

**1. "Model access denied"**
- Solution: Enable Claude 3 Sonnet in Bedrock model access

**2. "Agent not found"**
- Solution: Check BEDROCK_AGENT_ID in .env file

**3. "Function execution failed"**
- Solution: Check Lambda function logs and API endpoint

**4. "Permission denied"**
- Solution: Verify IAM role has correct permissions

### Debug Mode:
Set this in your `.env` for detailed logging:
```bash
BEDROCK_DEBUG=true
```

## 📊 Cost Estimation

**AWS Bedrock Agent costs:**
- Agent invocations: ~$0.002 per request
- Claude 3 Sonnet: ~$0.003 per 1K input tokens
- Lambda executions: ~$0.0000002 per request

**Estimated monthly cost for development:** $5-20

## 🎯 Next Steps

Once setup is complete:

1. **Test the agent** in your marketplace
2. **Monitor performance** in AWS Console
3. **Optimize prompts** based on usage
4. **Scale up** for production use

## 🆘 Need Help?

If you encounter issues:
1. Check AWS Bedrock documentation
2. Verify all environment variables
3. Test each component individually
4. Check CloudWatch logs for errors

---

**Ready to proceed?** Run the setup script or follow the manual steps above! 🚀
