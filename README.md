# cmx-memories

Local-first personal memory system with SQLite + Drizzle and hybrid search.

## Features

- **SQLite + Drizzle ORM** - Local database with type-safe queries
- **Hybrid Search** - Full-text search (FTS) + optional vector search
- **CLI Interface** - Manage memories from the command line
- **API Server** - REST API for external integrations
- **Configurable** - YAML-based configuration
- **Multiple Memory Types** - memory, idea, task, note

## Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/cmx-memories.git
cd cmx-memories

# Install dependencies
npm install

# Build
npm run build
```

## Configuration

Edit `.cmx-memories.yaml`:

```yaml
project:
  name: "cmx-memories"
  dbPath: "./memories.db"

memoryPaths:
  - "./docs/memories"
  - "./notes"

index:
  ftsEnabled: true
  vectorEnabled: false
```

## Usage

```bash
# CLI
npm run dev -- add "my first memory"

# API Server
npm run api
```

## License

MIT
