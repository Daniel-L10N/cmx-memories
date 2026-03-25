/**
 * Type Command - Memory Types management
 * Phase 3: CLI Interface
 */

import { Command } from 'commander';
import { 
  createType, 
  getType, 
  getTypeByName, 
  listTypes, 
  updateType, 
  deleteType 
} from '../../services/types.service.js';
import type { TypeSchema } from '../../types/index.js';

// ------------------------------------------------------------------
// Subcommand: type create
// ------------------------------------------------------------------
const createTypeCommand = new Command('create')
  .description('Create a new memory type')
  .argument('<name>', 'Type name')
  .option('-s, --schema <json>', 'Type schema as JSON string')
  .action(async (name: string, options: { schema?: string }) => {
    try {
      let schema: TypeSchema | undefined;
      if (options.schema) {
        try {
          schema = JSON.parse(options.schema);
        } catch {
          console.error('Error: Invalid JSON for schema');
          process.exit(1);
        }
      }

      const newType = await createType(name, schema);

      console.log('Memory type created successfully!');
      console.log(`ID: ${newType.id}`);
      console.log(`Name: ${newType.name}`);
      console.log(`Version: ${newType.version}`);
      console.log(`Created: ${newType.createdAt.toISOString()}`);
      
      if (newType.schema) {
        console.log('Schema:');
        console.log(JSON.stringify(newType.schema, null, 2));
      }
    } catch (error) {
      console.error('Error creating type:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ------------------------------------------------------------------
// Subcommand: type get
// ------------------------------------------------------------------
const getTypeCommand = new Command('get')
  .description('Get a memory type by ID or name')
  .argument('<identifier>', 'Type ID or name')
  .action(async (identifier: string) => {
    try {
      // Try to get by name first, then by ID
      let type = await getTypeByName(identifier);
      if (!type) {
        type = await getType(identifier);
      }

      if (!type) {
        console.error(`Error: Type not found: ${identifier}`);
        process.exit(1);
      }

      console.log('='.repeat(60));
      console.log(`ID: ${type.id}`);
      console.log(`Name: ${type.name}`);
      console.log(`Version: ${type.version}`);
      console.log(`Created: ${type.createdAt.toISOString()}`);
      console.log(`Updated: ${type.updatedAt.toISOString()}`);
      
      if (type.schema) {
        console.log('-'.repeat(60));
        console.log('Schema:');
        console.log(JSON.stringify(type.schema, null, 2));
      }
      
      console.log('='.repeat(60));
    } catch (error) {
      console.error('Error getting type:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ------------------------------------------------------------------
// Subcommand: type list
// ------------------------------------------------------------------
const listTypesCommand = new Command('list')
  .description('List all memory types')
  .action(async () => {
    try {
      const types = await listTypes();

      if (types.length === 0) {
        console.log('No memory types found.');
        return;
      }

      console.log(`Found ${types.length} memory types:\n`);
      
      types.forEach((type, index) => {
        console.log(`${index + 1}. ${type.name}`);
        console.log(`   ID: ${type.id}`);
        console.log(`   Version: ${type.version}`);
        console.log(`   Created: ${type.createdAt.toISOString()}`);
        
        if (type.schema) {
          console.log(`   Schema: ${JSON.stringify(type.schema)}`);
        }
        console.log();
      });
    } catch (error) {
      console.error('Error listing types:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ------------------------------------------------------------------
// Subcommand: type update
// ------------------------------------------------------------------
const updateTypeCommand = new Command('update')
  .description('Update a memory type schema')
  .argument('<id>', 'Type ID')
  .option('-s, --schema <json>', 'New schema as JSON string')
  .action(async (id: string, options: { schema?: string }) => {
    try {
      if (!options.schema) {
        console.error('Error: Schema must be provided with --schema option');
        process.exit(1);
      }

      let schema: TypeSchema;
      try {
        schema = JSON.parse(options.schema);
      } catch {
        console.error('Error: Invalid JSON for schema');
        process.exit(1);
      }

      const updatedType = await updateType(id, schema);

      console.log('Memory type updated successfully!');
      console.log(`ID: ${updatedType.id}`);
      console.log(`Name: ${updatedType.name}`);
      console.log(`Version: ${updatedType.version}`);
      console.log(`Updated: ${updatedType.updatedAt.toISOString()}`);
      
      if (updatedType.schema) {
        console.log('Schema:');
        console.log(JSON.stringify(updatedType.schema, null, 2));
      }
    } catch (error) {
      console.error('Error updating type:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ------------------------------------------------------------------
// Subcommand: type delete
// ------------------------------------------------------------------
const deleteTypeCommand = new Command('delete')
  .description('Delete a memory type')
  .argument('<id>', 'Type ID')
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
          rl.question(`Are you sure you want to delete type "${id}"? (y/N) `, (answer) => {
            rl.close();
            if (answer.toLowerCase() !== 'y') {
              console.log('Deletion cancelled.');
              process.exit(0);
            }
            resolve();
          });
        });
      }

      await deleteType(id);

      console.log(`Type ${id} deleted successfully.`);
    } catch (error) {
      console.error('Error deleting type:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Create the parent command for type management
export const typeCommand = new Command('type')
  .description('Manage memory types')
  .addCommand(createTypeCommand)
  .addCommand(getTypeCommand)
  .addCommand(listTypesCommand)
  .addCommand(updateTypeCommand)
  .addCommand(deleteTypeCommand);
