import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Memory Types Table
 * Stores custom memory type definitions with optional JSON schemas
 */
export const memoryTypes = sqliteTable('memory_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  schema: text('schema'), // JSON string for custom fields
  version: integer('version').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Memories Table
 * Core storage for all memory entries
 */
export const memories = sqliteTable('memories', {
  id: text('id').primaryKey(),
  typeId: text('type_id')
    .notNull()
    .references(() => memoryTypes.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  metadata: text('metadata'), // JSON string for custom metadata
  // Vector embedding stored as JSON array (sqlite-vec compatible)
  embedding: text('embedding'),
  // Link to FTS5 virtual table rowid
  ftsRowid: integer('fts_rowid'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Memory Metadata Table
 * Additional key-value metadata for memories
 */
export const memoryMetadata = sqliteTable('memory_metadata', {
  id: text('id').primaryKey(),
  memoryId: text('memory_id')
    .notNull()
    .references(() => memories.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Type exports for queries
export type MemoryType = typeof memoryTypes.$inferSelect;
export type NewMemoryType = typeof memoryTypes.$inferInsert;
export type Memory = typeof memories.$inferSelect;
export type NewMemory = typeof memories.$inferInsert;
export type MemoryMetadata = typeof memoryMetadata.$inferSelect;
export type NewMemoryMetadata = typeof memoryMetadata.$inferInsert;