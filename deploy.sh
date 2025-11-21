#!/bin/bash

# Deployment Script for Blog Website
# This script automates the deployment process
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please create a .env file with your production environment variables."
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --production

# Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npx prisma generate

# Push database schema (if needed)
echo -e "${YELLOW}🗄️  Pushing database schema...${NC}"
npx prisma db push --skip-generate

# Build the application
echo -e "${YELLOW}🏗️  Building application...${NC}"
npm run build

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found. Installing PM2...${NC}"
    npm install -g pm2
fi

# Restart application with PM2
echo -e "${YELLOW}🔄 Restarting application...${NC}"
pm2 restart blog-website || pm2 start npm --name "blog-website" -- start

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}📊 Check status with: pm2 status${NC}"
echo -e "${GREEN}📝 View logs with: pm2 logs blog-website${NC}"


