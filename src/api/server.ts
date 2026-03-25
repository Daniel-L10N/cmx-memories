/**
 * Express Server Setup
 * Phase 5: REST API
 */

import express, { type Express } from 'express';
import cors from 'cors';
import { initializeDatabase } from '../db/connection.js';
import memoriesRouter from './routes/memories.js';
import typesRouter from './routes/types.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes - order matters! Search must be before :id
  app.use('/api/memories', memoriesRouter);
  app.use('/api/types', typesRouter);

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

  // Initialize database before starting server
  initializeDatabase();

  const app = createApp();

  // API Key middleware
  app.use('/api', (req, res, next) => {
    const key = req.headers['x-api-key'] as string;
    if (!key || key !== apiKey) {
      res.status(401).json({ error: 'Unauthorized. Provide X-API-Key header.' });
      return;
    }
    next();
  });

  app.listen(serverPort, serverHost, () => {
    console.log(`API server running on http://${serverHost}:${serverPort}`);
    console.log(`Health check: http://${serverHost}:${serverPort}/health`);
    console.log(`API Key: ${apiKey}`);
    console.log(`API endpoints:`);
    console.log(`  POST   /api/memories       - Create memory`);
    console.log(`  GET    /api/memories       - List memories`);
    console.log(`  GET    /api/memories/:id   - Get memory`);
    console.log(`  PUT    /api/memories/:id   - Update memory`);
    console.log(`  DELETE /api/memories/:id   - Delete memory`);
    console.log(`  GET    /api/memories/search - Search memories`);
    console.log(`  GET    /api/types          - List types`);
    console.log(`  POST   /api/types          - Create type`);
    console.log(`  GET    /api/types/:id      - Get type`);
    console.log(`  PUT    /api/types/:id      - Update type`);
    console.log(`  DELETE /api/types/:id      - Delete type`);
  });
}

export default { createApp, startServer };
