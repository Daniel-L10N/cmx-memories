import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import type { Config } from './types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../..');

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Config = {
  dbPath: './memories.db',
  enableVectors: false, // Default to FTS5-only for MVP
  vectorWeight: 0.4,
  ftsWeight: 0.6,
  embeddingModel: 'local',
  memoryPaths: ['./docs/memories', './notes'],
};

/**
 * Agent project file configuration
 */
interface AgentProjectConfig {
  version: string;
  project: {
    name: string;
    dbPath: string;
  };
  memoryPaths: string[];
  index: {
    ftsEnabled: boolean;
    vectorEnabled: boolean;
    embeddingModel: string;
    hybridWeights: {
      fts: number;
      vector: number;
    };
  };
  agents?: Record<string, unknown>;
  customTypes?: Array<{ name: string; schema: unknown }>;
}

/**
 * Load configuration from multiple sources (priority order):
 * 1. .cmx-memories.yaml in current directory
 * 2. Environment variables
 * 3. Default values
 */
export function loadConfig(): Config {
  const config: Config = { ...DEFAULT_CONFIG };

  // Try to load from .cmx-memories.yaml
  const yamlPath = resolve(process.cwd(), '.cmx-memories.yaml');
  
  if (existsSync(yamlPath)) {
    try {
      const yamlContent = readFileSync(yamlPath, 'utf-8');
      const projectConfig: AgentProjectConfig = YAML.parse(yamlContent);
      
      if (projectConfig.project?.dbPath) {
        config.dbPath = projectConfig.project.dbPath;
      }
      if (projectConfig.memoryPaths) {
        config.memoryPaths = projectConfig.memoryPaths;
      }
      if (projectConfig.index) {
        config.enableVectors = projectConfig.index.vectorEnabled;
        if (projectConfig.index.hybridWeights) {
          config.ftsWeight = projectConfig.index.hybridWeights.fts;
          config.vectorWeight = projectConfig.index.hybridWeights.vector;
        }
        if (projectConfig.index.embeddingModel) {
          config.embeddingModel = projectConfig.index.embeddingModel as Config['embeddingModel'];
        }
      }
    } catch (error) {
      console.warn('Warning: Failed to parse .cmx-memories.yaml:', error);
    }
  }

  // Environment variables override
  if (process.env.CMX_DB_PATH) {
    config.dbPath = process.env.CMX_DB_PATH;
  }
  if (process.env.CMX_ENABLE_VECTORS) {
    config.enableVectors = process.env.CMX_ENABLE_VECTORS === 'true';
  }
  if (process.env.CMX_VECTOR_WEIGHT) {
    config.vectorWeight = parseFloat(process.env.CMX_VECTOR_WEIGHT);
  }
  if (process.env.CMX_FTS_WEIGHT) {
    config.ftsWeight = parseFloat(process.env.CMX_FTS_WEIGHT);
  }

  return config;
}

/**
 * Get current config (singleton, loaded once)
 */
let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

/**
 * Reset config cache (useful for testing)
 */
export function resetConfig(): void {
  cachedConfig = null;
}

export default { loadConfig, getConfig, resetConfig };