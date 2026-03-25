/**
 * Plugin Service - Skeleton for plugin system
 * Phase 2: Core Services
 * 
 * Provides a foundation for extensible plugins in future phases.
 * Currently a stub implementation.
 */

import type { Plugin, PluginHook } from '../types/index.js';

/**
 * Plugin registry - stores loaded plugins
 */
const plugins: Map<string, Plugin> = new Map();

/**
 * Hook registry - stores registered hooks
 */
const hooks: Map<string, Set<PluginHook>> = new Map();

/**
 * Load plugins from plugin directory
 * Currently scans for plugin definitions - full implementation in Phase 3
 */
export async function loadPlugins(): Promise<Plugin[]> {
  const loaded: Plugin[] = [];
  
  // TODO: Scan plugin directory and load plugins
  // For now, just return empty array
  console.log('Plugin system initialized (no plugins loaded)');
  
  return loaded;
}

/**
 * Get all loaded plugins
 */
export function getPlugins(): Plugin[] {
  return Array.from(plugins.values());
}

/**
 * Get a specific plugin by name
 */
export function getPlugin(name: string): Plugin | undefined {
  return plugins.get(name);
}

/**
 * Register a hook callback
 * Hooks can be triggered by various events in the system
 */
export function registerHook(name: string, callback: (data: unknown) => Promise<unknown>): void {
  if (!hooks.has(name)) {
    hooks.set(name, new Set());
  }
  
  const hook: PluginHook = {
    name,
    callback,
  };
  
  hooks.get(name)!.add(hook);
}

/**
 * Emit a hook - call all registered callbacks
 * Stub implementation - would be called by system events
 */
export async function emitHook(name: string, data: unknown): Promise<unknown[]> {
  const registeredHooks = hooks.get(name);
  
  if (!registeredHooks || registeredHooks.size === 0) {
    return [];
  }
  
  const results: unknown[] = [];
  
  for (const hook of registeredHooks) {
    try {
      const result = await hook.callback(data);
      results.push(result);
    } catch (error) {
      console.error(`Hook '${name}' error:`, error);
    }
  }
  
  return results;
}

/**
 * Unregister a hook callback
 */
export function unregisterHook(name: string, callback: (data: unknown) => Promise<unknown>): boolean {
  const registeredHooks = hooks.get(name);
  
  if (!registeredHooks) {
    return false;
  }
  
  for (const hook of registeredHooks) {
    if (hook.callback === callback) {
      registeredHooks.delete(hook);
      return true;
    }
  }
  
  return false;
}

/**
 * Clear all hooks for a given name
 */
export function clearHooks(name: string): void {
  hooks.delete(name);
}

/**
 * Available hook types (documented for plugin developers)
 */
export const HOOK_TYPES = {
  // Memory lifecycle hooks
  MEMORY_BEFORE_CREATE: 'memory:beforeCreate',
  MEMORY_AFTER_CREATE: 'memory:afterCreate',
  MEMORY_BEFORE_UPDATE: 'memory:beforeUpdate',
  MEMORY_AFTER_UPDATE: 'memory:afterUpdate',
  MEMORY_BEFORE_DELETE: 'memory:beforeDelete',
  MEMORY_AFTER_DELETE: 'memory:afterDelete',
  
  // Search hooks
  SEARCH_BEFORE: 'search:before',
  SEARCH_AFTER: 'search:after',
  
  // Type hooks
  TYPE_BEFORE_CREATE: 'type:beforeCreate',
  TYPE_AFTER_CREATE: 'type:afterCreate',
  
  // Embedding hooks
  EMBEDDING_BEFORE_GENERATE: 'embedding:beforeGenerate',
  EMBEDDING_AFTER_GENERATE: 'embedding:afterGenerate',
} as const;

/**
 * Check if a hook type exists
 */
export function hasHook(name: string): boolean {
  return hooks.has(name) && hooks.get(name)!.size > 0;
}

/**
 * Get count of registered hooks for a name
 */
export function getHookCount(name: string): number {
  return hooks.get(name)?.size || 0;
}

// Re-export Plugin type for external use
export type { Plugin as PluginType } from '../types/index.js';