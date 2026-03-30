/**
 * API Entry Point
 * Phase 5: REST API
 * 
 * Run with: 
 *   npm run api                   # Default: localhost:3000
 *   npm run api:remote            # 0.0.0.0:3000 with API key
 *   npm run api:subpath           # With /cmx-memories base path (local)
 *   npm run api:subpath:remote    # With /cmx-memories base path (remote)
 *   npm run api 8080              # Custom port
 * 
 * Environment variables:
 *   CMX_API_PORT      - Server port (default: 3000)
 *   CMX_API_HOST      - Server host (default: 0.0.0.0)
 *   CMX_API_KEY       - API key for authentication
 *   CMX_BASE_PATH     - Base path for reverse proxy (e.g., /cmx-memories)
 */

import { startServer } from './server.js';

// Get port and host from command line or environment
const port = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;
const host = process.argv[3] || undefined;

// Start the API server
startServer(port, host);
