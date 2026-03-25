/**
 * TypeScript Type Definitions for cmx-memories
 * Provides interfaces compatible with Engram's API
 */

// Core Types

export type MemoryType = 'memory' | 'idea' | 'task' | 'note' | string;

export interface MemoryInput {
  title: string;
  content: string;
  type?: MemoryType;
  metadata?: Record<string, unknown>;
  project?: string;
  session_id?: string;
  topic_key?: string;
}

export interface MemoryUpdateInput {
  title?: string;
  content?: string;
  type?: MemoryType;
  metadata?: Record<string, unknown>;
}

export interface Memory {
  id: string;
  typeId: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryTypeDefinition {
  id: string;
  name: string;
  schema?: TypeSchema;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TypeSchema {
  fields: TypeField[];
  validation?: Record<string, unknown>;
}

export interface TypeField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  default?: unknown;
}

// Search Types

export interface SearchOptions {
  query: string;
  project?: string;
  limit?: number;
  type?: MemoryType;
  scope?: 'project' | 'personal';
  enableVectors?: boolean;
}

export interface AdvancedSearchOptions extends SearchOptions {
  // Filtros de fecha
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  
  // Filtros por metadata
  tags?: string[];           // Buscar en tags dentro de metadata
  metadata?: Record<string, unknown>; // Filtros exactos en metadata
  
  // Filtros de contenido
  contentContains?: string;  // Buscar en contenido
  titleContains?: string;    // Buscar en título
  
  // Búsqueda avanzada
  fuzzy?: boolean;           // Búsqueda fuzzy/ aproximada
  fuzzyThreshold?: number;  // Threshold para fuzzy (0-1)
  regex?: boolean;          // Usar regex en la búsqueda
  
  // Ordenamiento
  sortBy?: 'relevance' | 'createdAt' | 'updatedAt' | 'title';
  sortDir?: 'asc' | 'desc';
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  contentPreview: string;
  type: string;
  score: number;
  createdAt: Date;
}

// List Options

export interface ListOptions {
  type?: MemoryType;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'title';
  orderDir?: 'asc' | 'desc';
}

// Client Options

export interface ClientOptions {
  dbPath?: string;
  enableVectors?: boolean;
  vectorWeight?: number;
  ftsWeight?: number;
}

// Config Types

export interface Config {
  dbPath: string;
  enableVectors: boolean;
  vectorWeight: number;
  ftsWeight: number;
  embeddingModel: 'local' | 'openai' | 'cohere';
  memoryPaths: string[];
}

// Plugin Types

export interface Plugin {
  name: string;
  version: string;
  hooks: Record<string, unknown>;
}

export interface PluginHook {
  name: string;
  callback: (data: unknown) => Promise<unknown>;
}

// Engram API Compatibility Types

export interface MemSaveInput {
  title: string;
  content: string;
  type?: string;
  metadata?: Record<string, unknown>;
  project?: string;
  session_id?: string;
  topic_key?: string;
}

export interface MemSearchInput {
  query: string;
  project?: string;
  limit?: number;
  type?: string;
  scope?: 'project' | 'personal';
}

export interface MemSaveOutput {
  id: string;
  createdAt: Date;
}

export interface MemSearchOutput {
  results: SearchResult[];
  total: number;
}