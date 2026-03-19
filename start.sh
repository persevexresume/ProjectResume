#!/bin/bash

# Persevex Resume Maker - Production Start Script
# Dependencies are installed automatically by the platform during build phase
# This script only handles starting the services

set -e

echo "🚀 Starting Persevex Resume Maker..."

# Start the Node.js backend server
echo "🌐 Starting backend server..."
cd server
npm start
