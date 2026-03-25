/**
 * SDK Factory - Create MemoriesClient instances
 * Phase 4: SDK & Client
 * 
 * Factory function for creating configured client instances
 */

import { MemoriesClient } from './client.js';
import type { SDKClientOptions } from './types.js';

/**
 * Create a new MemoriesClient instance
 * 
 * @example
 * ```typescript
 * import { createMemoriesClient } from 'cmx-memories';
 * 
 * // Simple usage with defaults
 * const client = createMemoriesClient();
 * 
 * // Custom configuration
 * const client = createMemoriesClient({
 *   dbPath: './data/memories.db',
 *   enableVectors: true,
 *   embeddingModel: 'openai'
 * });
 * ```
 * 
 * @param options - Optional client configuration
 * @returns Configured MemoriesClient instance
 */
export function createMemoriesClient(options?: SDKClientOptions): MemoriesClient {
  return new MemoriesClient(options);
}

/**
 * Create a client with default configuration
 * Useful for quick prototyping
 * 
 * @returns MemoriesClient with default settings
 */
export function createDefaultClient(): MemoriesClient {
  return new MemoriesClient();
}

// Re-export client class for direct instantiation if needed
export { MemoriesClient };

// Default export is the factory function
export default createMemoriesClient;
