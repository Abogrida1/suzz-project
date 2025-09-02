#!/bin/bash

# Build script for Secure Chat App
echo "Building Secure Chat App..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install --production
cd ..

# Build frontend with environment variables
echo "Building frontend..."
cd frontend
export REACT_APP_SERVER_URL=https://suzz-project-5.onrender.com
export REACT_APP_APP_NAME="Secure Chat App"
export PUBLIC_URL=.
npm install
npm run build
cd ..

echo "Build completed successfully!"
