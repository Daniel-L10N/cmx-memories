/**
 * Express Server Setup
 * Phase 5: REST API
 * 
 * Supports configurable BASE_PATH for deployment behind reverse proxy
 * Example: /cmx-memories -> all endpoints become /cmx-memories/api/...
 */

import express, { type Express } from 'express';
import cors from 'cors';
import { initializeDatabase } from '../db/connection.js';
import memoriesRouter from './routes/memories.js';
import typesRouter from './routes/types.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

/**
 * Get base path from environment (supports reverse proxy deployments)
 * Default: '' (root) - for local development
 * Set CMX_BASE_PATH='/cmx-memories' for deployment under subpath
 */
export function getBasePath(): string {
  return process.env.CMX_BASE_PATH || '';
}

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();
  const basePath = getBasePath();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check - available at both root and basePath
  const healthHandler = (_req: express.Request, res: express.Response) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      basePath,
      version: '1.0.0'
    });
  };
  app.get('/health', healthHandler);
  if (basePath) {
    app.get(basePath + '/health', healthHandler);
  }

  // API Routes - order matters! Search must be before :id
  const apiPath = basePath + '/api';
  app.use(apiPath + '/memories', memoriesRouter);
  app.use(apiPath + '/types', typesRouter);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Start the API server
 */
export function startServer(port?: number, host?: string): void {
  const serverPort = port || parseInt(process.env.CMX_API_PORT || '3000', 10);
  const serverHost = host || process.env.CMX_API_HOST || '0.0.0.0';
  const apiKey = process.env.CMX_API_KEY || 'cmx-dev-key';
  const basePath = getBasePath();

  // Initialize database before starting server
  initializeDatabase();

  const app = createApp();

  // API Key middleware
  const apiPath = basePath + '/api';
  app.use(apiPath, (req, res, next) => {
    const key = req.headers['x-api-key'] as string;
    if (!key || key !== apiKey) {
      res.status(401).json({ error: 'Unauthorized. Provide X-API-Key header.' });
      return;
    }
    next();
  });

  app.listen(serverPort, serverHost, () => {
    const baseUrl = `http://${serverHost}:${serverPort}`;
    const healthUrl = basePath ? `${baseUrl}${basePath}/health` : `${baseUrl}/health`;
    
    console.log(`========================================`);
    console.log(`  cmx-memories API v1.0.0`);
    console.log(`========================================`);
    console.log(`Server running on: ${baseUrl}`);
    console.log(`Base path: ${basePath || '(none - root)'}`);
    console.log(`Health check: ${healthUrl}`);
    console.log(`API Key: ${apiKey}`);
    console.log(`----------------------------------------`);
    console.log(`API endpoints (relative to ${basePath || '/'}):`);
    console.log(`  POST   api/memories        - Create memory`);
    console.log(`  GET    api/memories        - List memories`);
    console.log(`  GET    api/memories/:id    - Get memory`);
    console.log(`  PUT    api/memories/:id    - Update memory`);
    console.log(`  DELETE api/memories/:id    - Delete memory`);
    console.log(`  GET    api/memories/search - Search memories`);
    console.log(`  GET    api/types           - List types`);
    console.log(`  POST   api/types           - Create type`);
    console.log(`  GET    api/types/:id       - Get type`);
    console.log(`  PUT    api/types/:id       - Update type`);
    console.log(`  DELETE api/types/:id       - Delete type`);
    console.log(`========================================`);
    
    if (basePath) {
      console.log(`\n🔧 Deployment detected with base path: ${basePath}`);
      console.log(`   Use nginx or similar reverse proxy to map /cmx-memories`);
    }
  });
}

export default { createApp, startServer };
