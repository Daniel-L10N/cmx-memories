/**
 * Search Service - Hybrid FTS5 + Vector search with Advanced Filters
 * Phase 2: Core Services
 */

import { getDatabase } from '../db/connection.js';
import { getConfig } from '../config.js';
import type { SearchOptions, SearchResult, AdvancedSearchOptions } from '../types/index.js';

// Internal type for search options without query (for internal calls)
interface SearchFilterOptions {
  limit?: number;
  type?: string;
  project?: string;
  enableVectors?: boolean;
}

/**
 * Search memories using hybrid FTS5 + vector approach
 * Falls back to FTS5-only if vectors are disabled
 */
export async function search(
  query: string, 
  options?: SearchOptions
): Promise<SearchResult[]> {
  const config = getConfig();
  
  // If vectors enabled, do hybrid search
  if (config.enableVectors && options?.enableVectors !== false) {
    return hybridSearch(query, options as SearchFilterOptions);
  }
  
  // FTS5-only search
  return ftsSearch(query, options as SearchFilterOptions);
}

/**
 * FTS5 keyword search with BM25 ranking
 */
async function ftsSearch(
  query: string, 
  options?: SearchFilterOptions
): Promise<SearchResult[]> {
  const db = getDatabase();
  const limit = options?.limit || 10;
  
  // Escape special FTS5 characters and prepare query
  const sanitizedQuery = sanitizeFtsQuery(query);
  
  let sql = `
    SELECT 
      m.id,
      m.title,
      m.content,
      mt.name as typeName,
      bm25(memories_fts) as score,
      m.created_at as createdAt,
      m.updated_at as updatedAt
    FROM memories_fts
    JOIN memories m ON memories_fts.rowid = m.rowid
    JOIN memory_types mt ON m.type_id = mt.id
    WHERE memories_fts MATCH ?
  `;
  const params: (string | number)[] = [sanitizedQuery];
  
  // Add type filter
  if (options?.type) {
    sql += ' AND mt.name = ?';
    params.push(options.type);
  }
  
  // Add project filter (via metadata)
  if (options?.project) {
    sql += " AND m.metadata LIKE ?";
    params.push(`%"project":"${options.project}"%`);
  }
  
  // Order by BM25 score (lower is better in FTS5)
  sql += ' ORDER BY score LIMIT ?';
  params.push(limit);
  
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as FtsSearchRow[];
  
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    contentPreview: createPreview(row.content),
    type: row.typeName,
    score: Math.abs(row.score), // Convert to positive for readability
    createdAt: new Date(row.createdAt),
  }));
}

/**
 * Hybrid search combining FTS5 and vector similarity
 * Uses configurable weights (default: 0.6 FTS5 + 0.4 vector)
 */
async function hybridSearch(
  query: string,
  options?: SearchFilterOptions
): Promise<SearchResult[]> {
  const config = getConfig();
  const ftsWeight = options?.enableVectors === false 
    ? 1 
    : config.ftsWeight;
  const vectorWeight = options?.enableVectors === false 
    ? 0 
    : config.vectorWeight;
  const limit = options?.limit || 10;
  
  // Get FTS5 results
  const ftsResults = await ftsSearch(query, { ...options, limit: limit * 2 });
  const ftsMap = new Map(ftsResults.map(r => [r.id, r]));
  
  // Get vector results (placeholder - requires embedding service)
  let vectorResults: SearchResult[] = [];
  if (config.enableVectors) {
    vectorResults = await vectorSearch(query, { ...options, limit: limit * 2 });
  }
  const vectorMap = new Map(vectorResults.map(r => [r.id, r]));
  
  // Merge results with weighted scoring
  const merged = mergeResults(ftsMap, vectorMap, ftsWeight, vectorWeight, limit);
  
  return merged;
}

/**
 * Vector similarity search (stub - requires embedding service)
 * TODO: Implement with actual embedding generation and comparison
 */
async function vectorSearch(
  _query: string,
  options?: SearchFilterOptions
): Promise<SearchResult[]> {
  // Placeholder: Generate embeddings and compute similarity
  // This will be fully implemented in Phase 2.4 with embedding service
  console.warn('Vector search not fully implemented - using FTS5 fallback');
  
  const db = getDatabase();
  const limit = options?.limit || 10;
  
  // For now, return memories with embeddings but no similarity computation
  const stmt = db.prepare(`
    SELECT 
      m.id,
      m.title,
      m.content,
      mt.name as typeName,
      0.5 as score,
      m.created_at as createdAt,
      m.updated_at as updatedAt
    FROM memories m
    JOIN memory_types mt ON m.type_id = mt.id
    WHERE m.embedding IS NOT NULL
    LIMIT ?
  `);
  
  const rows = stmt.all(limit) as FtsSearchRow[];
  
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    contentPreview: createPreview(row.content),
    type: row.typeName,
    score: row.score,
    createdAt: new Date(row.createdAt),
  }));
}

