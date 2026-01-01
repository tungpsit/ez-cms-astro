import fs from 'node:fs/promises';
import path from 'node:path';
import type { Plugin, PluginDefinition, PluginHook } from './types';

const PLUGINS_STATE_FILE = path.join(process.cwd(), 'src/content/plugins-state.json');

// Load plugin definitions and implementations
const manifestModules = import.meta.glob('../../plugins/*/manifest.json', { eager: true });
const implementationModules = import.meta.glob('../../plugins/*/index.ts', { eager: true });

const pluginImplementations: Record<string, any> = {};

export const availablePlugins: Plugin[] = Object.keys(manifestModules).map(key => {
  const manifest = (manifestModules[key] as any).default as PluginDefinition;
  const folder = key.split('/')[3];
  
  // Find matching implementation
  const implementationKey = Object.keys(implementationModules).find(k => k.includes(`/${folder}/index.ts`));
  if (implementationKey) {
    pluginImplementations[manifest.id] = (implementationModules[implementationKey] as any).default;
  }

  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    author: manifest.author,
    description: manifest.description,
    enabled: false,
    settings: manifest.defaultSettings || {},
    hooks: manifest.hooks || []
  };
});

let pluginsState: Record<string, { enabled: boolean; settings: Record<string, unknown> }> = {};

export async function loadPluginsState(): Promise<void> {
  try {
    const content = await fs.readFile(PLUGINS_STATE_FILE, 'utf-8');
    pluginsState = JSON.parse(content);
    availablePlugins.forEach(plugin => {
      if (pluginsState[plugin.id]) {
        plugin.enabled = pluginsState[plugin.id].enabled;
        plugin.settings = { ...plugin.settings, ...pluginsState[plugin.id].settings };
      }
    });
  } catch {
    // Use defaults
  }
}

export async function savePluginsState(): Promise<{ success: boolean; error?: string }> {
  try {
    const state: Record<string, { enabled: boolean; settings: Record<string, unknown> }> = {};
    availablePlugins.forEach(plugin => {
      state[plugin.id] = {
        enabled: plugin.enabled,
        settings: plugin.settings,
      };
    });
    await fs.writeFile(PLUGINS_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function togglePlugin(pluginId: string, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  const plugin = availablePlugins.find(p => p.id === pluginId);
  if (!plugin) {
    return { success: false, error: 'Plugin not found' };
  }
  plugin.enabled = enabled;
  return savePluginsState();
}

export async function updatePluginSettings(pluginId: string, settings: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  const plugin = availablePlugins.find(p => p.id === pluginId);
  if (!plugin) {
    return { success: false, error: 'Plugin not found' };
  }
  plugin.settings = { ...plugin.settings, ...settings };
  return savePluginsState();
}

export function getAllPlugins(): Plugin[] {
  return availablePlugins;
}

export function getEnabledPlugins(): Plugin[] {
  return availablePlugins.filter(p => p.enabled);
}

export function getPluginById(id: string): Plugin | undefined {
  return availablePlugins.find(p => p.id === id);
}

export function getPluginsByHook(hook: PluginHook): Plugin[] {
  return availablePlugins.filter(p => p.enabled && p.hooks.includes(hook));
}

// Plugin Execution Logic
export function injectHead(): string {
  const plugins = getPluginsByHook('injectHead');
  let html = '';

  for (const plugin of plugins) {
    const implementation = pluginImplementations[plugin.id];
    if (implementation && typeof implementation.injectHead === 'function') {
      html += implementation.injectHead(plugin.settings);
    }
  }

  return html;
}

export function injectBodyStart(): string {
  const plugins = getPluginsByHook('injectBodyStart');
  let html = '';

  for (const plugin of plugins) {
    const implementation = pluginImplementations[plugin.id];
    if (implementation && typeof implementation.injectBodyStart === 'function') {
      html += implementation.injectBodyStart(plugin.settings);
    }
  }

  return html;
}

export function injectBodyEnd(): string {
  const plugins = getPluginsByHook('injectBodyEnd');
  let html = '';

  for (const plugin of plugins) {
    const implementation = pluginImplementations[plugin.id];
    if (implementation && typeof implementation.injectBodyEnd === 'function') {
      html += implementation.injectBodyEnd(plugin.settings);
    }
  }

  return html;
}

export function processContent(content: string): string {
  let processedContent = content;
  
  // afterContent hook
  const afterContentPlugins = getPluginsByHook('afterContent');
  let additions = '';

  for (const plugin of afterContentPlugins) {
    const implementation = pluginImplementations[plugin.id];
    if (implementation && typeof implementation.afterContent === 'function') {
      additions += implementation.afterContent(plugin.settings);
    }
  }

  // transformContent hook
  const transformPlugins = getPluginsByHook('transformContent');
  for (const plugin of transformPlugins) {
    const implementation = pluginImplementations[plugin.id];
    if (implementation && typeof implementation.transformContent === 'function') {
      processedContent = implementation.transformContent(processedContent, plugin.settings);
    }
  }

  return processedContent + additions;
}

let loadPromise: Promise<void> | null = null;

export async function initPlugins(): Promise<void> {
  if (!loadPromise) {
    loadPromise = loadPluginsState();
  }
  return loadPromise;
}