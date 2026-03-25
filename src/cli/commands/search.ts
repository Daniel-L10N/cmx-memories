/**
 * Search Command - Search memories with advanced filters
 * Phase 3: CLI Interface
 */

import { Command } from 'commander';
import { search, advancedSearch } from '../../services/search.service.js';
import type { SearchOptions, AdvancedSearchOptions } from '../../types/index.js';

export const searchCommand = new Command('search')
  .description('Search memories by keyword with optional filters')
  .argument('<query>', 'Search query (leave empty for filter-only search)')
  .option('-t, --type <type>', 'Filter by memory type (memory, idea, task, note)')
  .option('-p, --project <project>', 'Filter by project name')
  .option('-l, --limit <limit>', 'Limit number of results', '10')
  .option('--no-vectors', 'Disable vector search, use FTS5 only')
  // Advanced filters
  .option('--created-after <date>', 'Filter by created date (after): YYYY-MM-DD')
  .option('--created-before <date>', 'Filter by created date (before): YYYY-MM-DD')
  .option('--updated-after <date>', 'Filter by updated date (after): YYYY-MM-DD')
  .option('--updated-before <date>', 'Filter by updated date (before): YYYY-MM-DD')
  .option('--tags <tags>', 'Filter by tags (comma-separated)')
  .option('--title-contain <text>', 'Search in title')
  .option('--content-contain <text>', 'Search in content')
  .option('-s, --sort-by <sort>', 'Sort by: relevance, createdAt, updatedAt, title', 'relevance')
  .option('-o, --sort-dir <dir>', 'Sort direction: asc, desc', 'desc')
  .action(async (query: string, options: {
    type?: string;
    project?: string;
    limit?: string;
    vectors?: boolean;
    createdAfter?: string;
    createdBefore?: string;
    updatedAfter?: string;
    updatedBefore?: string;
    tags?: string;
    titleContain?: string;
    contentContain?: string;
    sortBy?: string;
    sortDir?: string;
  }) => {
    try {
      // Si hay filtros avanzados, usar advancedSearch
      const hasAdvancedFilters = 
        options.createdAfter || options.createdBefore ||
        options.updatedAfter || options.updatedBefore ||
        options.tags || options.titleContain || options.contentContain;
      
      if (hasAdvancedFilters || options.sortBy !== 'relevance' || options.sortDir !== 'desc') {
        const advancedOptions: AdvancedSearchOptions = {
          query,
          type: options.type,
          project: options.project,
          limit: parseInt(options.limit || '10', 10),
          enableVectors: options.vectors !== false,
          createdAfter: options.createdAfter ? new Date(options.createdAfter) : undefined,
          createdBefore: options.createdBefore ? new Date(options.createdBefore) : undefined,
          updatedAfter: options.updatedAfter ? new Date(options.updatedAfter) : undefined,
          updatedBefore: options.updatedBefore ? new Date(options.updatedBefore) : undefined,
          tags: options.tags ? options.tags.split(',').map(t => t.trim()) : undefined,
          titleContains: options.titleContain,
          contentContains: options.contentContain,
          sortBy: (options.sortBy as any) || 'relevance',
          sortDir: (options.sortDir as any) || 'desc',
        };
        
        const results = await advancedSearch(query, advancedOptions);
        displayResults(results);
      } else {
        // Búsqueda simple
        const searchOptions: SearchOptions = {
          query,
          type: options.type,
          project: options.project,
          limit: parseInt(options.limit || '10', 10),
          enableVectors: options.vectors !== false,
        };

        const results = await search(searchOptions.query, searchOptions);
        displayResults(results);
      }
    } catch (error) {
      console.error('Error searching memories:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

function displayResults(results: any[]): void {
  if (results.length === 0) {
    console.log('No results found.');
    return;
  }

  console.log(`Found ${results.length} results:\n`);
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.title}`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Type: ${result.type}`);
    console.log(`   Score: ${result.score?.toFixed(2) || 'N/A'}`);
    console.log(`   Created: ${result.createdAt.toISOString()}`);
    
    // Show content preview
    const preview = result.contentPreview || (result.content?.length > 80 
      ? result.content.substring(0, 77) + '...' 
      : result.content);
    console.log(`   Preview: ${preview}`);
    console.log();
  });
}
