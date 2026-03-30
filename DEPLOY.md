# cmx-memories Deployment Guide

This guide explains how to deploy cmx-memories for both local and remote usage.

## Quick Start

### Local Development
```bash
cd cmx-memories
npm install
npm run api
# Server runs at http://127.0.0.1:3000
```

### Remote Server
```bash
cd cmx-memories
npm run api:remote
# Server runs at http://0.0.0.0:3000 (accessible from network)
```

---

## Deployment Options

### Option 1: Local with Base Path (Testing)

If you want to test the subpath configuration locally:

```bash
npm run api:subpath
# Health: http://127.0.0.1:3000/cmx-memories/health
# API:   http://127.0.0.1:3000/cmx-memories/api/...
```

### Option 2: Production Server with Base Path

Deploy behind a reverse proxy (nginx, Apache, etc.):

```bash
# Start server with base path
npm run api:subpath:remote
```

Environment:
- `CMX_BASE_PATH=/cmx-memories` - Base path for all endpoints

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CMX_API_PORT` | `3000` | Server port |
| `CMX_API_HOST` | `0.0.0.0` | Server host (use `127.0.0.1` for local-only) |
| `CMX_API_KEY` | `cmx-dev-key` | API authentication key |
| `CMX_BASE_PATH` | (none) | Base path for reverse proxy (e.g., `/cmx-memories`) |

### For OpenCode Plugin

The plugin also needs these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `CMX_MEMORIES_PORT` | `3000` | Server port |
| `CMX_MEMORIES_HOST` | `127.0.0.1` | Server hostname |
| `CMX_MEMORIES_BASE_PATH` | (none) | Base path |

---

## OpenCode Plugin Configuration

### For Local Usage (Default)
The plugin works out of the box connecting to `http://127.0.0.1:3000`.

### For Remote Server

Set environment variables before running OpenCode:

```bash
export CMX_MEMORIES_HOST="your-server.com"
export CMX_MEMORIES_PORT="3000"
export CMX_MEMORIES_BASE_PATH="/cmx-memories"
export CMX_API_KEY="your-secure-key"

opencode
```

---

## Nginx Configuration (Production)

Example nginx config for部署 with base path:

```nginx
server {
    listen 80;
    server_name your-server.com;

    # cmx-memories API
    location /cmx-memories/ {
        proxy_pass http://127.0.0.1:3000/cmx-memories/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        
        # Add API key header
        proxy_set_header X-API-Key "your-secure-key";
    }
}
```

Or without base path (recommended for nginx handling the path):

```nginx
server {
    listen 80;
    server_name your-server.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-API-Key "your-secure-key";
    }
}
```

---

## Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY dist ./dist
COPY package*.json ./

RUN npm ci --only=production

EXPOSE 3000

ENV CMX_API_HOST=0.0.0.0
ENV CMX_BASE_PATH=/cmx-memories

CMD ["node", "dist/api/index.js"]
```

Build and run:
```bash
npm run api:build
docker build -t cmx-memories .
docker run -d -p 3000:3000 -e CMX_BASE_PATH=/cmx-memories cmx-memories
```

---

## Testing the Deployment

### Health Check
```bash
curl http://your-server.com/cmx-memories/health
# Returns: {"status":"ok","timestamp":"...","basePath":"/cmx-memories"}
```

### Test API
```bash
curl -H "X-API-Key: your-secure-key" \
     http://your-server.com/cmx-memories/api/memories
```

---

## Troubleshooting

### Connection Refused
- Check if the server is running: `ps aux | grep cmx-memories`
- Check firewall: `sudo ufw allow 3000`

### 401 Unauthorized
- Verify API key matches between server and client
- Check `X-API-Key` header is being passed

### 404 Not Found
- Verify base path matches (with or without trailing slash)
- Check nginx `proxy_pass` configuration

---

## Recommended Production Setup

1. **Use PM2 for process management**:
   ```bash
   npm install -g pm2
   pm2 start "npm run api:remote" --name cmx-memories
   ```

2. **Set up SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot
   sudo certbot --nginx -d your-domain.com
   ```

3. **Configure environment file**:
   ```bash
   # .env
   CMX_API_PORT=3000
   CMX_API_HOST=0.0.0.0
   CMX_API_KEY=change-this-to-a-secure-key
   CMX_BASE_PATH=/cmx-memories
   ```
