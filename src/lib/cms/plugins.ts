import type { Plugin, PluginHook } from './types';
import fs from 'node:fs/promises';
import path from 'node:path';

const PLUGINS_STATE_FILE = path.join(process.cwd(), 'src/content/plugins-state.json');

export const availablePlugins: Plugin[] = [
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer',
    version: '1.0.0',
    author: 'EZ CMS',
    description: 'Automatically optimize your content for search engines with meta tags, sitemaps, and more.',
    enabled: true,
    settings: {
      autoGenerateMetaTags: true,
      generateSitemap: true,
      enableOpenGraph: true,
    },
    hooks: ['beforeRender', 'afterBuild'],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    version: '1.0.0',
    author: 'EZ CMS',
    description: 'Track visitor statistics and page views with privacy-friendly analytics.',
    enabled: false,
    settings: {
      trackPageViews: true,
      trackClicks: false,
      anonymizeIP: true,
    },
    hooks: ['onPageView'],
  },
  {
    id: 'social-sharing',
    name: 'Social Sharing',
    version: '1.0.0',
    author: 'EZ CMS',
    description: 'Add social sharing buttons to your posts and pages.',
    enabled: true,
    settings: {
      platforms: ['twitter', 'facebook', 'linkedin'],
      position: 'bottom',
    },
    hooks: ['afterContent'],
  },
  {
    id: 'comments',
    name: 'Comments',
    version: '1.0.0',
    author: 'EZ CMS',
    description: 'Enable commenting on your posts with moderation support.',
    enabled: false,
    settings: {
      moderation: true,
      allowAnonymous: false,
      nestingLevel: 3,
    },
    hooks: ['afterContent'],
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    version: '1.0.0',
    author: 'EZ CMS',
    description: 'Build your email list with customizable subscription forms.',
    enabled: false,
    settings: {
      provider: 'internal',
      doubleOptIn: true,
      welcomeEmail: true,
    },
    hooks: ['onFormSubmit'],
  },
  {
    id: 'code-highlighter',
    name: 'Code Highlighter',
    version: '1.0.0',
    author: 'EZ CMS',
    description: 'Beautiful syntax highlighting for code blocks in your content.',
    enabled: true,
    settings: {
      theme: 'dracula',
      lineNumbers: true,
      copyButton: true,
    },
    hooks: ['beforeRender'],
  },
];

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

loadPluginsState();