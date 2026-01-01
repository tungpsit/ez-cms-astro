import type { CMSConfig } from './types';
import fs from 'node:fs/promises';
import path from 'node:path';

const CONFIG_FILE = path.join(process.cwd(), 'src/content/config.json');

export const defaultConfig: CMSConfig = {
  siteName: 'EZ CMS',
  siteUrl: 'http://localhost:4321',
  siteDescription: 'A powerful and flexible CMS built with Astro',
  logo: '',
  favicon: '/favicon.svg',
  language: 'en',
  timezone: 'UTC',
  postsPerPage: 10,
  dateFormat: 'MMMM dd, yyyy',
  seo: {
    defaultMetaTitle: 'EZ CMS',
    defaultMetaDescription: 'A powerful and flexible CMS built with Astro',
    googleAnalyticsId: '',
  },
  social: {
    twitter: '',
    github: '',
    linkedin: '',
  },
};

let cachedConfig: CMSConfig | null = null;

export async function loadConfig(): Promise<CMSConfig> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return { ...defaultConfig, ...JSON.parse(content) };
  } catch {
    return defaultConfig;
  }
}

export async function saveConfig(config: Partial<CMSConfig>): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await loadConfig();
    const updated = { ...current, ...config };
    await fs.writeFile(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    cachedConfig = updated;
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function getConfig(): CMSConfig {
  return cachedConfig || defaultConfig;
}

export async function initConfig(): Promise<void> {
  cachedConfig = await loadConfig();
}

initConfig();