#!/bin/bash

# Academic Hub - Quick Deployment Script
# This script helps deploy the application with minimal configuration

echo "🎓 Academic Hub - Quick Deployment"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Check for environment file
if [ ! -f ".env.local" ]; then
    echo "⚠️  No .env.local file found. Creating from example..."
    cp .env.example .env.local
    echo "📝 Please edit .env.local with your Supabase credentials before continuing"
    echo "   You can find these in your Supabase project dashboard"
    read -p "Press Enter after you've updated .env.local..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check for errors above"
    exit 1
fi

echo "✅ Build successful!"

# Ask deployment preference
echo ""
echo "🚀 Choose deployment option:"
echo "1) Local development server"
echo "2) Deploy to Vercel (recommended)"
echo "3) Export static files"

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🏃 Starting local development server..."
        echo "Visit http://localhost:3000 when ready"
        npm run dev
        ;;
    2)
        if ! command_exists vercel; then
            echo "📦 Installing Vercel CLI..."
            npm install -g vercel
        fi
        echo "🚀 Deploying to Vercel..."
        vercel --prod
        ;;
    3)
        echo "📁 Exporting static files..."
        npm run export
        echo "✅ Static files exported to 'out' directory"
        ;;
    *)
        echo "❌ Invalid choice. Starting local server..."
        npm run dev
        ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Test the application functionality"
echo "   2. Configure additional services if needed (see DEPLOYMENT.md)"
echo "   3. Set up monitoring and backups"
echo ""
echo "📖 For detailed deployment options, see DEPLOYMENT.md"
echo "🐛 For issues, check the troubleshooting section in DEPLOYMENT.md"
