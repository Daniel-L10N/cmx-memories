/**
 * cmx-memories - Main entry point
 * Local-first personal memory system with SQLite + FTS5
 */

// Re-export services
export * from './services/index.js';

// Re-export types (avoid duplicates by selective export)
export type { Memory, MemoryType, Config } from './types/index.js';

// Re-export DB
export * from './db/index.js';

// Re-export SDK
export * from './sdk/index.js';

// Re-export config
export { loadConfig, getConfig, resetConfig } from './config.js';
export { default as configDefaults } from './config.js';