/**
 * FTS5 Virtual Table Schema
 * 
 * This module defines the FTS5 configuration for full-text search.
 * The FTS5 table is managed separately from Drizzle schema since
 * virtual tables require raw SQL to create.
 * 
 * Tokenizer: unicode61 - handles Unicode properly
 * Content sync: external - managed via triggers on memories table
 */

/**
 * SQL to create FTS5 virtual table
 * Must be executed via raw SQL after database initialization
 */
export const FTS_CREATE_SQL = `
CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
  title,
  content,
  tokenize='unicode61',
  content_sync='memories'
);
`;

/**
 * SQL to create triggers for FTS5 sync
 * These triggers keep FTS5 in sync with memories table
 */
export const FTS_TRIGGERS_SQL = `
-- Trigger for INSERT
CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
  INSERT INTO memories_fts(rowid, title, content) 
  VALUES (NEW.rowid, NEW.title, NEW.content);
END;

-- Trigger for DELETE
CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, title, content) 
  VALUES('delete', OLD.rowid, OLD.title, OLD.content);
END;

-- Trigger for UPDATE
CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
  INSERT INTO memories_fts(memories_fts, rowid, title, content) 
  VALUES('delete', OLD.rowid, OLD.title, OLD.content);
  INSERT INTO memories_fts(rowid, title, content) 
  VALUES (NEW.rowid, NEW.title, NEW.content);
END;
`;

/**
 * Helper to rebuild FTS5 index
 * Useful after bulk operations or corruption
 */
export const FTS_REBUILD_SQL = `INSERT INTO memories_fts(memories_fts) VALUES('rebuild');`;

/**
 * Helper to optimize FTS5 index
 * Should be called periodically for better performance
 */
export const FTS_OPTIMIZE_SQL = `INSERT INTO memories_fts(memories_fts) VALUES('optimize');`;