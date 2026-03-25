/**
 * Goal Command - Set and manage project goals/objectives
 * Phase 3: CLI Interface
 */

import { Command } from 'commander';
import { createMemory } from '../../services/memory.service.js';

/**
 * Ensure goal type exists in the database
 */
async function ensureGoalType(): Promise<void> {
  const { getDatabase } = await import('../../db/connection.js');
  const db = getDatabase();
  
  // Check if type exists
  const existing = db.prepare('SELECT id FROM memory_types WHERE name = ?').get('goal') as { id: string } | undefined;
  
  if (!existing) {
    db.prepare(`
      INSERT INTO memory_types (id, name, schema, version, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?)
    `).run(
      'type-goal', 
      'goal', 
      JSON.stringify({ fields: [{ name: 'project', type: 'string' }, { name: 'targetDate', type: 'string' }] }),
      Date.now(),
      Date.now()
    );
  }
}

export const goalCommand = new Command('goal')
  .description('Manage project goals and objectives')
  .action(() => {
    console.log('Usage: goal <command>');
    console.log('');
    console.log('Commands:');
    console.log('  set <goal>    Set the project goal/objective');
    console.log('  get           Get the current project goal');
    console.log('  clear         Clear the project goal');
  });

// Goal set command
goalCommand
  .command('set')
  .description('Set the project goal/objective')
  .argument('<goal>', 'The goal or objective description')
  .option('-p, --project <project>', 'Project name')
  .action(async (goal: string, options: { project?: string }) => {
    try {
      // Ensure goal type exists
      await ensureGoalType();
      
      const memory = await createMemory({
        title: `Goal: ${goal.substring(0, 50)}${goal.length > 50 ? '...' : ''}`,
        content: goal,
        type: 'goal',
        metadata: {
          goal: goal,
          project: options.project,
          createdAt: new Date().toISOString(),
        },
      });

      console.log('✅ Project goal saved!');
      console.log(`   Goal: ${goal}`);
      console.log(`   ID: ${memory.id}`);
    } catch (error) {
      console.error('Error setting goal:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Goal get command
goalCommand
  .command('get')
  .description('Get the current project goal')
  .option('-p, --project <project>', 'Project name')
  .action(async (options: { project?: string }) => {
    try {
      // Ensure goal type exists
      await ensureGoalType();
      
      const { searchByFilter } = await import('../../services/search.service.js');
      
      const results = await searchByFilter({
        type: 'goal',
        project: options.project,
        limit: 1,
      });

      if (results.length === 0) {
        console.log('No goal set for this project.');
        return;
      }

      const goal = results[0];
      console.log('📌 Current Project Goal:');
      console.log('');
      console.log(goal.content);
      console.log('');
      console.log(`   ID: ${goal.id}`);
      console.log(`   Created: ${goal.createdAt.toISOString()}`);
    } catch (error) {
      console.error('Error getting goal:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Goal clear command
goalCommand
  .command('clear')
  .description('Clear the project goal')
  .option('-p, --project <project>', 'Project name')
  .action(async (options: { project?: string }) => {
    try {
      // Ensure goal type exists
      await ensureGoalType();
      
      const { searchByFilter } = await import('../../services/search.service.js');
      const { deleteMemory } = await import('../../services/memory.service.js');
      
      const results = await searchByFilter({
        type: 'goal',
        project: options.project,
        limit: 1,
      });

      if (results.length === 0) {
        console.log('No goal to clear.');
        return;
      }

      await deleteMemory(results[0].id);
      console.log('✅ Project goal cleared.');
    } catch (error) {
      console.error('Error clearing goal:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });