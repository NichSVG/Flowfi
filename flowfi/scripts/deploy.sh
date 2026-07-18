#!/bin/bash
set -e

APP_DIR="/var/www/flowfi"
APP_SUBDIR="$APP_DIR/flowfi"

echo "=== Deploying FlowFi ==="

cd "$APP_DIR"
echo "Pulling latest code..."
git pull origin master

cd "$APP_SUBDIR"
echo "Installing dependencies..."
npm ci --production

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Building Next.js..."
npm run build

echo "Restarting PM2 process..."
pm2 reload flowfi --update-env

echo "=== Deployment complete ==="
