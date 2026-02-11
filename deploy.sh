#!/bin/bash

# Simple and fast deploy script
# Only install what's absolutely needed

echo "🚀 Building..."

# Install server deps
cd server && npm install --production && cd ..

# Generate Prisma
cd server && npx prisma generate && cd ..

# Build client
cd client && npm run build && cd ..

echo "✅ Done!"
