#!/bin/bash

# Frontend build script
echo "Building Frontend..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the app
echo "Building React app..."
npm run build

echo "Frontend build completed!"
