/**
 * Memory Service Unit Tests
 */

import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';

import { createMemory, getMemory, updateMemory, deleteMemory, listMemories } from '../../src/services/memory.service.js';

describe('Memory Service', () => {
  beforeEach(async () => {
    const { initializeDatabase } = await import('../../src/db/connection.js');
    initializeDatabase();
  });

  it('should create a new memory', async () => {
    const input = {
      title: 'Test Memory',
      content: 'This is a test memory content',
      type: 'memory',
    };

    const memory = await createMemory(input);

    assert.ok(memory, 'Memory should be created');
    assert.ok(memory.id, 'Memory ID should be defined');
    assert.match(memory.id, /^mem-/, 'Memory ID should match pattern');
    assert.strictEqual(memory.title, 'Test Memory');
    assert.strictEqual(memory.content, 'This is a test memory content');
    assert.ok(memory.createdAt instanceof Date);
    assert.ok(memory.updatedAt instanceof Date);
  });

  it('should create memory with metadata', async () => {
    const input = {
      title: 'Memory with Metadata',
      content: 'Content with metadata',
      type: 'memory',
      metadata: {
        project: 'test-project',
        priority: 'high',
      },
    };

    const memory = await createMemory(input);

    assert.ok(memory.metadata, 'Metadata should be defined');
    assert.strictEqual(memory.metadata?.project, 'test-project');
    assert.strictEqual(memory.metadata?.priority, 'high');
  });

  it('should get a memory by id', async () => {
    const created = await createMemory({
      title: 'Get Test',
      content: 'Content',
      type: 'memory',
    });

    const retrieved = await getMemory(created.id);

    assert.ok(retrieved, 'Retrieved memory should be defined');
    assert.strictEqual(retrieved?.id, created.id);
    assert.strictEqual(retrieved?.title, 'Get Test');
  });

  it('should return null for non-existent memory', async () => {
    const result = await getMemory('non-existent-id');

    assert.strictEqual(result, null);
  });

  it('should update memory title', async () => {
    const created = await createMemory({
      title: 'Original Title',
      content: 'Original Content',
      type: 'memory',
    });

    const updated = await updateMemory(created.id, {
      title: 'Updated Title',
    });

    assert.strictEqual(updated.title, 'Updated Title');
    assert.strictEqual(updated.content, 'Original Content');
  });

  it('should delete a memory', async () => {
    const created = await createMemory({
      title: 'To Delete',
      content: 'Content',
      type: 'memory',
    });

    await deleteMemory(created.id);

    const result = await getMemory(created.id);
    assert.strictEqual(result, null);
  });

  it('should list all memories', async () => {
    await createMemory({ title: 'Memory 1', content: 'Content 1', type: 'memory' });
    await createMemory({ title: 'Memory 2', content: 'Content 2', type: 'memory' });

    const memories = await listMemories();

    assert.ok(memories.length >= 2, 'Should have at least 2 memories');
  });

  it('should filter by type', async () => {
    await createMemory({ title: 'Memory 1', content: 'Content', type: 'memory' });
    await createMemory({ title: 'Idea 1', content: 'Content', type: 'idea' });

    const ideaMemories = await listMemories({ type: 'idea' });

    assert.ok(ideaMemories.every(m => m.typeId.includes('idea')), 'All memories should be ideas');
  });
});
