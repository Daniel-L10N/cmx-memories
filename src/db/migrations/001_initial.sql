-- Initial Database Schema
-- Creates all required tables for cmx-memories

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

-- Memory Metadata Table (key-value pairs)
CREATE TABLE IF NOT EXISTS memory_metadata (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_memories_type_id ON memories(type_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_metadata_memory_id ON memory_metadata(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_metadata_key ON memory_metadata(key);

-- FTS5 Virtual Table for full-text search (created separately via fts.ts)
-- CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
--   title,
--   content,
--   tokenize='unicode61'
-- );