/**
 * Merge FTS5 and vector results with weighted scoring
 */
function mergeResults(
  ftsMap: Map<string, SearchResult>,
  vectorMap: Map<string, SearchResult>,
  ftsWeight: number,
  vectorWeight: number,
  limit: number
): SearchResult[] {
  const allIds = new Set([...ftsMap.keys(), ...vectorMap.keys()]);
  const scored: Array<{ result: SearchResult; combinedScore: number }> = [];
  
  for (const id of allIds) {
    const ftsResult = ftsMap.get(id);
    const vectorResult = vectorMap.get(id);
    
    const ftsScore = ftsResult?.score || 0;
    const vectorScore = vectorResult?.score || 0;
    
    // Normalize and combine scores
    const combinedScore = (ftsScore * ftsWeight) + (vectorScore * vectorWeight);
    
    const result = ftsResult || vectorResult;
    if (result) {
      scored.push({ result, combinedScore });
    }
  }
  
  // Sort by combined score (higher is better)
  scored.sort((a, b) => b.combinedScore - a.combinedScore);
  
  return scored.slice(0, limit).map(s => s.result);
}

/**
 * Create a preview of content (first 200 chars)
 */
function createPreview(content: string): string {
  if (content.length <= 200) {
    return content;
  }
  return content.substring(0, 197) + '...';
}

/**
 * Sanitize query for FTS5 - escape special characters
 */
