import Database from 'better-sqlite3';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { getConfig } from '../config.js';

/**
 * Database instance - initialized on first use
 */
let db: Database.Database | null = null;

/**
 * Set the database instance (for testing)
 */
export function setGlobalDatabase(database: Database.Database): void {
  db = database;
}

/**
 * Get the database instance
 * Throws if not initialized
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Get the database file path from config
 */
export function getDbPath(): string {
  const config = getConfig();
  return resolve(process.cwd(), config.dbPath);
}

/**
 * Initialize the database
 * Creates tables, indexes, and FTS5 if not exists
 */
export function initializeDatabase(): Database.Database {
  const dbPath = getDbPath();
  
  // Ensure directory exists
  const dbDir = resolve(dbPath, '..');
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  // Open database connection
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migrations (create tables)
  runMigrations(db);

  // Create FTS5 virtual table
  createFtsTable(db);

  // Seed default memory types
  seedDefaultTypes(db);

  console.log(`Database initialized at: ${dbPath}`);
  return db;
}

/**
 * Run SQL migrations to create tables
 */
function runMigrations(database: Database.Database): void {
  // Read and execute the initial migration
  const migrationSql = `
    -- Memory Types Table
    CREATE TABLE IF NOT EXISTS memory_types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      schema TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Memories Table
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      type_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      embedding TEXT,
      fts_rowid INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (type_id) REFERENCES memory_types(id) ON DELETE CASCADE
    );

    -- Memory Metadata Table
    CREATE TABLE IF NOT EXISTS memory_metadata (
      id TEXT PRIMARY KEY,
      memory_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_memories_type_id ON memories(type_id);
    CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);
    CREATE INDEX IF NOT EXISTS idx_memory_metadata_memory_id ON memory_metadata(memory_id);
    CREATE INDEX IF NOT EXISTS idx_memory_metadata_key ON memory_metadata(key);
  `;

  database.exec(migrationSql);
}

/**
 * Create FTS5 virtual table and triggers
 */
function createFtsTable(database: Database.Database): void {
  try {
    // Create FTS5 virtual table
    database.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        title,
        content,
        tokenize='unicode61'
      );
    `);

    // Drop existing triggers if they exist (to avoid issues with trigger bodies)
    try {
      database.exec('DROP TRIGGER IF EXISTS memories_ai');
      database.exec('DROP TRIGGER IF EXISTS memories_ad');
      database.exec('DROP TRIGGER IF EXISTS memories_au');
    } catch {
      // Ignore if triggers don't exist
    }

    // Create simpler triggers without the 'delete' syntax (which seems buggy)
    database.exec(`
      CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts(rowid, title, content) 
        VALUES (NEW.rowid, NEW.title, NEW.content);
      END;

      CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
        DELETE FROM memories_fts WHERE rowid = OLD.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
        DELETE FROM memories_fts WHERE rowid = OLD.rowid;
        INSERT INTO memories_fts(rowid, title, content) 
        VALUES (NEW.rowid, NEW.title, NEW.content);
      END;
    `);

    console.log('FTS5 virtual table created successfully');
  } catch (error) {
    // FTS5 might not be available (e.g., on some ARM builds)
    console.warn('Warning: FTS5 not available:', error);
  }
}

/**
 * Seed default memory types if none exist
 */
function seedDefaultTypes(database: Database.Database): void {
  const countStmt = database.prepare('SELECT COUNT(*) as count FROM memory_types');
  const result = countStmt.get() as { count: number };

  if (result.count > 0) {
    return; // Types already exist
  }

  const now = Date.now();
  const defaultTypes = [
    { id: 'type-memory', name: 'memory', schema: null },
    { id: 'type-idea', name: 'idea', schema: JSON.stringify({ fields: [{ name: 'tags', type: 'array' }, { name: 'status', type: 'string' }] }) },
    { id: 'type-task', name: 'task', schema: JSON.stringify({ fields: [{ name: 'priority', type: 'string' }, { name: 'dueDate', type: 'string' }] }) },
    { id: 'type-note', name: 'note', schema: JSON.stringify({ fields: [{ name: 'source', type: 'string' }] }) },
    { id: 'type-goal', name: 'goal', schema: JSON.stringify({ fields: [{ name: 'project', type: 'string' }, { name: 'targetDate', type: 'string' }] }) },
  ];

  const insertStmt = database.prepare(`
    INSERT INTO memory_types (id, name, schema, version, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, ?)
  `);

  for (const type of defaultTypes) {
    insertStmt.run(type.id, type.name, type.schema, now, now);
  }

  console.log('Default memory types seeded');
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export { db };