#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd server
npx prisma generate
cd ..

# Build client
echo "🏗️ Building client..."
cd client
npm run build
cd ..

echo "✅ Deployment ready!"
