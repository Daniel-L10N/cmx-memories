/**
 * Get Command - Get a memory by ID
 * Phase 3: CLI Interface
 */

import { Command } from 'commander';
import { getMemory } from '../../services/memory.service.js';

export const getCommand = new Command('get')
  .description('Get a memory by ID')
  .argument('<id>', 'Memory ID')
  .action(async (id: string) => {
    try {
      const memory = await getMemory(id);

      if (!memory) {
        console.error(`Error: Memory not found: ${id}`);
        process.exit(1);
      }

      console.log('='.repeat(60));
      console.log(`ID: ${memory.id}`);
      console.log(`Title: ${memory.title}`);
      console.log(`Type: ${(memory as any).typeName || 'memory'}`);
      console.log(`Created: ${memory.createdAt.toISOString()}`);
      console.log(`Updated: ${memory.updatedAt.toISOString()}`);
      console.log('-'.repeat(60));
      console.log('Content:');
      console.log(memory.content);
      
      if (memory.metadata && Object.keys(memory.metadata).length > 0) {
        console.log('-'.repeat(60));
        console.log('Metadata:');
        console.log(JSON.stringify(memory.metadata, null, 2));
      }
      
      console.log('='.repeat(60));
    } catch (error) {
      console.error('Error getting memory:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
