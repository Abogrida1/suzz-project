#!/bin/bash

# Build script for Secure Chat App
echo "Building Secure Chat App..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install --production
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Build completed successfully!"
