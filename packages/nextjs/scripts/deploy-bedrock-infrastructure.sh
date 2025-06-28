#!/bin/bash

# Deploy AWS Infrastructure for AI Marketplace Bedrock Agent
# This script deploys the CloudFormation stack and updates the Lambda function

set -e

# Configuration
PROJECT_NAME="ai-marketplace"
ENVIRONMENT="dev"
REGION="us-east-1"
STACK_NAME="${PROJECT_NAME}-bedrock-${ENVIRONMENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying AI Marketplace Bedrock Infrastructure${NC}"
echo "=================================================="
echo "Project: $PROJECT_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Stack: $STACK_NAME"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Deploy CloudFormation stack
echo -e "${YELLOW}📦 Deploying CloudFormation stack...${NC}"

aws cloudformation deploy \
    --template-file aws/bedrock-infrastructure.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        ProjectName=$PROJECT_NAME \
        Environment=$ENVIRONMENT \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CloudFormation stack deployed successfully${NC}"
else
    echo -e "${RED}❌ CloudFormation deployment failed${NC}"
    exit 1
fi

# Get stack outputs
echo -e "${YELLOW}📋 Getting stack outputs...${NC}"

LAMBDA_FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
    --output text)

ORDERS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`OrdersTableName`].OutputValue' \
    --output text)

ANALYTICS_TABLE=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`AnalyticsTableName`].OutputValue' \
    --output text)

CACHE_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`CacheBucketName`].OutputValue' \
    --output text)

echo "Lambda Function: $LAMBDA_FUNCTION_NAME"
echo "Orders Table: $ORDERS_TABLE"
echo "Analytics Table: $ANALYTICS_TABLE"
echo "Cache Bucket: $CACHE_BUCKET"

# Package and deploy Lambda function
echo -e "${YELLOW}📦 Packaging Lambda function...${NC}"

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
cp lambda/bedrock-agent-functions.js $TEMP_DIR/index.js

# Create package.json for dependencies
cat > $TEMP_DIR/package.json << EOF
{
  "name": "bedrock-agent-functions",
  "version": "1.0.0",
  "description": "AWS Bedrock Agent Functions for AI Marketplace",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1000.0"
  }
}
EOF

# Install dependencies and create zip
cd $TEMP_DIR
npm install --production
zip -r function.zip .

# Update Lambda function
echo -e "${YELLOW}🚀 Updating Lambda function code...${NC}"

aws lambda update-function-code \
    --function-name $LAMBDA_FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Lambda function updated successfully${NC}"
else
    echo -e "${RED}❌ Lambda function update failed${NC}"
    exit 1
fi

# Clean up
cd - > /dev/null
rm -rf $TEMP_DIR

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Go to AWS Bedrock Console: https://console.aws.amazon.com/bedrock/"
echo "2. Navigate to your agent: autonomous-shopping-agent"
echo "3. Add Action Group with these details:"
echo "   - Name: shopping-functions"
echo "   - Lambda Function: $LAMBDA_FUNCTION_NAME"
echo "   - Functions: searchProducts, createOrder, processPayment, getUserRecommendations"
echo "4. Prepare the agent to activate changes"
echo "5. Test the enhanced functionality!"
echo ""
echo -e "${YELLOW}💡 Environment Variables for your .env file:${NC}"
echo "ORDERS_TABLE=$ORDERS_TABLE"
echo "ANALYTICS_TABLE=$ANALYTICS_TABLE"
echo "CACHE_BUCKET=$CACHE_BUCKET"
echo ""
echo -e "${GREEN}✨ Your enhanced Bedrock agent is ready!${NC}"
