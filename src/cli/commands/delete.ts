/**
 * Delete Command - Delete a memory
 * Phase 3: CLI Interface
 */

import { Command } from 'commander';
import { deleteMemory } from '../../services/memory.service.js';

export const deleteCommand = new Command('delete')
  .description('Delete a memory by ID')
  .argument('<id>', 'Memory ID')
  .option('-f, --force', 'Skip confirmation prompt', false)
  .action(async (id: string, options: { force?: boolean }) => {
    try {
      // If not forced, confirm deletion
      if (!options.force) {
        const readline = await import('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        await new Promise<void>((resolve) => {
          rl.question(`Are you sure you want to delete memory "${id}"? (y/N) `, (answer) => {
            rl.close();
            if (answer.toLowerCase() !== 'y') {
              console.log('Deletion cancelled.');
              process.exit(0);
            }
            resolve();
          });
        });
      }

      await deleteMemory(id);

      console.log(`Memory ${id} deleted successfully.`);
    } catch (error) {
      console.error('Error deleting memory:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
