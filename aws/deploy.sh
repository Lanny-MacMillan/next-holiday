#!/bin/bash

# Deploy Next Holiday Serverless Infrastructure
# Usage: ./deploy.sh [environment] [database-password] [auth0-domain] [auth0-audience]

set -e

ENVIRONMENT=${1:-dev}
DB_PASSWORD=${2}
AUTH0_DOMAIN=${3}
AUTH0_AUDIENCE=${4}

if [ -z "$DB_PASSWORD" ] || [ -z "$AUTH0_DOMAIN" ] || [ -z "$AUTH0_AUDIENCE" ]; then
    echo "Usage: ./deploy.sh [environment] [database-password] [auth0-domain] [auth0-audience]"
    echo "Example: ./deploy.sh dev MySecurePassword123! myapp.auth0.com https://myapp.api"
    exit 1
fi

STACK_NAME="next-holiday-${ENVIRONMENT}"
REGION="us-east-1"  # Change to your preferred region

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Step 1: Deploy CloudFormation stack
echo "📦 Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file aws/infrastructure.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        Environment=$ENVIRONMENT \
        DatabasePassword=$DB_PASSWORD \
        Auth0Domain=$AUTH0_DOMAIN \
        Auth0Audience=$AUTH0_AUDIENCE \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

echo "✅ Infrastructure deployed successfully"

# Step 2: Get stack outputs
echo "📊 Getting stack outputs..."
API_GATEWAY_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`APIGatewayURL`].OutputValue' \
    --output text)

LAMBDA_FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
    --output text)

DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text)

echo "API Gateway URL: $API_GATEWAY_URL"
echo "Lambda Function: $LAMBDA_FUNCTION_NAME"
echo "Database Endpoint: $DB_ENDPOINT"

# Step 3: Build and deploy Lambda function
echo "🔨 Building Lambda function..."
cd lambda

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
zip -r function.zip dist/ node_modules/ -x "node_modules/.prisma/client/libquery_engine-*" "node_modules/@prisma/engines/*"

# Update Lambda function
echo "🚀 Deploying Lambda function..."
aws lambda update-function-code \
    --function-name $LAMBDA_FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION

# Wait for function to be updated
aws lambda wait function-updated \
    --function-name $LAMBDA_FUNCTION_NAME \
    --region $REGION

echo "✅ Lambda function deployed successfully"

# Step 4: Run database migrations
echo "🗄️ Running database migrations..."
DATABASE_URL="mysql://admin:${DB_PASSWORD}@${DB_ENDPOINT}:3306/nextholiday"
export DATABASE_URL

# Wait for RDS to be available (it might take a few minutes)
echo "⏳ Waiting for database to be available..."
sleep 30

# Run Prisma migrations
npx prisma migrate deploy

echo "✅ Database migrations completed"

# Cleanup
rm -f function.zip
cd ..

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "Environment: $ENVIRONMENT"
echo "API Gateway URL: $API_GATEWAY_URL"
echo "Lambda Function: $LAMBDA_FUNCTION_NAME"
echo ""
echo "🔧 Next steps:"
echo "1. Update your frontend to use the new API Gateway URL"
echo "2. Test the API endpoints"
echo "3. Monitor CloudWatch logs for any issues"
echo ""
echo "📝 CloudWatch Logs:"
echo "aws logs tail /aws/lambda/$LAMBDA_FUNCTION_NAME --follow"