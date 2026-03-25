/**
 * cmx-memories MCP Server
 * 
 * Expone las herramientas de cmx-memories como servidor MCP
 * compatible con cualquier cliente que soporte el protocolo MCP.
 * 
 * Ejecución:
 *   npm run mcp
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initializeDatabase } from '../db/connection.js';
import { createMemory, getMemory, updateMemory, deleteMemory, listMemories } from '../services/memory.service.js';
import { advancedSearch, searchByFilter } from '../services/search.service.js';
import * as z from 'zod/v4';

// ─── Initialize Database ───────────────────────────────────────────────────────

initializeDatabase();

// ─── MCP Server Setup ───────────────────────────────────────────────────────────

const mcpServer = new McpServer({
  name: 'cmx-memories',
  version: '1.0.0',
});

// ─── Register Tools ───────────────────────────────────────────────────────────

// mem_save - Save a memory
mcpServer.registerTool('mem_save', {
  description: 'Save a memory with structured content (decision, bugfix, architecture, etc.)',
  inputSchema: {
    title: z.string().describe('Short searchable title (e.g., "Fixed N+1 query")'),
    content: z.string().describe('Full content with What/Why/Where/Learned format'),
    type: z.string().optional().describe('Type: decision, architecture, bugfix, pattern, config, discovery, preference'),
    topic_key: z.string().optional().describe('Stable key for evolving topics'),
    project: z.string().optional().describe('Project name'),
    metadata: z.object().optional().describe('Additional metadata'),
  },
}, async ({ title, content, type, topic_key, project, metadata }) => {
  const typeName = type || 'memory';
  await ensureTypeExists(typeName);
  
  const memory = await createMemory({
    title,
    content,
    type: typeName,
    metadata: {
      ...metadata,
      project,
      topic_key,
    },
  });

  return {
    content: [{ type: 'text', text: JSON.stringify({ id: memory.id, title: memory.title, type: typeName }, null, 2) }],
  };
});

// mem_search - Search memories
mcpServer.registerTool('mem_search', {
  description: 'Search memories by keyword with optional filters',
  inputSchema: {
    query: z.string().describe('Search query'),
    type: z.string().optional().describe('Filter by memory type'),
    project: z.string().optional().describe('Filter by project'),
    limit: z.number().optional().describe('Number of results'),
  },
}, async ({ query, type, project, limit }) => {
  const results = await advancedSearch(query || '', {
    query: query || '',
    type,
    project,
    limit: limit || 10,
  });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        total: results.length,
        results: results.map(r => ({
          id: r.id,
          title: r.title,
          contentPreview: r.contentPreview,
          type: r.type,
          createdAt: r.createdAt,
        })),
      }, null, 2),
    }],
  };
});

// mem_get - Get memory by ID
mcpServer.registerTool('mem_get', {
  description: 'Get a memory by ID',
  inputSchema: {
    id: z.string().describe('Memory ID'),
  },
}, async ({ id }) => {
  const memory = await getMemory(id);
  if (!memory) {
    return { content: [{ type: 'text', text: `Memory not found: ${id}` }], isError: true };
  }
  return { content: [{ type: 'text', text: JSON.stringify(memory, null, 2) }] };
});

// mem_update - Update memory
mcpServer.registerTool('mem_update', {
  description: 'Update an existing memory',
  inputSchema: {
    id: z.string().describe('Memory ID'),
    title: z.string().optional().describe('New title'),
    content: z.string().optional().describe('New content'),
    type: z.string().optional().describe('New type'),
    metadata: z.object().optional().describe('New metadata'),
  },
}, async ({ id, ...updateData }) => {
  const memory = await updateMemory(id, updateData);
  return { content: [{ type: 'text', text: JSON.stringify(memory, null, 2) }] };
});

// mem_delete - Delete memory
mcpServer.registerTool('mem_delete', {
  description: 'Delete a memory by ID',
  inputSchema: {
    id: z.string().describe('Memory ID'),
  },
}, async ({ id }) => {
  await deleteMemory(id);
  return { content: [{ type: 'text', text: `Memory ${id} deleted successfully` }] };
});

// mem_list - List memories
mcpServer.registerTool('mem_list', {
  description: 'List all memories with optional filters',
  inputSchema: {
    type: z.string().optional().describe('Filter by type'),
    project: z.string().optional().describe('Filter by project'),
    limit: z.number().optional().describe('Limit results'),
  },
}, async ({ type, project, limit }) => {
  let memories;
  if (project) {
    // Use searchByFilter for project filtering
    const results = await searchByFilter({ type, project, limit: limit || 10 });
    memories = results.map(r => ({
      id: r.id,
      typeId: r.type,
      title: r.title,
      content: r.content,
      createdAt: r.createdAt,
      updatedAt: r.createdAt,
    }));
  } else {
    memories = await listMemories({ type, limit: limit || 10 });
  }
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        total: memories.length,
        memories: memories.map(m => ({ id: m.id, title: m.title, type: m.typeId, createdAt: m.createdAt })),
      }, null, 2),
    }],
  };
});

// goal_set - Set project goal
mcpServer.registerTool('goal_set', {
  description: 'Set the project goal/objective',
  inputSchema: {
    goal: z.string().describe('The goal description'),
    project: z.string().optional().describe('Project name'),
  },
}, async ({ goal, project }) => {
  await ensureTypeExists('goal');
  
  const memory = await createMemory({
    title: `Goal: ${goal.substring(0, 50)}${goal.length > 50 ? '...' : ''}`,
    content: goal,
    type: 'goal',
    metadata: { goal, project },
  });

  return { content: [{ type: 'text', text: `Goal set: ${goal}\nID: ${memory.id}` }] };
});

// goal_get - Get project goal
mcpServer.registerTool('goal_get', {
  description: 'Get the current project goal',
  inputSchema: {
    project: z.string().optional().describe('Project name'),
  },
}, async ({ project }) => {
  const results = await searchByFilter({ type: 'goal', project, limit: 1 });
  
  if (results.length === 0) {
    return { content: [{ type: 'text', text: 'No goal set for this project.' }] };
  }

  return { content: [{ type: 'text', text: `Current Project Goal:\n\n${results[0].content}` }] };
});

// mem_session_summary - Save session summary
mcpServer.registerTool('mem_session_summary', {
  description: 'Save a session summary at the end of work',
  inputSchema: {
    goal: z.string().describe('What was being worked on'),
    instructions: z.string().optional().describe('User preferences or constraints'),
    discoveries: z.string().optional().describe('Technical findings and learnings'),
    accomplished: z.string().describe('What was completed'),
    nextSteps: z.string().optional().describe('What remains to do'),
    project: z.string().optional().describe('Project name'),
  },
}, async ({ goal, instructions, discoveries, accomplished, nextSteps, project }) => {
  const content = `
## Goal
${goal}

## Instructions
${instructions || 'None'}

## Discoveries
${discoveries || 'None'}

## Accomplished
${accomplished}

## Next Steps
${nextSteps || 'None'}
`.trim();

  await ensureTypeExists('session_summary');

  const memory = await createMemory({
    title: `Session Summary: ${project || 'unknown'}`,
    content,
    type: 'session_summary',
    metadata: { project, session: true },
  });

  return { content: [{ type: 'text', text: `Session summary saved.\nID: ${memory.id}` }] };
});

// mem_context - Get context from previous sessions
mcpServer.registerTool('mem_context', {
  description: 'Get context from previous sessions',
  inputSchema: {
    project: z.string().optional().describe('Project name'),
    limit: z.number().optional().describe('Number of recent memories'),
  },
}, async ({ project, limit }) => {
  const results = await searchByFilter({ project, limit: limit || 5 });
  
  const context = results.map(r => `- ${r.title}: ${r.contentPreview}`).join('\n');
  return { content: [{ type: 'text', text: context || 'No previous context found.' }] };
});

// ─── Helper ───────────────────────────────────────────────────────────────────

async function ensureTypeExists(typeName: string): Promise<void> {
  const { getDatabase } = await import('../db/connection.js');
  const db = getDatabase();
  
  const existing = db.prepare('SELECT id FROM memory_types WHERE name = ?').get(typeName) as { id: string } | undefined;
  
  if (!existing) {
    db.prepare(`
      INSERT INTO memory_types (id, name, schema, version, created_at, updated_at)
      VALUES (?, ?, NULL, 1, ?, ?)
    `).run(`type-${typeName}`, typeName, Date.now(), Date.now());
  }
}

// ─── Run Server ───────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('cmx-memories MCP server running...');
}

main().catch(error => {
  console.error('Server error:', error);
  process.exit(1);
});