import { startServer } from './server.js';

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const port = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;
const host = process.argv[3] || undefined;

startServer(port, host);
