/**
 * SDK Methods - Business logic for the SDK client
 * Phase 4: SDK & Client
 * 
 * These methods wrap the service layer and provide Engram-compatible API
 */

import {
  createMemory,
  getMemory,
  updateMemory,
  deleteMemory,
  listMemories,
} from '../services/memory.service.js';
import { search } from '../services/search.service.js';
import {
  createType,
  getTypeByName,
  listTypes,
  updateType,
  deleteType,
} from '../services/types.service.js';
import { generateEmbedding } from '../services/embedding.service.js';
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

/**
 * Save a memory (mem_save compatible)
 * Creates a new memory or updates existing one by ID
 */
export async function mem_save(params: CreateMemoryInput): Promise<MemoryOutput> {
  const memory = await createMemory({
    title: params.title,
    content: params.content,
    type: params.type || 'memory',
    metadata: {
      ...params.metadata,
      project: params.project,
      session_id: params.session_id,
      topic_key: params.topic_key,
    },
  });

  return {
    id: memory.id,
    title: memory.title,
    content: memory.content,
    type: memory.typeId,
    metadata: memory.metadata,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}

/**
 * Get a memory by ID (mem_get compatible)
 */
export async function mem_get(id: string): Promise<MemoryOutput | null> {
  const memory = await getMemory(id);
  
  if (!memory) {
    return null;
  }

  return {
    id: memory.id,
    title: memory.title,
    content: memory.content,
    type: memory.typeId,
    metadata: memory.metadata,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}

/**
 * Update an existing memory (mem_update compatible)
 */
export async function mem_update(
  id: string, 
  data: UpdateMemoryInput
): Promise<MemoryOutput> {
  const memory = await updateMemory(id, data);

  return {
    id: memory.id,
    title: memory.title,
    content: memory.content,
    type: memory.typeId,
    metadata: memory.metadata,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  };
}

/**
 * Delete a memory by ID (mem_delete compatible)
 */
export async function mem_delete(id: string): Promise<void> {
  await deleteMemory(id);
}

/**
 * List memories (mem_list compatible)
 */
export async function mem_list(options?: SDKListOptions): Promise<MemoryOutput[]> {
  const memories = await listMemories(options);
  
  return memories.map(m => ({
    id: m.id,
    title: m.title,
    content: m.content,
    type: m.typeId,
    metadata: m.metadata,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
}

/**
 * Search memories (mem_search compatible)
 */
export async function mem_search(
  query: string,
  options?: SDKSearchOptions
): Promise<SearchOutput[]> {
  const results = await search(query, {
    query,
    project: options?.project,
    limit: options?.limit || 10,
    type: options?.type,
    scope: options?.scope,
    enableVectors: options?.enableVectors,
  });

  return results.map(r => ({
    id: r.id,
    title: r.title,
    content: r.content,
    contentPreview: r.contentPreview,
    type: r.type,
    score: r.score,
    createdAt: r.createdAt,
  }));
}

/**
 * Define a new memory type
 */
export async function define_type(params: DefineTypeInput): Promise<MemoryTypeDefinition> {
  // Check if type already exists
  const existing = await getTypeByName(params.name);
  if (existing) {
    throw new Error(`Type already exists: ${params.name}`);
  }

  return createType(params.name, params.schema);
}

/**
 * List all memory types
 */
export async function list_memory_types(): Promise<MemoryTypeDefinition[]> {
  return listTypes();
}

/**
 * Update a memory type's schema
 */
export async function update_type(
  id: string,
  schema: { fields: Array<{ name: string; type: string; required?: boolean; default?: unknown }> }
): Promise<MemoryTypeDefinition> {
  return updateType(id, schema as any);
}

/**
 * Delete a memory type
 */
export async function delete_type(id: string): Promise<void> {
  await deleteType(id);
}

/**
 * Generate embedding for text
 */
export async function generate_embedding(text: string): Promise<number[]> {
  return generateEmbedding(text);
}