function sanitizeFtsQuery(query: string): string {
  // Escape special FTS5 operators
  return query
    .replace(/['"]/g, '') // Remove quotes
    .replace(/[*\-+\(\)]/g, ' ') // Replace operators with space
    .trim();
}

/**
 * Search with filters only (no text search)
 */
export async function searchByFilter(
  options: Omit<SearchOptions, 'query'>
): Promise<SearchResult[]> {
  const db = getDatabase();
  const limit = options?.limit || 10;
  
  let sql = `
    SELECT 
      m.id,
      m.title,
      m.content,
      mt.name as typeName,
      m.created_at as createdAt,
      m.updated_at as updatedAt
    FROM memories m
    JOIN memory_types mt ON m.type_id = mt.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  
  if (options.type) {
    sql += ' AND mt.name = ?';
    params.push(options.type);
  }
  
  if (options.project) {
    sql += " AND m.metadata LIKE ?";
    params.push(`%"project":"${options.project}"%`);
  }
  
  sql += ' ORDER BY m.created_at DESC LIMIT ?';
  params.push(limit);
  
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as FtsSearchRow[];
  
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    contentPreview: createPreview(row.content),
    type: row.typeName,
    score: 1,
    createdAt: new Date(row.createdAt),
  }));
}

// Internal type for FTS search rows
interface FtsSearchRow {
  id: string;
  title: string;
  content: string;
  typeName: string;
  score: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Advanced Search - Filtros inteligentes y búsqueda sofisticada
 */
export async function advancedSearch(
  query: string,
  options?: AdvancedSearchOptions
): Promise<SearchResult[]> {
  const db = getDatabase();
  const limit = options?.limit || 10;
  
  // Si es solo búsqueda por filtros (sin query de texto)
  if (!query || query.trim() === '') {
    return advancedFilterSearch(options);
  }
  
  // Construir consulta SQL dinámica
  let sql = `
    SELECT 
      m.id,
      m.title,
      m.content,
      mt.name as typeName,
      bm25(memories_fts) as score,
      m.created_at as createdAt,
      m.updated_at as updatedAt
    FROM memories_fts
    JOIN memories m ON memories_fts.rowid = m.rowid
    JOIN memory_types mt ON m.type_id = mt.id
    WHERE memories_fts MATCH ?
  `;
  const params: (string | number)[] = [sanitizeFtsQuery(query)];
  
  // Filtros de tipo
  if (options?.type) {
    sql += ' AND mt.name = ?';
    params.push(options.type);
  }
  
  // Filtros por proyecto (en metadata)
  if (options?.project) {
    sql += " AND m.metadata LIKE ?";
    params.push(`%"project":"${options.project}"%`);
  }
  
  // Filtros por fecha de creación
  if (options?.createdAfter) {
    sql += ' AND m.created_at >= ?';
    params.push(options.createdAfter.getTime());
  }
  if (options?.createdBefore) {
    sql += ' AND m.created_at <= ?';
    params.push(options.createdBefore.getTime());
  }
  
  // Filtros por fecha de actualización
  if (options?.updatedAfter) {
    sql += ' AND m.updated_at >= ?';
    params.push(options.updatedAfter.getTime());
  }
  if (options?.updatedBefore) {
    sql += ' AND m.updated_at <= ?';
    params.push(options.updatedBefore.getTime());
  }
  
  // Ordenamiento
  const sortBy = options?.sortBy || 'relevance';
  const sortDir = options?.sortDir || 'desc';
  
  switch (sortBy) {
    case 'createdAt':
      sql += ` ORDER BY m.created_at ${sortDir.toUpperCase()}`;
      break;
    case 'updatedAt':
      sql += ` ORDER BY m.updated_at ${sortDir.toUpperCase()}`;
      break;
    case 'title':
      sql += ` ORDER BY m.title ${sortDir.toUpperCase()}`;
      break;
    case 'relevance':
    default:
      sql += ' ORDER BY score';
      break;
  }
  
  sql += ' LIMIT ?';
  params.push(limit);
  
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as FtsSearchRow[];
  
  // Filtrar post-búsqueda por tags si se especificó
  let results = rows.map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    contentPreview: createPreview(row.content),
    type: row.typeName,
    score: Math.abs(row.score),
    createdAt: new Date(row.createdAt),
  }));
  
  // Filtrar por tags en metadata
  if (options?.tags && options.tags.length > 0) {
    results = results.filter(r => {
      // Obtener metadata de la memoria
      const mem = getMemoryById(r.id);
      if (!mem?.metadata) return false;
      
      const memTags = mem.metadata.tags as string[] || [];
      return options.tags!.some(tag => memTags.includes(tag));
    });
  }
  
  return results;
}

/**
 * Búsqueda avanzada solo con filtros (sin texto)
 */
async function advancedFilterSearch(
  options?: AdvancedSearchOptions
): Promise<SearchResult[]> {
  const db = getDatabase();
  const limit = options?.limit || 10;
  
  let sql = `
    SELECT 
      m.id,
      m.title,
      m.content,
      mt.name as typeName,
      m.created_at as createdAt,
      m.updated_at as updatedAt
    FROM memories m
    JOIN memory_types mt ON m.type_id = mt.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  
  // Filtros de tipo
  if (options?.type) {
    sql += ' AND mt.name = ?';
    params.push(options.type);
  }
  
  // Filtros por proyecto
  if (options?.project) {
    sql += " AND m.metadata LIKE ?";
    params.push(`%"project":"${options.project}"%`);
  }
  
  // Filtros por fecha de creación
  if (options?.createdAfter) {
    sql += ' AND m.created_at >= ?';
    params.push(options.createdAfter.getTime());
  }
  if (options?.createdBefore) {
    sql += ' AND m.created_at <= ?';
    params.push(options.createdBefore.getTime());
  }
  
  // Filtro por búsqueda en título
  if (options?.titleContains) {
    sql += ' AND m.title LIKE ?';
    params.push(`%${options.titleContains}%`);
  }
  
  // Filtro por búsqueda en contenido
  if (options?.contentContains) {
    sql += ' AND m.content LIKE ?';
    params.push(`%${options.contentContains}%`);
  }
  
  // Ordenamiento
  const sortBy = options?.sortBy || 'createdAt';
  const sortDir = options?.sortDir || 'desc';
  
  switch (sortBy) {
    case 'updatedAt':
      sql += ` ORDER BY m.updated_at ${sortDir.toUpperCase()}`;
      break;
    case 'title':
      sql += ` ORDER BY m.title ${sortDir.toUpperCase()}`;
      break;
    case 'createdAt':
    default:
      sql += ` ORDER BY m.created_at ${sortDir.toUpperCase()}`;
      break;
  }
  
  sql += ' LIMIT ?';
  params.push(limit);
  
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as FtsSearchRow[];
  
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    contentPreview: createPreview(row.content),
    type: row.typeName,
    score: 1,
    createdAt: new Date(row.createdAt),
  }));
}

/**
 * Obtener una memoria por ID (helper para filtros)
 */
function getMemoryById(id: string): { metadata?: Record<string, unknown> } | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT metadata FROM memories WHERE id = ?');
  const row = stmt.get(id) as { metadata: string } | undefined;
  
  if (!row) return null;
  
  try {
    return { metadata: row.metadata ? JSON.parse(row.metadata) : undefined };
  } catch {
    return { metadata: undefined };
  }
}

/**
 * Búsqueda semántica (simulada - requiere embeddings reales)
 */
export async function semanticSearch(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  console.warn('Semantic search requires embeddings - falling back to FTS5');
  return search(query, options);
}