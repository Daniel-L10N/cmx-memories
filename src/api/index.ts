/**
 * API Entry Point
 * Phase 5: REST API
 * 
 * Run with: 
 *   npm run api              # Default: localhost:3000
 *   npm run api:remote       # 0.0.0.0:3000 with API key
 *   npm run api 8080         # Custom port
 */

import { startServer } from './server.js';

// Get port and host from command line or environment
const port = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;
const host = process.argv[3] || undefined;

// Start the API server
startServer(port, host);
