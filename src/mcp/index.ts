/**
 * cmx-memories MCP Server
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from '../db/connection.js';
import { createMemory, getMemory, updateMemory, deleteMemory, listMemories } from '../services/memory.service.js';
import { advancedSearch, searchByFilter } from '../services/search.service.js';
import * as z from 'zod/v4';

initializeDatabase();

function createMcpServer() {
  const mcpServer = new McpServer({
    name: 'cmx-memories',
    version: '1.0.0',
  });

  mcpServer.registerTool('mem_save', {
    description: 'Save a memory with structured content',
    inputSchema: {
      title: z.string().describe('Short searchable title'),
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
      metadata: { ...metadata, project, topic_key },
    });

    return { content: [{ type: 'text', text: JSON.stringify({ id: memory.id, title: memory.title, type: typeName }, null, 2) }] };
  });

  mcpServer.registerTool('mem_search', {
    description: 'Search memories by keyword',
    inputSchema: {
      query: z.string().describe('Search query'),
      type: z.string().optional().describe('Filter by type'),
      project: z.string().optional().describe('Filter by project'),
      limit: z.number().optional().describe('Number of results'),
    },
  }, async ({ query, type, project, limit }) => {
    const results = await advancedSearch(query || '', { query: query || '', type, project, limit: limit || 10 });
    return { content: [{ type: 'text', text: JSON.stringify({ total: results.length, results }, null, 2) }] };
  });

  mcpServer.registerTool('mem_get', {
    description: 'Get a memory by ID',
    inputSchema: { id: z.string().describe('Memory ID') },
  }, async ({ id }) => {
    const memory = await getMemory(id);
    if (!memory) return { content: [{ type: 'text', text: 'Memory not found: ' + id }], isError: true };
    return { content: [{ type: 'text', text: JSON.stringify(memory, null, 2) }] };
  });

  mcpServer.registerTool('mem_update', {
    description: 'Update memory',
    inputSchema: {
      id: z.string().describe('Memory ID'),
      title: z.string().optional(),
      content: z.string().optional(),
      type: z.string().optional(),
      metadata: z.object().optional(),
    },
  }, async ({ id, ...updateData }) => {
    const memory = await updateMemory(id, updateData);
    return { content: [{ type: 'text', text: JSON.stringify(memory, null, 2) }] };
  });

  mcpServer.registerTool('mem_delete', {
    description: 'Delete memory',
    inputSchema: { id: z.string().describe('Memory ID') },
  }, async ({ id }) => {
    await deleteMemory(id);
    return { content: [{ type: 'text', text: 'Memory ' + id + ' deleted' }] };
  });

  mcpServer.registerTool('mem_list', {
    description: 'List memories',
    inputSchema: {
      type: z.string().optional(),
      project: z.string().optional(),
      limit: z.number().optional(),
    },
  }, async ({ type, project, limit }) => {
    let memories;
    if (project) {
      const results = await searchByFilter({ type, project, limit: limit || 10 });
      memories = results.map(r => ({ id: r.id, title: r.title, type: r.type, createdAt: r.createdAt }));
    } else {
      memories = await listMemories({ type, limit: limit || 10 });
    }
    return { content: [{ type: 'text', text: JSON.stringify({ total: memories.length, memories }, null, 2) }] };
  });

  mcpServer.registerTool('goal_set', {
    description: 'Set project goal',
    inputSchema: { goal: z.string().describe('The goal'), project: z.string().optional() },
  }, async ({ goal, project }) => {
    await ensureTypeExists('goal');
    const memory = await createMemory({
      title: 'Goal: ' + goal.substring(0, 50) + (goal.length > 50 ? '...' : ''),
      content: goal, type: 'goal', metadata: { goal, project },
    });
    return { content: [{ type: 'text', text: 'Goal set: ' + goal + ' ID: ' + memory.id }] };
  });

  mcpServer.registerTool('goal_get', {
    description: 'Get project goal',
    inputSchema: { project: z.string().optional() },
  }, async ({ project }) => {
    const results = await searchByFilter({ type: 'goal', project, limit: 1 });
    if (results.length === 0) return { content: [{ type: 'text', text: 'No goal set.' }] };
    return { content: [{ type: 'text', text: 'Current Goal: ' + results[0].content }] };
  });

  mcpServer.registerTool('mem_session_summary', {
    description: 'Save session summary',
    inputSchema: {
      goal: z.string(), instructions: z.string().optional(), discoveries: z.string().optional(),
      accomplished: z.string(), nextSteps: z.string().optional(), project: z.string().optional(),
    },
  }, async ({ goal, instructions, discoveries, accomplished, nextSteps, project }) => {
    const content = '## Goal\n' + goal + '\n\n## Instructions\n' + (instructions || 'None') + '\n\n## Discoveries\n' + (discoveries || 'None') + '\n\n## Accomplished\n' + accomplished + '\n\n## Next Steps\n' + (nextSteps || 'None');
    await ensureTypeExists('session_summary');
    const memory = await createMemory({
      title: 'Session: ' + (project || 'unknown'), content, type: 'session_summary',
      metadata: { project, session: true },
    });
    return { content: [{ type: 'text', text: 'Session saved. ID: ' + memory.id }] };
  });

  mcpServer.registerTool('mem_context', {
    description: 'Get context from previous sessions',
    inputSchema: { project: z.string().optional(), limit: z.number().optional() },
  }, async ({ project, limit }) => {
    const results = await searchByFilter({ project, limit: limit || 5 });
    const context = results.map(r => '- ' + r.title + ': ' + r.contentPreview).join('\n');
    return { content: [{ type: 'text', text: context || 'No context.' }] };
  });

  return mcpServer;
}

async function ensureTypeExists(typeName: string): Promise<void> {
  const { getDatabase } = await import('../db/connection.js');
  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM memory_types WHERE name = ?').get(typeName) as { id: string } | undefined;
  if (!existing) {
    db.prepare('INSERT INTO memory_types (id, name, schema, version, created_at, updated_at) VALUES (?, ?, NULL, 1, ?, ?)')
      .run('type-' + typeName, typeName, Date.now(), Date.now());
  }
}

const MODE = process.env.MCP_MODE || 'stdio';

if (MODE === 'http') {
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  const port = parseInt(process.env.MCP_PORT || '3100', 10);
  const basePath = process.env.MCP_BASE_PATH || '';
  
  app.get(basePath + '/health', (_req, res) => {
    res.json({ status: 'ok', mode: 'mcp-http', version: '1.0.0' });
  });
  
  const mcpHandler = async (req: express.Request, res: express.Response) => {
    const mcpServer = createMcpServer();
    try {
      const existingSessionId = req.headers['mcp-session-id'] as string;
      let transport: StreamableHTTPServerTransport | undefined;
      
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => existingSessionId || crypto.randomUUID()
      });
      
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP HTTP error:', error);
      if (!res.headersSent) res.status(500).json({ error: 'Connection failed' });
    }
  };
  
  app.post(basePath + '/mcp', mcpHandler);
  app.get(basePath + '/mcp', mcpHandler);
  
  app.listen(port, '0.0.0.0', () => {
    console.log('cmx-memories MCP HTTP on port ' + port + ' basePath: ' + basePath);
  });
} else {
  async function main() {
    const mcpServer = createMcpServer();
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error('cmx-memories MCP server running (stdio)...');
  }
  main().catch(error => { console.error('Error:', error); process.exit(1); });
}
