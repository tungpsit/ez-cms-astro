import type { DatabaseAdapter, Category, Post, Page, Author, Menu, User, Media } from './types';
import { nanoid } from 'nanoid';

let Database: typeof import('better-sqlite3').default;

export class SqliteAdapter implements DatabaseAdapter {
  private db: import('better-sqlite3').Database | null = null;
  private filename: string;

  constructor(filename: string = './data/cms.db') {
    this.filename = filename;
  }

  async init(): Promise<void> {
    if (!Database) {
      Database = (await import('better-sqlite3')).default;
    }
    
    const path = await import('node:path');
    const fs = await import('node:fs/promises');
    const dir = path.dirname(this.filename);
    
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
    
    this.db = new Database(this.filename);
    this.db.pragma('journal_mode = WAL');
    
    this.createTables();
  }

  private createTables(): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        color TEXT DEFAULT '#0ea5e9',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        content TEXT DEFAULT '',
        author TEXT DEFAULT 'Admin',
        category TEXT DEFAULT 'Uncategorized',
        tags TEXT DEFAULT '[]',
        draft INTEGER DEFAULT 0,
        featured_image TEXT DEFAULT '',
        publish_date TEXT,
        updated_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        content TEXT DEFAULT '',
        template TEXT DEFAULT 'default',
        draft INTEGER DEFAULT 0,
        featured_image TEXT DEFAULT '',
        publish_date TEXT,
        updated_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS authors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT DEFAULT '',
        bio TEXT DEFAULT '',
        avatar TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS menus (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        items TEXT DEFAULT '[]',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT DEFAULT '',
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'editor',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER DEFAULT 0,
        mime_type TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private getDb(): import('better-sqlite3').Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const db = this.getDb();
    return db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[];
  }

  async getCategory(id: string): Promise<Category | null> {
    const db = this.getDb();
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | null;
  }

  async createCategory(data: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const db = this.getDb();
      const id = data.slug || nanoid(10);
      db.prepare('INSERT INTO categories (id, name, slug, description, color) VALUES (?, ?, ?, ?, ?)')
        .run(id, data.name, data.slug, data.description || '', data.color || '#0ea5e9');
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<{ success: boolean; newId?: string; error?: string }> {
    try {
      const db = this.getDb();
      const existing = await this.getCategory(id);
      if (!existing) return { success: false, error: 'Category not found' };

      const newSlug = data.slug || existing.slug;
      const newId = newSlug !== id ? newSlug : id;

      if (newId !== id) {
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);
        db.prepare('INSERT INTO categories (id, name, slug, description, color, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
          .run(newId, data.name || existing.name, newSlug, data.description ?? existing.description, data.color ?? existing.color);
        return { success: true, newId };
      } else {
        db.prepare('UPDATE categories SET name = ?, slug = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(data.name || existing.name, newSlug, data.description ?? existing.description, data.color ?? existing.color, id);
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Posts
  async getPosts(): Promise<Post[]> {
    const db = this.getDb();
    const rows = db.prepare('SELECT * FROM posts ORDER BY publish_date DESC').all() as Array<Record<string, unknown>>;
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags as string || '[]'),
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date as string),
      updated_date: row.updated_date ? new Date(row.updated_date as string) : undefined,
    })) as Post[];
  }

