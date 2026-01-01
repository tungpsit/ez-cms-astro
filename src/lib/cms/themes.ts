import type { Theme } from './types';
import fs from 'node:fs/promises';
import path from 'node:path';

const ACTIVE_THEME_FILE = path.join(process.cwd(), 'src/content/active-theme.json');

export const availableThemes: Theme[] = [
  {
    id: 'developer',
    name: 'Developer',
    version: '1.0.0',
    author: 'EZ CMS',
    description: 'A dark theme optimized for developers with syntax highlighting colors',
    screenshot: '/themes/developer.png',
    settings: {
      primaryColor: '#10b981',
      accentColor: '#8b5cf6',
      backgroundColor: '#0f172a',
      textColor: '#e2e8f0',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    version: '1.0.0',
    author: 'EZ CMS',
    description: 'Clean and minimal design with focus on content',
    screenshot: '/themes/minimal.png',
    settings: {
      primaryColor: '#000000',
      accentColor: '#666666',
      backgroundColor: '#ffffff',
      textColor: '#1a1a1a',
    },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    version: '1.0.0',
    author: 'EZ CMS',
    description: 'Classic editorial style perfect for blogs and magazines',
    screenshot: '/themes/editorial.png',
    settings: {
      primaryColor: '#dc2626',
      accentColor: '#f59e0b',
      backgroundColor: '#fef3c7',
      textColor: '#451a03',
    },
  },
  {
    id: 'corporate',
    name: 'Corporate',
    version: '1.0.0',
    author: 'EZ CMS',
    description: 'Professional theme for business and corporate sites',
    screenshot: '/themes/corporate.png',
    settings: {
      primaryColor: '#2563eb',
      accentColor: '#0891b2',
      backgroundColor: '#f8fafc',
      textColor: '#0f172a',
    },
  },
  {
    id: 'creative',
    name: 'Creative',
    version: '1.0.0',
    author: 'EZ CMS',
    description: 'Bold and colorful theme for creative portfolios',
    screenshot: '/themes/creative.png',
    settings: {
      primaryColor: '#ec4899',
      accentColor: '#a855f7',
      backgroundColor: '#1e1b4b',
      textColor: '#f5f3ff',
    },
  },
];

let activeThemeId = 'developer';

export async function loadActiveTheme(): Promise<string> {
  try {
    const content = await fs.readFile(ACTIVE_THEME_FILE, 'utf-8');
    const data = JSON.parse(content);
    activeThemeId = data.themeId || 'developer';
    return activeThemeId;
  } catch {
    return 'developer';
  }
}

export async function setActiveTheme(themeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const theme = availableThemes.find(t => t.id === themeId);
    if (!theme) {
      return { success: false, error: 'Theme not found' };
    }
    await fs.writeFile(ACTIVE_THEME_FILE, JSON.stringify({ themeId }, null, 2), 'utf-8');
    activeThemeId = themeId;
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export function getAllThemes(): Theme[] {
  return availableThemes;
}

export function getActiveTheme(): Theme {
  return availableThemes.find(t => t.id === activeThemeId) || availableThemes[0];
}

export function getThemeById(id: string): Theme | undefined {
  return availableThemes.find(t => t.id === id);
}

loadActiveTheme();