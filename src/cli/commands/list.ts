/**
 * List Command - List memories with filtering and pagination
 * Phase 3: CLI Interface
 */

import { Command } from 'commander';
import { listMemories } from '../../services/memory.service.js';
import type { ListOptions } from '../../types/index.js';

export const listCommand = new Command('list')
  .description('List memories with optional filters')
  .option('-t, --type <type>', 'Filter by memory type (memory, idea, task, note)')
  .option('-l, --limit <limit>', 'Limit number of results', '10')
  .option('-o, --offset <offset>', 'Offset for pagination', '0')
  .option('--order-by <field>', 'Order by field (createdAt, updatedAt, title)', 'createdAt')
  .option('--order-dir <direction>', 'Order direction (asc, desc)', 'desc')
  .action(async (options: {
    type?: string;
    limit?: string;
    offset?: string;
    orderBy?: string;
    orderDir?: string;
  }) => {
    try {
      const listOptions: ListOptions = {
        type: options.type,
        limit: parseInt(options.limit || '10', 10),
        offset: parseInt(options.offset || '0', 10),
        orderBy: (options.orderBy as ListOptions['orderBy']) || 'createdAt',
        orderDir: (options.orderDir as ListOptions['orderDir']) || 'desc',
      };

      const memories = await listMemories(listOptions);

      if (memories.length === 0) {
        console.log('No memories found.');
        return;
      }

      console.log(`Found ${memories.length} memories:\n`);
      
      memories.forEach((memory, index) => {
        const typeName = (memory as any).typeName || 'memory';
        console.log(`${index + 1}. ${memory.title}`);
        console.log(`   ID: ${memory.id}`);
        console.log(`   Type: ${typeName}`);
        console.log(`   Created: ${memory.createdAt.toISOString()}`);
        console.log(`   Updated: ${memory.updatedAt.toISOString()}`);
        
        // Show content preview
        const preview = memory.content.length > 80 
          ? memory.content.substring(0, 77) + '...' 
          : memory.content;
        console.log(`   Preview: ${preview}`);
        console.log();
      });
    } catch (error) {
      console.error('Error listing memories:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
