#!/bin/bash

# Persevex Resume Maker - Build Script
# This script builds the frontend and prepares the backend

set -e

echo "🔨 Building Persevex Resume Maker..."

# Build frontend
echo "🎨 Building frontend..."
npm --prefix client install
npm --prefix client run build

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm --prefix server install

echo "✅ Build complete!"
echo "Run 'npm --prefix server start' to start the application"
