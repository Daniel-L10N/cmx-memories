/**
 * MemoriesClient - SDK Client Class
 * Phase 4: SDK & Client
 * 
 * A client for interacting with cmx-memories,
 * compatible with Engram's API
 */

import { initializeDatabase } from '../db/connection.js';
import { resetConfig } from '../config.js';
import type { SDKClientOptions } from './types.js';
import type {
  CreateMemoryInput,
  UpdateMemoryInput,
  SDKSearchOptions,
  SDKListOptions,
  DefineTypeInput,
  MemoryOutput,
  SearchOutput,
  MemoryTypeDefinition,
} from './types.js';
import {
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

/**
 * MemoriesClient - Main SDK client for memory operations
 * 
 * @example
 * ```typescript
 * import { createMemoriesClient } from 'cmx-memories';
 * 
 * const client = createMemoriesClient({ dbPath: './memories.db' });
 * 
 * // Save a memory
 * const memory = await client.save({
 *   title: 'My Idea',
 *   content: 'Something interesting...',
 *   type: 'idea'
 * });
 * 
 * // Search memories
 * const results = await client.search('interesting', { limit: 5 });
 * ```
 */
export class MemoriesClient {
  private initialized: boolean = false;
  private options: SDKClientOptions;

  /**
   * Create a new MemoriesClient
   * 
   * @param options - Client configuration options
   */
  constructor(options: SDKClientOptions = {}) {
    // Set environment variable for config to pick up
    if (options.dbPath) {
      process.env.CMX_DB_PATH = options.dbPath;
    }
    if (options.enableVectors !== undefined) {
      process.env.CMX_ENABLE_VECTORS = String(options.enableVectors);
    }
    if (options.vectorWeight !== undefined) {
      process.env.CMX_VECTOR_WEIGHT = String(options.vectorWeight);
    }
    if (options.ftsWeight !== undefined) {
      process.env.CMX_FTS_WEIGHT = String(options.ftsWeight);
    }

    this.options = {
      dbPath: options.dbPath || './memories.db',
      enableVectors: options.enableVectors ?? false,
      vectorWeight: options.vectorWeight ?? 0.4,
      ftsWeight: options.ftsWeight ?? 0.6,
      embeddingModel: options.embeddingModel || 'local',
      memoryPaths: options.memoryPaths || ['./docs/memories', './notes'],
    };
  }

  /**
   * Initialize the client and database
   * Called automatically on first operation
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize database
    initializeDatabase();
    this.initialized = true;
  }

  /**
   * Save a memory (mem_save compatible)
   * 
   * @param input - Memory input data
   * @returns Created memory with ID and timestamps
   */
  async save(input: CreateMemoryInput): Promise<MemoryOutput> {
    await this.initialize();
    return mem_save(input);
  }

  /**
   * Get a memory by ID (mem_get compatible)
   * 
   * @param id - Memory ID
   * @returns Memory or null if not found
   */
  async get(id: string): Promise<MemoryOutput | null> {
    await this.initialize();
    return mem_get(id);
  }

  /**
   * Update an existing memory (mem_update compatible)
   * 
   * @param id - Memory ID
   * @param data - Updated data
   * @returns Updated memory
   */
  async update(id: string, data: UpdateMemoryInput): Promise<MemoryOutput> {
    await this.initialize();
    return mem_update(id, data);
  }

  /**
   * Delete a memory by ID (mem_delete compatible)
   * 
   * @param id - Memory ID to delete
   */
  async delete(id: string): Promise<void> {
    await this.initialize();
    return mem_delete(id);
  }

  /**
   * List memories (mem_list compatible)
   * 
   * @param options - List options (type, limit, offset, order)
   * @returns Array of memories
   */
  async list(options?: SDKListOptions): Promise<MemoryOutput[]> {
    await this.initialize();
    return mem_list(options);
  }

  /**
   * Search memories (mem_search compatible)
   * 
   * @param query - Search query string
   * @param options - Search options (type, limit, project, etc.)
   * @returns Array of search results with scores
   */
  async search(query: string, options?: SDKSearchOptions): Promise<SearchOutput[]> {
    await this.initialize();
    return mem_search(query, options);
  }

  /**
   * Define a new memory type
   * 
   * @param input - Type definition input
   * @returns Created type definition
   */
  async defineType(input: DefineTypeInput): Promise<MemoryTypeDefinition> {
    await this.initialize();
    return define_type(input);
  }

  /**
   * List all memory types
   * 
   * @returns Array of type definitions
   */
  async listTypes(): Promise<MemoryTypeDefinition[]> {
    await this.initialize();
    return list_memory_types();
  }

  /**
   * Update a memory type's schema
   * 
   * @param id - Type ID
   * @param schema - New type schema
   * @returns Updated type definition
   */
  async updateType(
    id: string,
    schema: { fields: Array<{ name: string; type: string; required?: boolean; default?: unknown }> }
  ): Promise<MemoryTypeDefinition> {
    await this.initialize();
    return update_type(id, schema);
  }

  /**
   * Delete a memory type
   * 
   * @param id - Type ID to delete
   */
  async deleteType(id: string): Promise<void> {
    await this.initialize();
    return delete_type(id);
  }

  /**
   * Generate embedding for text
   * 
   * @param text - Input text to embed
   * @returns Embedding vector array
   */
  async generateEmbedding(text: string): Promise<number[]> {
    await this.initialize();
    return generate_embedding(text);
  }

  /**
   * Get client configuration
   * 
   * @returns Current client options
   */
  getOptions(): SDKClientOptions {
    return { ...this.options };
  }

  /**
   * Close the client and cleanup resources
   */
  async close(): Promise<void> {
    // Reset config cache
    resetConfig();
    this.initialized = false;
  }
}
