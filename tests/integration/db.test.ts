/**
 * Database Integration Tests
 */

import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';

import { initializeDatabase, getDatabase } from '../../src/db/connection.js';
import { rmSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const TEST_DB_DIR = join(process.cwd(), 'test-data');
const TEST_DB_PATH = join(TEST_DB_DIR, 'test.db');

describe('Database Integration', () => {
  beforeEach(() => {
    if (existsSync(TEST_DB_PATH)) {
      rmSync(TEST_DB_PATH);
    }
    if (!existsSync(TEST_DB_DIR)) {
      mkdirSync(TEST_DB_DIR, { recursive: true });
    }
    process.env.CMX_DB_PATH = TEST_DB_PATH;
    initializeDatabase();
  });

  it('should create database file', () => {
    assert.ok(existsSync(TEST_DB_PATH), 'Database file should exist');
  });

  it('should create memory_types table', () => {
    const db = getDatabase();
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='memory_types'").get();
    
    assert.ok(result, 'memory_types table should exist');
  });

  it('should create memories table', () => {
    const db = getDatabase();
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='memories'").get();
    
    assert.ok(result, 'memories table should exist');
  });

  it('should create FTS5 virtual table', () => {
    const db = getDatabase();
    const result = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='memories_fts'").get();
    
    assert.ok(result, 'FTS5 table should exist');
  });

  it('should seed default memory types', () => {
    const db = getDatabase();
    const result = db.prepare('SELECT COUNT(*) as count FROM memory_types').get() as { count: number };
    
    assert.ok(result.count > 0, 'Should have default types');
  });

  describe('FTS5 Triggers', () => {
    it('should index new memories automatically', () => {
      const db = getDatabase();
      
      db.prepare(`
        INSERT INTO memories (id, type_id, title, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('test-fts-1', 'type-memory', 'Test FTS Title', 'Test FTS Content', Date.now(), Date.now());

      const ftsResult = db.prepare(`
        SELECT * FROM memories_fts WHERE memories_fts MATCH 'Test'
      `).all();

      assert.ok(ftsResult.length > 0, 'FTS should index new memories');
    });
  });
});
