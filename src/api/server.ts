import express, { type Express } from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { initializeDatabase, getDatabase } from '../db/connection.js';
import { createMemory, getMemory, updateMemory, deleteMemory, listMemories } from '../services/memory.service.js';
import { advancedSearch, searchByFilter } from '../services/search.service.js';
import memoriesRouter from './routes/memories.js';
import searchRouter from './routes/search.js';
import paginateRouter from './routes/paginate.js';
import suggestRouter from './routes/suggest.js';
import typesRouter from './routes/types.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import * as z from 'zod/v4';

export function getBasePath(): string {
  return process.env.CMX_BASE_PATH || '';
}

function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'cmx-memories', version: '1.0.0' });

  server.registerTool('mem_save', {
    description: 'Save a memory with structured content',
    inputSchema: {
      title: z.string().describe('Short searchable title'),
      content: z.string().describe('Full content'),
      type: z.string().optional(),
      topic_key: z.string().optional(),
      project: z.string().optional(),
      metadata: z.object().optional(),
    },
  }, async ({ title, content, type, topic_key, project, metadata }) => {
    const typeName = type || 'memory';
    await ensureTypeExists(typeName);
    const mem = await createMemory({ title, content, type: typeName, metadata: { ...metadata, project, topic_key } });
    return { content: [{ type: 'text', text: JSON.stringify({ id: mem.id, title: mem.title }) }] };
  });

  server.registerTool('mem_search', {
    description: 'Search memories by keyword',
    inputSchema: { query: z.string().describe('Search query'), type: z.string().optional(), project: z.string().optional(), limit: z.number().optional() },
  }, async ({ query, type, project, limit }) => {
    const results = await advancedSearch(query || '', { query: query || '', type, project, limit: limit || 10 });
    return { content: [{ type: 'text', text: JSON.stringify({ total: results.length, results }) }] };
  });

  server.registerTool('mem_get', {
    description: 'Get a memory by ID',
    inputSchema: { id: z.string().describe('Memory ID') },
  }, async ({ id }) => {
    const memory = await getMemory(id);
    if (!memory) return { content: [{ type: 'text', text: 'Memory not found: ' + id }], isError: true };
    return { content: [{ type: 'text', text: JSON.stringify(memory) }] };
  });

  server.registerTool('mem_update', {
    description: 'Update memory',
    inputSchema: { id: z.string(), title: z.string().optional(), content: z.string().optional(), type: z.string().optional(), metadata: z.object().optional() },
  }, async ({ id, ...updateData }) => {
    const updated = await updateMemory(id, updateData);
    return { content: [{ type: 'text', text: JSON.stringify(updated) }] };
  });

  server.registerTool('mem_delete', {
    description: 'Delete memory',
    inputSchema: { id: z.string().describe('Memory ID') },
  }, async ({ id }) => { await deleteMemory(id); return { content: [{ type: 'text', text: 'Memory deleted' }] }; });

  server.registerTool('mem_list', {
    description: 'List memories',
    inputSchema: { type: z.string().optional(), project: z.string().optional(), limit: z.number().optional() },
  }, async ({ type, project, limit }) => {
    const results = project ? await searchByFilter({ type, project, limit: limit || 10 }) : await listMemories({ type, limit: limit || 10 });
    const mems = project ? results.map(r => ({ id: r.id, title: r.title })) : results;
    return { content: [{ type: 'text', text: JSON.stringify({ total: results.length, memories: mems }) }] };
  });

  server.registerTool('goal_set', {
    description: 'Set project goal',
    inputSchema: { goal: z.string(), project: z.string().optional() },
  }, async ({ goal, project }) => {
    await ensureTypeExists('goal');
    const mem = await createMemory({ title: 'Goal: ' + goal.substring(0, 50), content: goal, type: 'goal', metadata: { goal, project } });
    return { content: [{ type: 'text', text: 'Goal set: ' + goal + ' (id: ' + mem.id + ')' }] };
  });

  server.registerTool('goal_get', {
    description: 'Get project goal',
    inputSchema: { project: z.string().optional() },
  }, async ({ project }) => {
    const results = await searchByFilter({ type: 'goal', project, limit: 1 });
    return { content: [{ type: 'text', text: results.length ? 'Goal: ' + results[0].content : 'No goal set.' }] };
  });

  server.registerTool('mem_session_summary', {
    description: 'Save session summary',
    inputSchema: { goal: z.string(), instructions: z.string().optional(), discoveries: z.string().optional(), accomplished: z.string(), nextSteps: z.string().optional(), project: z.string().optional() },
  }, async ({ goal, instructions, discoveries, accomplished, nextSteps, project }) => {
    const content = '## Goal\n' + goal + '\n\n## Instructions\n' + (instructions || 'None') + '\n\n## Discoveries\n' + (discoveries || 'None') + '\n\n## Accomplished\n' + accomplished + '\n\n## Next Steps\n' + (nextSteps || 'None');
    await ensureTypeExists('session_summary');
    await createMemory({ title: 'Session: ' + (project || 'unknown'), content, type: 'session_summary', metadata: { project, session: true } });
    return { content: [{ type: 'text', text: 'Session saved.' }] };
  });

  server.registerTool('mem_context', {
    description: 'Get context from previous sessions',
    inputSchema: { project: z.string().optional(), limit: z.number().optional() },
  }, async ({ project, limit }) => {
    const results = await searchByFilter({ project, limit: limit || 5 });
    const context = results.map(r => '- ' + r.title + ': ' + r.contentPreview).join('\n');
    return { content: [{ type: 'text', text: context || 'No context.' }] };
  });

  return server;
}

