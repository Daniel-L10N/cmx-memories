#!/bin/bash
# cmx-memories Deployment Script
# Usage: ./scripts/deploy.sh [local|remote|production]

set -e

MODE=${1:-local}
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================="
echo "  cmx-memories Deployment"
echo "=========================================="
echo "Mode: $MODE"
echo "Project: $PROJECT_DIR"
echo ""

cd "$PROJECT_DIR"

case $MODE in
  local)
    echo "Starting local server..."
    echo "URL: http://127.0.0.1:3000"
    npm run api
    ;;

  remote)
    echo "Starting remote server (accessible from network)..."
    echo "URL: http://0.0.0.0:3000"
    npm run api:remote
    ;;

  subpath)
    echo "Starting server with base path /cmx-memories..."
    echo "URL: http://127.0.0.1:3000/cmx-memories"
    npm run api:subpath
    ;;

  subpath:remote)
    echo "Starting remote server with base path /cmx-memories..."
    echo "URL: http://0.0.0.0:3000/cmx-memories"
    npm run api:subpath:remote
    ;;

  production)
    echo "Building and starting production server..."
    
    # Build
    echo "Building..."
    npm run build
    npm run api:build
    
    # Start with PM2 or direct
    if command -v pm2 &> /dev/null; then
      echo "Starting with PM2..."
      pm2 start "npm run api:start" --name cmx-memories
      pm2 save
    else
      echo "PM2 not found. Starting directly..."
      npm run api:start
    fi
    ;;

  *)
    echo "Unknown mode: $MODE"
    echo ""
    echo "Usage: $0 [local|remote|subpath|subpath:remote|production]"
    echo ""
    echo "  local          - Start local server (127.0.0.1:3000)"
    echo "  remote         - Start remote server (0.0.0.0:3000)"
    echo "  subpath        - Local with /cmx-memories base path"
    echo "  subpath:remote - Remote with /cmx-memories base path"
    echo "  production     - Build and start with PM2"
    exit 1
    ;;
esac
