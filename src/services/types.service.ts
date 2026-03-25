/**
 * Types Service - Memory Types Registry
 * Phase 2: Core Services
 */

import { getDatabase } from '../db/connection.js';
import type { 
  MemoryTypeDefinition, 
  TypeSchema 
} from '../types/index.js';

/**
 * Create a new memory type
 */
export async function createType(
  name: string, 
  schema?: TypeSchema
): Promise<MemoryTypeDefinition> {
  const db = getDatabase();
  const now = new Date();
  const id = `type-${name.toLowerCase()}-${Date.now()}`;
  
  const schemaJson = schema ? JSON.stringify(schema) : null;
  
  const stmt = db.prepare(`
    INSERT INTO memory_types (id, name, schema, version, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, ?)
  `);
  
  stmt.run(id, name, schemaJson, now.getTime(), now.getTime());
  
  return getType(id) as Promise<MemoryTypeDefinition>;
}

/**
 * Get a memory type by ID
 */
export async function getType(id: string): Promise<MemoryTypeDefinition | null> {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT * FROM memory_types WHERE id = ?');
  const row = stmt.get(id) as TypeRow | undefined;
  
  if (!row) {
    return null;
  }
  
  return mapRowToType(row);
}

/**
 * Get a memory type by name
 */
export async function getTypeByName(name: string): Promise<MemoryTypeDefinition | null> {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT * FROM memory_types WHERE name = ?');
  const row = stmt.get(name) as TypeRow | undefined;
  
  if (!row) {
    return null;
  }
  
  return mapRowToType(row);
}

/**
 * List all memory types
 */
export async function listTypes(): Promise<MemoryTypeDefinition[]> {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT * FROM memory_types ORDER BY name');
  const rows = stmt.all() as TypeRow[];
  
  return rows.map(mapRowToType);
}

/**
 * Update a memory type's schema
 */
export async function updateType(
  id: string, 
  schema: TypeSchema
): Promise<MemoryTypeDefinition> {
  const db = getDatabase();
  const now = new Date();
  const schemaJson = JSON.stringify(schema);
  
  const stmt = db.prepare(`
    UPDATE memory_types 
    SET schema = ?, version = version + 1, updated_at = ?
    WHERE id = ?
  `);
  
  const result = stmt.run(schemaJson, now.getTime(), id);
  
  if (result.changes === 0) {
    throw new Error(`Type not found: ${id}`);
  }
  
  return getType(id) as Promise<MemoryTypeDefinition>;
}

/**
 * Delete a memory type
 * Note: Memories using this type will need to be migrated first
 */
export async function deleteType(id: string): Promise<void> {
  const db = getDatabase();
  
  // Check if any memories use this type
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM memories WHERE type_id = ?');
  const result = checkStmt.get(id) as { count: number };
  
  if (result.count > 0) {
    throw new Error(`Cannot delete type: ${result.count} memories still use it`);
  }
  
  const stmt = db.prepare('DELETE FROM memory_types WHERE id = ?');
  const deleteResult = stmt.run(id);
  
  if (deleteResult.changes === 0) {
    throw new Error(`Type not found: ${id}`);
  }
}

/**
 * Initialize default types (seed if not exist)
 * Called during database initialization
 */
export async function initializeDefaultTypes(): Promise<void> {
  const db = getDatabase();
  
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM memory_types');
  const result = countStmt.get() as { count: number };
  
  if (result.count > 0) {
    return; // Types already exist
  }
  
  const now = Date.now();
  const defaultTypes = [
    { 
      id: 'type-memory', 
      name: 'memory', 
      schema: null 
    },
    { 
      id: 'type-idea', 
      name: 'idea', 
      schema: JSON.stringify({ 
        fields: [
          { name: 'tags', type: 'array' },
          { name: 'status', type: 'string' }
        ]
      }) 
    },
    { 
      id: 'type-task', 
      name: 'task', 
      schema: JSON.stringify({ 
        fields: [
          { name: 'priority', type: 'string' },
          { name: 'dueDate', type: 'string' }
        ]
      }) 
    },
    { 
      id: 'type-note', 
      name: 'note', 
      schema: JSON.stringify({ 
        fields: [
          { name: 'source', type: 'string' }
        ]
      }) 
    },
  ];
  
  const insertStmt = db.prepare(`
    INSERT INTO memory_types (id, name, schema, version, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, ?)
  `);
  
  for (const type of defaultTypes) {
    insertStmt.run(type.id, type.name, type.schema, now, now);
  }
}

/**
 * Check if a type exists by name
 */
export async function typeExists(name: string): Promise<boolean> {
  const db = getDatabase();
  
  const stmt = db.prepare('SELECT 1 FROM memory_types WHERE name = ?');
  const row = stmt.get(name);
  
  return !!row;
}

/**
 * Map database row to MemoryTypeDefinition
 */
function mapRowToType(row: TypeRow): MemoryTypeDefinition {
  return {
    id: row.id,
    name: row.name,
    schema: row.schema ? JSON.parse(row.schema) : undefined,
    version: row.version,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Internal type for database rows
interface TypeRow {
  id: string;
  name: string;
  schema: string | null;
  version: number;
  created_at: number;
  updated_at: number;
}