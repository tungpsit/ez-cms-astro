import { glob } from 'glob';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface TranslationMap {
  [key: string]: string;
}

export interface LocaleInfo {
  code: string;
  name: string;
  count: number;
  translated: number;
  progress: number;
}

const I18N_DIR = path.resolve(process.cwd(), 'src/i18n');

/**
 * Core i18n engine for EZ CMS
 */
export class I18nEngine {
  private static instance: I18nEngine;
  private translations: Map<string, TranslationMap> = new Map();

  private constructor() {}

  public static getInstance(): I18nEngine {
    if (!I18nEngine.instance) {
      I18nEngine.instance = new I18nEngine();
    }
    return I18nEngine.instance;
  }

  /**
   * Initialize the i18n directory
   */
  public async init() {
    try {
      await fs.mkdir(I18N_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create i18n directory:', error);
    }
  }

  /**
   * Load translations for a specific locale
   */
  public async loadLocale(locale: string): Promise<TranslationMap> {
    if (this.translations.has(locale)) {
      return this.translations.get(locale)!;
    }

    const filePath = path.join(I18N_DIR, `${locale}.json`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      this.translations.set(locale, data);
      return data;
    } catch (error) {
      // If file doesn't exist, return empty map
      return {};
    }
  }

  /**
   * Save translations for a specific locale
   */
  public async saveLocale(locale: string, data: TranslationMap) {
    await this.init();
    const filePath = path.join(I18N_DIR, `${locale}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    this.translations.set(locale, data);
  }

  /**
   * Scan the project for translatable strings
   * Looks for t('string') or t("string")
   */
  public async scanProject(): Promise<string[]> {
    const patterns = [
      'src/**/*.astro',
      'src/**/*.ts',
      'src/**/*.tsx',
      'src/**/*.js',
      'src/**/*.jsx'
    ];

    const files = await glob(patterns, { ignore: ['node_modules/**', 'dist/**'] });
    const keys = new Set<string>();

    // Regex to match t('...') or t("...") or t(`...`)
    // Also matches {t('...')} in JSX
    const regex = /t\(['"`](.*?)['"`]\)/g;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        let match;
        while ((match = regex.exec(content)) !== null) {
          if (match[1]) {
            keys.add(match[1]);
          }
        }
      } catch (error) {
        console.error(`Failed to read file ${file}:`, error);
      }
    }

    return Array.from(keys).sort();
  }

  /**
   * Get all available locales
   */
  public async getLocales(): Promise<LocaleInfo[]> {
    await this.init();
    const files = await fs.readdir(I18N_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const projectKeys = await this.scanProject();
    const totalKeys = projectKeys.length;

    const locales: LocaleInfo[] = [];

    for (const file of jsonFiles) {
      const code = path.basename(file, '.json');
      const data = await this.loadLocale(code);
      const translatedCount = projectKeys.filter(key => !!data[key]).length;
      
      locales.push({
        code,
        name: this.getLocaleName(code),
        count: totalKeys,
        translated: translatedCount,
        progress: totalKeys > 0 ? Math.round((translatedCount / totalKeys) * 100) : 0
      });
    }

    return locales;
  }

  /**
   * Get a translation function for a specific locale
   */
  public async getT(locale: string) {
    const translations = await this.loadLocale(locale);
    
    return (key: string, params?: Record<string, string>) => {
      let text = translations[key] || key;
      
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
        });
      }
      
      return text;
    };
  }

  /**
   * Translate a key for a specific locale (sync if already loaded)
   */
  public t(key: string, locale: string = 'en', params?: Record<string, string>): string {
    const translations = this.translations.get(locale) || {};
    let text = translations[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), v);
      });
    }
    
    return text;
  }

  private getLocaleName(code: string): string {
    const names: Record<string, string> = {
      'en': 'English',
      'vi': 'Vietnamese',
      'fr': 'French',
      'de': 'German',
      'es': 'Spanish',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese'
    };
    return names[code] || code.toUpperCase();
  }

  /**
   * Get the current locale from request or config
   */
  public async getLocale(request?: Request): Promise<string> {
    // 1. Check cookie if request is provided
    if (request) {
      const cookie = request.headers.get('cookie');
      if (cookie) {
        const match = cookie.match(/ez_locale=([^;]+)/);
        if (match && match[1]) {
          return match[1];
        }
      }
    }

    // 2. Fallback to CMS config
    const { loadConfig } = await import('./cms/config');
    const config = await loadConfig();
    return config.language || 'en';
  }
}

export const i18n = I18nEngine.getInstance();
