/**
 * SDK Type Definitions
 * Phase 4: SDK & Client
 * 
 * Provides TypeScript interfaces for the SDK client,
 * compatible with Engram's API
 */

// Re-export core types from types/index
export type {
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
} from '../types/index.js';

// SDK-specific types

/**
 * Input for creating a memory via SDK
 */
export interface CreateMemoryInput {
  title: string;
  content: string;
  type?: string;
  metadata?: Record<string, unknown>;
  project?: string;
  session_id?: string;
  topic_key?: string;
}

/**
 * Input for updating a memory via SDK
 */
export interface UpdateMemoryInput {
  title?: string;
  content?: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

/**
 * SDK search options (extends core SearchOptions with SDK-specific defaults)
 */
export interface SDKSearchOptions {
  query: string;
  project?: string;
  limit?: number;
  type?: string;
  scope?: 'project' | 'personal';
  enableVectors?: boolean;
}

/**
 * SDK list options (extends core ListOptions with SDK-specific defaults)
 */
export interface SDKListOptions {
  type?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'title';
  orderDir?: 'asc' | 'desc';
}

import type { TypeSchema } from '../types/index.js';

/**
 * Type definition input for creating custom types
 */
export interface DefineTypeInput {
  name: string;
  schema?: TypeSchema;
}

/**
 * SDK client initialization options
 */
export interface SDKClientOptions {
  /** Database path (default: ./memories.db) */
  dbPath?: string;
  /** Enable vector search (default: false) */
  enableVectors?: boolean;
  /** Vector weight in hybrid search (default: 0.4) */
  vectorWeight?: number;
  /** FTS weight in hybrid search (default: 0.6) */
  ftsWeight?: number;
  /** Embedding model to use (default: local) */
  embeddingModel?: 'local' | 'openai' | 'cohere';
  /** Memory paths to index (default: ['./docs/memories', './notes']) */
  memoryPaths?: string[];
}

/**
 * Return type for memory operations
 */
export interface MemoryOutput {
  id: string;
  title: string;
  content: string;
  type: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Return type for search operations
 */
export interface SearchOutput {
  id: string;
  title: string;
  content: string;
  contentPreview: string;
  type: string;
  score: number;
  createdAt: Date;
}
