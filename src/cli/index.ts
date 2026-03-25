/**
 * CLI Entry Point - cmx-memories command line interface
 * Phase 3: CLI Interface
 */

import { Command } from 'commander';
import { initializeDatabase, closeDatabase } from '../db/connection.js';
import * as memoryCommands from './commands/add.js';
import * as getCommands from './commands/get.js';
import * as listCommands from './commands/list.js';
import * as searchCommands from './commands/search.js';
import * as updateCommands from './commands/update.js';
import * as deleteCommands from './commands/delete.js';
import * as typeCommands from './commands/type.js';

const program = new Command();

program
  .name('cmx-memories')
  .description('Local-first personal memory system with SQLite + Drizzle and hybrid search')
  .version('1.0.0')
  .hook('preAction', async () => {
    // Initialize database before any command
    try {
      initializeDatabase();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    }
  })
  .hook('postAction', async () => {
    // Cleanup database connection
    closeDatabase();
  });

// Register all command modules
program.addCommand(memoryCommands.addCommand);
program.addCommand(getCommands.getCommand);
program.addCommand(listCommands.listCommand);
program.addCommand(searchCommands.searchCommand);
program.addCommand(updateCommands.updateCommand);
program.addCommand(deleteCommands.deleteCommand);
program.addCommand(typeCommands.typeCommand);

export { program };

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse(process.argv);
}
