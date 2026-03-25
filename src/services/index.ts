/**
 * Services Index - Export all core services
 * Phase 2: Core Services
 */

// Memory CRUD Service
export * from './memory.service.js';
export { createMemory, getMemory, updateMemory, deleteMemory, listMemories } from './memory.service.js';

// Search Service
export * from './search.service.js';
export { search, searchByFilter } from './search.service.js';

// Types Service
export * from './types.service.js';
export { 
  createType, 
  getType, 
  getTypeByName, 
  listTypes, 
  updateType, 
  deleteType, 
  initializeDefaultTypes,
  typeExists 
} from './types.service.js';

// Embedding Service
export * from './embedding.service.js';
export { 
  generateEmbedding, 
  chunkText, 
  aggregateEmbeddings, 
  cosineSimilarity, 
  updateMemoryEmbedding 
} from './embedding.service.js';

// Plugin Service
export * from './plugin.service.js';
export { 
  loadPlugins, 
  getPlugins, 
  getPlugin, 
  registerHook, 
  emitHook, 
  unregisterHook, 
  clearHooks,
  HOOK_TYPES 
} from './plugin.service.js';