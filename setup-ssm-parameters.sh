#!/bin/bash

# Script to set up SSM parameters for both dev and production environments
# Usage: ./setup-ssm-parameters.sh [dev|prod]

ENV=${1:-dev}
REGION=${AWS_REGION:-us-east-1}

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
  echo "Invalid environment. Use 'dev' or 'prod'"
  exit 1
fi

echo "Setting up SSM parameters for $ENV environment in region $REGION"

# Ask for the required values (in a real scenario, these would be managed securely)
read -p "Enter Azure Computer Vision Endpoint: " AZURE_CV_ENDPOINT
read -sp "Enter Azure Computer Vision Key: " AZURE_CV_KEY
echo
read -sp "Enter OpenAI API Key: " OPENAI_API_KEY
echo
read -p "Enter Supabase Project URL (e.g., https://yourproject.supabase.co): " SUPABASE_URL
echo

# Derive Supabase JWT issuer and JWK URI
SUPABASE_JWT_ISSUER="$SUPABASE_URL"
SUPABASE_JWK_URI="${SUPABASE_URL}/.well-known/jwks.json"

# Create SSM parameters
aws ssm put-parameter --name "/docproc/$ENV/azure-cv-endpoint" \
  --value "$AZURE_CV_ENDPOINT" \
  --type "String" \
  --overwrite \
  --region $REGION

aws ssm put-parameter --name "/docproc/$ENV/azure-cv-key" \
  --value "$AZURE_CV_KEY" \
  --type "SecureString" \
  --overwrite \
  --region $REGION

aws ssm put-parameter --name "/docproc/$ENV/openai-api-key" \
  --value "$OPENAI_API_KEY" \
  --type "SecureString" \
  --overwrite \
  --region $REGION

aws ssm put-parameter --name "/docproc/$ENV/supabase-jwt-issuer" \
  --value "$SUPABASE_JWT_ISSUER" \
  --type "String" \
  --overwrite \
  --region $REGION

aws ssm put-parameter --name "/docproc/$ENV/supabase-jwk-uri" \
  --value "$SUPABASE_JWK_URI" \
  --type "String" \
  --overwrite \
  --region $REGION

echo "SSM parameters for $ENV environment have been set up successfully."
