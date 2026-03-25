/**
 * Add Command - Add a new memory
 * Phase 3: CLI Interface
 */

import { Command } from 'commander';
import { createMemory } from '../../services/memory.service.js';
import type { MemoryInput } from '../../types/index.js';

export const addCommand = new Command('add')
  .description('Add a new memory')
  .argument('<title>', 'Memory title')
  .argument('<content>', 'Memory content')
  .option('-t, --type <type>', 'Memory type (memory, idea, task, note)', 'memory')
  .option('-m, --metadata <json>', 'Metadata as JSON string', '{}')
  .option('-p, --project <project>', 'Project name')
  .option('-s, --session-id <session-id>', 'Session ID')
  .option('-k, --topic-key <topic-key>', 'Topic key')
  .action(async (title: string, content: string, options: {
    type?: string;
    metadata?: string;
    project?: string;
    sessionId?: string;
    topicKey?: string;
  }) => {
    try {
      let metadata: Record<string, unknown> = {};
      if (options.metadata && options.metadata !== '{}') {
        try {
          metadata = JSON.parse(options.metadata);
        } catch {
          console.error('Error: Invalid JSON for metadata');
          process.exit(1);
        }
      }

      // Add project to metadata if provided
      if (options.project) {
        metadata.project = options.project;
      }

      const input: MemoryInput = {
        title,
        content,
        type: options.type || 'memory',
        metadata,
      };

      // Add optional fields
      if (options.sessionId) {
        input.session_id = options.sessionId;
      }
      if (options.topicKey) {
        input.topic_key = options.topicKey;
      }

      const memory = await createMemory(input);

      console.log('Memory created successfully!');
      console.log(`ID: ${memory.id}`);
      console.log(`Title: ${memory.title}`);
      console.log(`Type: ${(memory as any).typeName || options.type || 'memory'}`);
      console.log(`Created: ${memory.createdAt.toISOString()}`);
    } catch (error) {
      console.error('Error creating memory:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