async function ensureTypeExists(typeName: string): Promise<void> {
  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM memory_types WHERE name = ?').get(typeName) as { id: string } | undefined;
  if (!existing) {
    db.prepare('INSERT INTO memory_types (id, name, schema, version, created_at, updated_at) VALUES (?, ?, NULL, 1, ?, ?)')
      .run('type-' + typeName, typeName, Date.now(), Date.now());
  }
}

function isInitializeRequest(body: any): boolean {
  return body?.method === 'initialize';
}

export function createApp(): Express {
  const app = express();
  const basePath = getBasePath();

  app.use(cors());
  app.use(express.json());
  app.use('/cmx-memories', express.static('public'));

  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), basePath, version: '1.0.0' }));
  if (basePath) app.get(basePath + '/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), basePath, version: '1.0.0' }));

  const transports: Record<string, StreamableHTTPServerTransport> = {};

  const mcpPostHandler = async (req: express.Request, res: express.Response) => {
    try {
      const sessionId = req.headers['mcp-session-id'] as string;
      
      if (sessionId && transports[sessionId]) {
        await transports[sessionId].handleRequest(req, res, req.body);
        return;
      }
      
      if (!sessionId && isInitializeRequest(req.body)) {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
          onsessioninitialized: (sid) => {
            transports[sid] = transport;
          }
        });
        
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            delete transports[sid];
          }
        };
        
        const server = createMcpServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      }
      
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Bad Request: Server not initialized' },
        id: null
      });
    } catch (error) {
      console.error('MCP error:', error);
      if (!res.headersSent) res.status(500).json({ error: 'Connection failed' });
    }
  };

  const mcpGetHandler = async (req: express.Request, res: express.Response) => {
    try {
      const sessionId = req.headers['mcp-session-id'] as string;
      if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }
      await transports[sessionId].handleRequest(req, res);
    } catch (error) {
      console.error('MCP GET error:', error);
      if (!res.headersSent) res.status(500).send('Connection failed');
    }
  };

  const apiPath = basePath + '/api';
  
  if (basePath) {
    app.post(basePath + '/mcp', mcpPostHandler);
    app.get(basePath + '/mcp', mcpGetHandler);
    app.post(apiPath + '/mcp', mcpPostHandler);
    app.get(apiPath + '/mcp', mcpGetHandler);
  } else {
    app.post('/mcp', mcpPostHandler);
    app.get('/mcp', mcpGetHandler);
    app.post('/api/mcp', mcpPostHandler);
    app.get('/api/mcp', mcpGetHandler);
  }
  
  app.use(apiPath + '/memories', memoriesRouter);
  app.use(apiPath + '/search', searchRouter);
  app.use(apiPath + '/paginate', paginateRouter);
  app.use(apiPath + '/suggest', suggestRouter);
  app.use(apiPath + '/types', typesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export function startServer(port?: number, host?: string): void {
  const serverPort = port || parseInt(process.env.CMX_API_PORT || '3000', 10);
  const serverHost = host || process.env.CMX_API_HOST || '0.0.0.0';
  initializeDatabase();
  const app = createApp();
  app.listen(serverPort, serverHost, () => {
    const basePath = getBasePath();
    console.log('cmx-memories API+MCP on port ' + serverPort + ' basePath: ' + basePath);
  });
}

export default { createApp, startServer };
