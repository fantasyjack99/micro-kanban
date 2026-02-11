#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install --prefer-offline --no-audit

# Install server dependencies using --prefix
echo "📦 Installing server dependencies..."
npm install --prefix server --prefer-offline --no-audit

# Install client dependencies using --prefix
echo "📦 Installing client dependencies..."
npm install --prefix client --prefer-offline --no-audit

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd server && npx prisma generate && cd ..

# Build client
echo "🏗️ Building client..."
cd client && npm run build && cd ..

echo "✅ Deployment ready!"
