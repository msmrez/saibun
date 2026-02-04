#!/bin/bash

# Saibun Deployment Script
# Usage: ./deploy.sh
# Run from the project root directory (/root/saibun or wherever you cloned it)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="$(pwd)"
TARGET_DIR="/var/www/saibun.io"
SERVICE_NAME="saibun"

echo -e "${GREEN}🚀 Starting Saibun deployment...${NC}"
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DIR"
echo ""

# Step 1: Git pull
echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
git pull
echo ""

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install
echo ""

# Step 3: Build
echo -e "${YELLOW}🔨 Building application...${NC}"
pnpm build
echo ""

# Step 4: Verify build output exists
if [ ! -d ".next/standalone" ]; then
    echo -e "${RED}❌ Error: .next/standalone directory not found!${NC}"
    echo "Make sure next.config.mjs has 'output: standalone' configured."
    exit 1
fi

if [ ! -d ".next/static" ]; then
    echo -e "${RED}❌ Error: .next/static directory not found!${NC}"
    exit 1
fi

# Step 5: Create target directory if it doesn't exist
echo -e "${YELLOW}📁 Preparing target directory...${NC}"
sudo mkdir -p "$TARGET_DIR"
sudo mkdir -p "$TARGET_DIR/.next"
echo ""

# Step 6: Copy standalone server (this includes the server.js)
echo -e "${YELLOW}📋 Copying standalone server...${NC}"
sudo rm -rf "$TARGET_DIR/.next/standalone"
sudo cp -r "$SOURCE_DIR/.next/standalone" "$TARGET_DIR/.next/"
echo ""

# Step 7: Copy static assets (critical for Next.js)
echo -e "${YELLOW}📋 Copying static assets...${NC}"
sudo rm -rf "$TARGET_DIR/.next/static"
sudo cp -r "$SOURCE_DIR/.next/static" "$TARGET_DIR/.next/"
echo ""

# Step 8: Copy public directory (for logo.png and other public assets)
echo -e "${YELLOW}📋 Copying public assets...${NC}"
sudo rm -rf "$TARGET_DIR/public"
sudo cp -r "$SOURCE_DIR/public" "$TARGET_DIR/"
echo ""

# Step 9: Ensure standalone can access static files
# Next.js standalone expects static files relative to the standalone directory
echo -e "${YELLOW}📋 Setting up static file symlinks...${NC}"
if [ ! -L "$TARGET_DIR/.next/standalone/.next/static" ]; then
    sudo ln -sf "$TARGET_DIR/.next/static" "$TARGET_DIR/.next/standalone/.next/static" 2>/dev/null || true
fi
if [ ! -L "$TARGET_DIR/.next/standalone/public" ]; then
    sudo ln -sf "$TARGET_DIR/public" "$TARGET_DIR/.next/standalone/public" 2>/dev/null || true
fi
echo ""

# Step 10: Copy package.json (needed for standalone)
echo -e "${YELLOW}📋 Copying package.json...${NC}"
sudo cp "$SOURCE_DIR/package.json" "$TARGET_DIR/"
echo ""

# Step 11: Set permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
sudo chown -R www-data:www-data "$TARGET_DIR"
sudo chmod -R 755 "$TARGET_DIR"
echo ""

# Step 12: Restart service
echo -e "${YELLOW}🔄 Restarting service...${NC}"
sudo systemctl restart "$SERVICE_NAME"
echo ""

# Step 13: Check service status
echo -e "${YELLOW}📊 Checking service status...${NC}"
sleep 2
if sudo systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}✅ Service is running!${NC}"
else
    echo -e "${RED}❌ Service failed to start!${NC}"
    echo "Check logs with: sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Deployment complete!${NC}"
echo "Visit: https://saibun.io"
echo ""
echo "To view logs: sudo journalctl -u $SERVICE_NAME -f"
