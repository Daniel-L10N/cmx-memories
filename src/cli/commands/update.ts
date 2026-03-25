/**
 * Update Command - Update an existing memory
 * Phase 3: CLI Interface
 */

import { Command } from 'commander';
import { updateMemory } from '../../services/memory.service.js';
import type { MemoryUpdateInput } from '../../types/index.js';

export const updateCommand = new Command('update')
  .description('Update an existing memory')
  .argument('<id>', 'Memory ID')
  .option('-t, --title <title>', 'New title')
  .option('-c, --content <content>', 'New content')
  .option('-T, --type <type>', 'New type (memory, idea, task, note)')
  .option('-m, --metadata <json>', 'New metadata as JSON string')
  .action(async (id: string, options: {
    title?: string;
    content?: string;
    type?: string;
    metadata?: string;
  }) => {
    try {
      // Check if at least one update option is provided
      if (!options.title && !options.content && !options.type && !options.metadata) {
        console.error('Error: At least one update option must be provided (--title, --content, --type, --metadata)');
        process.exit(1);
      }

      const updateInput: MemoryUpdateInput = {};

      if (options.title) {
        updateInput.title = options.title;
      }
      if (options.content) {
        updateInput.content = options.content;
      }
      if (options.type) {
        updateInput.type = options.type;
      }
      if (options.metadata) {
        try {
          updateInput.metadata = JSON.parse(options.metadata);
        } catch {
          console.error('Error: Invalid JSON for metadata');
          process.exit(1);
        }
      }

      const memory = await updateMemory(id, updateInput);

      console.log('Memory updated successfully!');
      console.log(`ID: ${memory.id}`);
      console.log(`Title: ${memory.title}`);
      console.log(`Type: ${(memory as any).typeName || options.type || 'memory'}`);
      console.log(`Updated: ${memory.updatedAt.toISOString()}`);
    } catch (error) {
      console.error('Error updating memory:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
