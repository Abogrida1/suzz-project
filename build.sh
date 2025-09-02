#!/bin/bash

# Build script for Secure Chat App
echo "Building Secure Chat App..."

# Set environment variables for frontend build
export REACT_APP_SERVER_URL=${REACT_APP_SERVER_URL:-https://suzz-project-5.onrender.com}
export REACT_APP_APP_NAME=${REACT_APP_APP_NAME:-Secure Chat App}

echo "Environment variables set:"
echo "REACT_APP_SERVER_URL=$REACT_APP_SERVER_URL"
echo "REACT_APP_APP_NAME=$REACT_APP_APP_NAME"

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install and build frontend FIRST
echo "Installing frontend dependencies and building..."
cd frontend
npm install
echo "Building frontend with environment variables..."
npm run build
echo "Frontend build completed successfully!"
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install --production
cd ..

echo "Build completed successfully!"
