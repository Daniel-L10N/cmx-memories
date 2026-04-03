/**
 * Search Service Unit Tests
 */

import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';

import { createMemory } from '../../src/services/memory.service.js';
import { search, advancedSearch } from '../../src/services/search.service.js';
import { initializeDatabase } from '../../src/db/connection.js';

describe('Search Service', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  it('should find memories by keyword', async () => {
    await createMemory({
      title: 'JavaScript Tips',
      content: 'Learn about closures and prototypes',
      type: 'memory',
    });
    await createMemory({
      title: 'Python Guide',
      content: 'Understanding list comprehensions',
      type: 'memory',
    });

    const results = await search('JavaScript');

    assert.ok(results.length > 0, 'Should find results');
  });

  it('should return empty for no matches', async () => {
    await createMemory({
      title: 'Some Memory',
      content: 'Some content',
      type: 'memory',
    });

    const results = await search('nonexistent-term-12345');

    assert.strictEqual(results.length, 0, 'Should return no results');
  });

  it('should search with empty query and filters', async () => {
    await createMemory({
      title: 'Project Alpha',
      content: 'Content',
      type: 'memory',
      metadata: { project: 'alpha' },
    });

    const results = await advancedSearch('', {
      project: 'alpha',
    });

    assert.ok(results.length > 0, 'Should find results by filter');
  });
});
