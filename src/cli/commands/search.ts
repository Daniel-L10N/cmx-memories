/**
 * Search Command - Search memories by keyword
 * Phase 3: CLI Interface
 */

import { Command } from 'commander';
import { search } from '../../services/search.service.js';
import type { SearchOptions } from '../../types/index.js';

export const searchCommand = new Command('search')
  .description('Search memories by keyword')
  .argument('<query>', 'Search query')
  .option('-t, --type <type>', 'Filter by memory type')
  .option('-p, --project <project>', 'Filter by project')
  .option('-l, --limit <limit>', 'Limit number of results', '10')
  .option('--no-vectors', 'Disable vector search, use FTS5 only')
  .action(async (query: string, options: {
    type?: string;
    project?: string;
    limit?: string;
    vectors?: boolean;
  }) => {
    try {
      const searchOptions: SearchOptions = {
        query,
        type: options.type,
        project: options.project,
        limit: parseInt(options.limit || '10', 10),
        enableVectors: options.vectors !== false,
      };

      const results = await search(searchOptions.query, searchOptions);

      if (results.length === 0) {
        console.log('No results found.');
        return;
      }

      console.log(`Found ${results.length} results:\n`);
      
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   ID: ${result.id}`);
        console.log(`   Type: ${result.type}`);
        console.log(`   Score: ${result.score.toFixed(2)}`);
        console.log(`   Created: ${result.createdAt.toISOString()}`);
        
        // Show content preview
        const preview = result.contentPreview || (result.content.length > 80 
          ? result.content.substring(0, 77) + '...' 
          : result.content);
        console.log(`   Preview: ${preview}`);
        console.log();
      });
    } catch (error) {
      console.error('Error searching memories:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
