/**
 * SDK Exports
 * Phase 4: SDK & Client
 * 
 * Main entry point for the cmx-memories SDK
 * Provides Engram-compatible API for memory operations
 */

// Client class and factory
export { MemoriesClient, createMemoriesClient, createDefaultClient } from './factory.js';

// Types
export type {
  // Core types
  MemoryOutput,
  SearchOutput,
  CreateMemoryInput,
  UpdateMemoryInput,
  SDKSearchOptions,
  SDKListOptions,
  DefineTypeInput,
  SDKClientOptions,
  
  // Re-exported from types/index
  Memory,
  MemoryInput,
  MemoryUpdateInput,
  MemoryType,
  MemoryTypeDefinition,
  TypeSchema,
  TypeField,
  SearchOptions,
  SearchResult,
  ListOptions,
  ClientOptions,
  Config,
  MemSaveInput,
  MemSearchInput,
  MemSaveOutput,
  MemSearchOutput,
} from './types.js';

// Individual method exports for direct usage
export {
  mem_save,
  mem_get,
  mem_update,
  mem_delete,
  mem_list,
  mem_search,
  define_type,
  list_memory_types,
  update_type,
  delete_type,
  generate_embedding,
} from './methods.js';
