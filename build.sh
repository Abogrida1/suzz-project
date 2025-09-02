#!/bin/bash

# Build script for Secure Chat App
echo "Building Secure Chat App..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install --production
cd ..

# Install frontend dependencies and build
echo "Installing frontend dependencies and building..."
cd frontend
npm install
npm run build
cd ..

echo "Build completed successfully!"
