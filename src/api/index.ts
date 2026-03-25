/**
 * API Entry Point
 * Phase 5: REST API
 * 
 * Run with: npm run api
 */

import { startServer } from './server.js';

// Get port from command line or environment
const port = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;

// Start the API server
startServer(port);