  async getPost(id: string): Promise<Post | null> {
    const db = this.getDb();
    const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      ...row,
      tags: JSON.parse(row.tags as string || '[]'),
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date as string),
      updated_date: row.updated_date ? new Date(row.updated_date as string) : undefined,
    } as Post;
  }

  async createPost(data: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const db = this.getDb();
      const id = data.slug || nanoid(10);
      db.prepare(`
        INSERT INTO posts (id, title, slug, description, content, author, category, tags, draft, featured_image, publish_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, data.title, data.slug, data.description || '', data.content || '',
        data.author || 'Admin', data.category || 'Uncategorized',
        JSON.stringify(data.tags || []), data.draft ? 1 : 0,
        data.featured_image || '', data.publish_date?.toISOString() || new Date().toISOString()
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updatePost(id: string, data: Partial<Post>): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      const existing = await this.getPost(id);
      if (!existing) return { success: false, error: 'Post not found' };

      db.prepare(`
        UPDATE posts SET title = ?, slug = ?, description = ?, content = ?, author = ?, category = ?,
        tags = ?, draft = ?, featured_image = ?, updated_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(
        data.title ?? existing.title, data.slug ?? existing.slug, data.description ?? existing.description,
        data.content ?? existing.content, data.author ?? existing.author, data.category ?? existing.category,
        JSON.stringify(data.tags ?? existing.tags), (data.draft ?? existing.draft) ? 1 : 0,
        data.featured_image ?? existing.featured_image, new Date().toISOString(), id
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deletePost(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM posts WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Pages
  async getPages(): Promise<Page[]> {
    const db = this.getDb();
    const rows = db.prepare('SELECT * FROM pages ORDER BY title').all() as Array<Record<string, unknown>>;
    return rows.map(row => ({
      ...row,
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date as string),
      updated_date: row.updated_date ? new Date(row.updated_date as string) : undefined,
    })) as Page[];
  }

  async getPage(id: string): Promise<Page | null> {
    const db = this.getDb();
    const row = db.prepare('SELECT * FROM pages WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      ...row,
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date as string),
      updated_date: row.updated_date ? new Date(row.updated_date as string) : undefined,
    } as Page;
  }

  async createPage(data: Omit<Page, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const db = this.getDb();
      const id = data.slug || nanoid(10);
      db.prepare(`
        INSERT INTO pages (id, title, slug, description, content, template, draft, featured_image, publish_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, data.title, data.slug, data.description || '', data.content || '',
        data.template || 'default', data.draft ? 1 : 0,
        data.featured_image || '', data.publish_date?.toISOString() || new Date().toISOString()
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updatePage(id: string, data: Partial<Page>): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      const existing = await this.getPage(id);
      if (!existing) return { success: false, error: 'Page not found' };

      db.prepare(`
        UPDATE pages SET title = ?, slug = ?, description = ?, content = ?, template = ?,
        draft = ?, featured_image = ?, updated_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(
        data.title ?? existing.title, data.slug ?? existing.slug, data.description ?? existing.description,
        data.content ?? existing.content, data.template ?? existing.template,
        (data.draft ?? existing.draft) ? 1 : 0, data.featured_image ?? existing.featured_image,
        new Date().toISOString(), id
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deletePage(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM pages WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Authors
  async getAuthors(): Promise<Author[]> {
    const db = this.getDb();
    return db.prepare('SELECT * FROM authors ORDER BY name').all() as Author[];
  }

  async getAuthor(id: string): Promise<Author | null> {
    const db = this.getDb();
    return db.prepare('SELECT * FROM authors WHERE id = ?').get(id) as Author | null;
  }

  async createAuthor(data: Omit<Author, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const db = this.getDb();
      const id = nanoid(10);
      db.prepare('INSERT INTO authors (id, name, email, bio, avatar) VALUES (?, ?, ?, ?, ?)')
        .run(id, data.name, data.email || '', data.bio || '', data.avatar || '');
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateAuthor(id: string, data: Partial<Author>): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      const existing = await this.getAuthor(id);
      if (!existing) return { success: false, error: 'Author not found' };

      db.prepare('UPDATE authors SET name = ?, email = ?, bio = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(data.name ?? existing.name, data.email ?? existing.email, data.bio ?? existing.bio, data.avatar ?? existing.avatar, id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteAuthor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM authors WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Menus
  async getMenus(): Promise<Menu[]> {
    const db = this.getDb();
    return db.prepare('SELECT * FROM menus ORDER BY name').all() as Menu[];
  }

  async getMenu(id: string): Promise<Menu | null> {
    const db = this.getDb();
    return db.prepare('SELECT * FROM menus WHERE id = ?').get(id) as Menu | null;
  }

  async createMenu(data: Omit<Menu, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const db = this.getDb();
      const id = nanoid(10);
      db.prepare('INSERT INTO menus (id, name, items) VALUES (?, ?, ?)')
        .run(id, data.name, data.items || '[]');
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateMenu(id: string, data: Partial<Menu>): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      const existing = await this.getMenu(id);
      if (!existing) return { success: false, error: 'Menu not found' };

      db.prepare('UPDATE menus SET name = ?, items = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(data.name ?? existing.name, data.items ?? existing.items, id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteMenu(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM menus WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    const db = this.getDb();
    return db.prepare('SELECT * FROM users ORDER BY username').all() as User[];
  }

  async getUser(id: string): Promise<User | null> {
    const db = this.getDb();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const db = this.getDb();
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | null;
  }

  async createUser(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const db = this.getDb();
      const id = nanoid(10);
      db.prepare('INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
        .run(id, data.username, data.email || '', data.password_hash, data.role || 'editor');
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      const existing = await this.getUser(id);
      if (!existing) return { success: false, error: 'User not found' };

      db.prepare('UPDATE users SET username = ?, email = ?, password_hash = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(data.username ?? existing.username, data.email ?? existing.email, data.password_hash ?? existing.password_hash, data.role ?? existing.role, id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Media
  async getMediaFiles(): Promise<Media[]> {
    const db = this.getDb();
    return db.prepare('SELECT * FROM media ORDER BY created_at DESC').all() as Media[];
  }

  async createMedia(data: Omit<Media, 'id' | 'created_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const db = this.getDb();
      const id = nanoid(10);
      db.prepare('INSERT INTO media (id, name, url, size, mime_type) VALUES (?, ?, ?, ?, ?)')
        .run(id, data.name, data.url, data.size || 0, data.mime_type || '');
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteMedia(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = this.getDb();
      db.prepare('DELETE FROM media WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
