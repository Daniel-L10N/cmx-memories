export { memoryTypes, memories, memoryMetadata } from './schema.js';
export type { 
  Memory, 
  NewMemory, 
  MemoryType, 
  NewMemoryType, 
  MemoryMetadata, 
  NewMemoryMetadata 
} from './schema.js';
export { 
  FTS_CREATE_SQL, 
  FTS_TRIGGERS_SQL, 
  FTS_REBUILD_SQL, 
  FTS_OPTIMIZE_SQL 
} from './fts.js';
export { db, getDatabase } from './connection.js';
export { initializeDatabase, getDbPath } from './connection.js';