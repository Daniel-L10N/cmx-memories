# cmx-memories

> Created by [Daniel L10N](https://github.com/Daniel-L10N) | [LinkedIn](https://linkedin.com/in/daniell10n)

Local-first personal memory system with SQLite + hybrid search for AI agents.

## Author

**Daniel L10N**
- GitHub: [@Daniel-L10N](https://github.com/Daniel-L10N)
- Email: alejandrolazolemus@gmail.com
- Location: Mexico

## Features

- **MCP Server** - Compatible with any MCP client (Claude Desktop, OpenCode, etc.)
- **API REST** - HTTP API for integrations
- **CLI** - Command line interface
- **FTS5 Search** - Full-text search with advanced filters
- **Multiple Types** - memory, idea, task, note, goal, decision, bugfix, etc.
- **Project Goals** - Track project objectives

## Quick Start

```bash
# Install
npm install

# Start MCP Server (for AI agents)
npm run mcp

# Or start API Server (for HTTP clients)
npm run api:remote

# Or use CLI
npm run dev -- help
```

## MCP Tools (for AI Agents)

| Tool | Description |
|------|-------------|
| `mem_save` | Save memory with structured content |
| `mem_search` | Search memories by keyword |
| `mem_get` | Get memory by ID |
| `mem_update` | Update a memory |
| `mem_delete` | Delete a memory |
| `mem_list` | List all memories |
| `goal_set` | Set project goal |
| `goal_get` | Get project goal |
| `mem_session_summary` | Save session summary |
| `mem_context` | Get context from previous sessions |

## Using with Claude Desktop

```json
{
  "mcpServers": {
    "cmx-memories": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/path/to/cmx-memories"
    }
  }
}
```

## Using with OpenCode

Edit `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "cmx-memories": {
      "command": ["npm", "run", "mcp"],
      "enabled": true,
      "type": "local"
    }
  }
}
```

## Using with any AI (via API)

```bash
# Start the API server
npm run api:remote

# Then call the API
curl -H "X-API-Key: cmx-dev-key" \
  -H "Content-Type: application/json" \
  -X POST http://localhost:3000/api/memories \
  -d '{
    "title": "Fixed auth bug",
    "content": "**What**: Fixed JWT token validation\n**Why**: Tokens were expiring early",
    "type": "bugfix"
  }'
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/memories` | Create memory |
| GET | `/api/memories` | List memories |
| GET | `/api/memories/:id` | Get memory |
| PUT | `/api/memories/:id` | Update memory |
| DELETE | `/api/memories/:id` | Delete memory |
| GET | `/api/memories/search` | Search memories |
| GET | `/api/types` | List memory types |
| GET | `/health` | Health check |

## Memory Types

- **memory** - Generic memory
- **idea** - Ideas with tags
- **task** - Tasks with priority
- **note** - Notes with source
- **goal** - Project goals/objectives
- **decision** - Architecture decisions
- **bugfix** - Bug fixes
- **architecture** - Architecture patterns
- **config** - Configuration changes
- **discovery** - Technical discoveries
- **preference** - User preferences

## Configuration

Edit `.cmx-memories.yaml`:

```yaml
project:
  name: "cmx-memories"
  dbPath: "./memories.db"

memoryPaths:
  - "./docs/memories"

index:
  ftsEnabled: true
  vectorEnabled: false
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| CMX_API_PORT | 3000 | API server port |
| CMX_API_HOST | 0.0.0.0 | API server host |
| CMX_API_KEY | cmx-dev-key | API key for authentication |

## License

## Sistema de servicio (systemd)

Para que el servidor always-on funcione como servicio del sistema:

### Installation

El servicio se encuentra en: `~/.config/systemd/user/cmx-memories.service`

Para activarlo:

```bash
# Recargar systemd
systemctl --user daemon-reload

# Habilitar auto-inicio
systemctl --user enable cmx-memories.service

# Iniciar el servicio
systemctl --user start cmx-memories.service

# Verificar estado
systemctl --user status cmx-memories.service
```

### Comandos

```bash
# Estado del servicio
systemctl --user status cmx-memories

# Reiniciar
systemctl --user restart cmx-memories

# Ver logs en tiempo real
journalctl --user -u cmx-memories -f

# Detener
systemctl --user stop cmx-memories

# Deshabilitar auto-inicio
systemctl --user disable cmx-memories
```

### Verificación

Una vez activo, el API responde en:
```
http://localhost:3000/cmx-memories/api/memories
```

MIT
