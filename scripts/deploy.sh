#!/bin/bash

# Academic Hub Deployment Script

set -e

echo "🚀 Starting Academic Hub deployment..."

# Check if environment file exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    exit 1
fi

# Load environment variables
source .env.production

# Build and deploy with Docker Compose
echo "📦 Building containers..."
docker-compose -f docker-compose.prod.yml build

echo "🔄 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend npm run migrate

echo "🌱 Seeding database..."
docker-compose -f docker-compose.prod.yml run --rm backend npm run seed

echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "🧹 Cleaning up unused images..."
docker system prune -f

echo "✅ Deployment completed successfully!"
echo "🌐 Frontend: https://${DOMAIN}"
echo "🔧 Backend API: https://api.${DOMAIN}"

# Health check
echo "🏥 Running health checks..."
sleep 30

if curl -f https://${DOMAIN}/health > /dev/null 2>&1; then
    echo "✅ Frontend health check passed"
else
    echo "❌ Frontend health check failed"
fi

if curl -f https://api.${DOMAIN}/health > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
fi

echo "🎉 Academic Hub is now live!"
