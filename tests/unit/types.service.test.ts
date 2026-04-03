/**
 * Types Service Unit Tests
 */

import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';

import { createType, getType, listTypes, getDefaultTypes } from '../../src/services/types.service.js';
import { initializeDatabase } from '../../src/db/connection.js';

describe('Types Service', () => {
  beforeEach(() => {
    initializeDatabase();
  });

  it('should return default memory types', () => {
    const types = getDefaultTypes();

    assert.ok(types.length > 0, 'Should have default types');
  });

  it('should create a new memory type', async () => {
    const type = await createType('custom-type-' + Date.now(), {
      fields: [
        { name: 'category', type: 'string' },
      ],
    });

    assert.ok(type, 'Type should be created');
    assert.ok(type.name.includes('custom-type'), 'Type name should match');
  });

  it('should get a type by id', async () => {
    const created = await createType('get-test-type-' + Date.now(), { fields: [] });

    const type = await getType(created.id);

    assert.ok(type, 'Type should be retrieved');
    assert.ok(type?.name.includes('get-test-type'), 'Type name should match');
  });

  it('should list all memory types', async () => {
    const types = await listTypes();

    assert.ok(types.length > 0, 'Should have types');
  });
});
