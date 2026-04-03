/**
 * Memory Service - CRUD operations for memories
 * Phase 2: Core Services
 */

import { getDatabase } from '../db/connection.js';
import type { 
  Memory, 
  MemoryInput, 
  MemoryUpdateInput, 
  ListOptions 
} from '../types/index.js';

/**
 * Generate a unique ID for new memories
 */
function generateId(): string {
  return `mem-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Get the default memory type ID
 */
function getDefaultTypeId(): string {
  return 'type-memory';
}

/**
 * Ensure a memory type exists, create if not
 */
function ensureTypeExists(typeName: string): void {
  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM memory_types WHERE name = ?').get(typeName) as { id: string } | undefined;
  
  if (!existing) {
    // Create the type with default schema
    db.prepare(`
      INSERT INTO memory_types (id, name, schema, version, created_at, updated_at)
      VALUES (?, ?, NULL, 1, ?, ?)
    `).run(
      `type-${typeName}`,
      typeName,
      Date.now(),
      Date.now()
    );
  }
}

/**
 * Create a new memory
 * Implements FTS5 indexing on create
 */
export async function createMemory(input: MemoryInput): Promise<Memory> {
  const db = getDatabase();
  const now = new Date();
  const id = generateId();
  
  // Ensure type exists and get its ID
  if (input.type) {
    ensureTypeExists(input.type);
  }
  
  // Get type ID from type name
  const typeId = input.type 
    ? getTypeIdByName(input.type) 
    : getDefaultTypeId();
  
  const metadata = input.metadata 
    ? JSON.stringify(input.metadata) 
    : null;

  // Insert memory - FTS trigger handles indexing automatically
  const stmt = db.prepare(`
    INSERT INTO memories (id, type_id, title, content, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, typeId, input.title, input.content, metadata, now.getTime(), now.getTime());
  
  return getMemory(id) as Promise<Memory>;
}

/**
 * Get a memory by ID
 */
export async function getMemory(id: string): Promise<Memory | null> {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT m.*, mt.name as typeName
    FROM memories m
    JOIN memory_types mt ON m.type_id = mt.id
    WHERE m.id = ?
  `);
  
  const row = stmt.get(id) as MemoryRow | undefined;
  
  if (!row) {
    return null;
  }
  
  return mapRowToMemory(row);
}

/**
 * Update an existing memory
 * Preserves original created_at timestamp
 */
export async function updateMemory(id: string, input: MemoryUpdateInput): Promise<Memory> {
  const db = getDatabase();
  const now = new Date();
  
  // Get current memory to preserve created_at
  const current = await getMemory(id);
  if (!current) {
    throw new Error(`Memory not found: ${id}`);
  }
  
  // Build update query dynamically
  const updates: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [now.getTime()];
  
  if (input.title !== undefined) {
    updates.push('title = ?');
    values.push(input.title);
  }
  if (input.content !== undefined) {
    updates.push('content = ?');
    values.push(input.content);
  }
  if (input.type !== undefined) {
    const typeId = getTypeIdByName(input.type);
    updates.push('type_id = ?');
    values.push(typeId);
  }
  if (input.metadata !== undefined) {
    updates.push('metadata = ?');
    values.push(JSON.stringify(input.metadata));
  }
  
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE memories SET ${updates.join(', ')} WHERE id = ?
  `);
  
  stmt.run(...values);
  
  return getMemory(id) as Promise<Memory>;
}

/**
 * Delete a memory by ID
 * FTS triggers handle FTS deletion automatically
 */
export async function deleteMemory(id: string): Promise<void> {
  const db = getDatabase();
  
  const stmt = db.prepare('DELETE FROM memories WHERE id = ?');
  const result = stmt.run(id);
  
  if (result.changes === 0) {
    throw new Error(`Memory not found: ${id}`);
  }
}

/**
 * List memories with filtering and pagination
 */
export async function listMemories(options?: ListOptions): Promise<Memory[]> {
  const db = getDatabase();
  
  let query = `
    SELECT m.*, mt.name as typeName
    FROM memories m
    JOIN memory_types mt ON m.type_id = mt.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  
  if (options?.type) {
    query += ' AND mt.name = ?';
    params.push(options.type);
  }
  
  // Order by
  const orderBy = options?.orderBy || 'createdAt';
  const orderDir = options?.orderDir || 'desc';
  query += ` ORDER BY m.${mapOrderByField(orderBy)} ${orderDir}`;
  
  // Pagination
  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }
  if (options?.offset) {
    query += ' OFFSET ?';
    params.push(options.offset);
  }
  
  const stmt = db.prepare(query);
  const rows = stmt.all(...params) as MemoryRow[];
  
  return rows.map(mapRowToMemory);
}

/**
 * Get type ID by type name
 */
function getTypeIdByName(typeName: string): string {
  const db = getDatabase();
  const stmt = db.prepare('SELECT id FROM memory_types WHERE name = ?');
  const row = stmt.get(typeName) as { id: string } | undefined;
  
  if (!row) {
    return getDefaultTypeId();
  }
  
  return row.id;
}

/**
 * Map order by field name to column name
 */
function mapOrderByField(field: string): string {
  const mapping: Record<string, string> = {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    title: 'title',
  };
  return mapping[field] || 'created_at';
}

/**
 * Map database row to Memory object
 */
function mapRowToMemory(row: MemoryRow): Memory {
  return {
    id: row.id,
    typeId: row.type_id,
    title: row.title,
    content: row.content,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Internal type for database rows
interface MemoryRow {
  id: string;
  type_id: string;
  title: string;
  content: string;
  metadata: string | null;
  embedding: string | null;
  fts_rowid: number | null;
  created_at: number;
  updated_at: number;
  typeName?: string;
}
/**
 * Get type name by type ID
 */
export function getTypeNameById(typeId: string): string {
  const db = getDatabase();
  const stmt = db.prepare('SELECT name FROM memory_types WHERE id = ?');
  const row = stmt.get(typeId) as { name: string } | undefined;
  return row?.name || typeId;
}
