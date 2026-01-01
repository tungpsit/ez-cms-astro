import type { DatabaseAdapter, Category, Post, Page, Author, Menu, User, Media } from './types';
import { nanoid } from 'nanoid';

type MySqlPool = import('mysql2/promise').Pool;

export class MysqlAdapter implements DatabaseAdapter {
  private pool: MySqlPool | null = null;
  private config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };

  constructor(config: { host: string; port: number; user: string; password: string; database: string }) {
    this.config = config;
  }

  async init(): Promise<void> {
    const mysql = await import('mysql2/promise');
    this.pool = mysql.createPool({
      ...this.config,
      waitForConnections: true,
      connectionLimit: 10,
    });
    
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');

    const queries = [
      `CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(20) DEFAULT '#0ea5e9',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        content LONGTEXT,
        author VARCHAR(255) DEFAULT 'Admin',
        category VARCHAR(255) DEFAULT 'Uncategorized',
        tags JSON,
        draft BOOLEAN DEFAULT FALSE,
        featured_image VARCHAR(500),
        publish_date DATETIME,
        updated_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        content LONGTEXT,
        template VARCHAR(100) DEFAULT 'default',
        draft BOOLEAN DEFAULT FALSE,
        featured_image VARCHAR(500),
        publish_date DATETIME,
        updated_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS authors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        bio TEXT,
        avatar VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS menus (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        items JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'editor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS media (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        size INT DEFAULT 0,
        mime_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const query of queries) {
      await this.pool.execute(query);
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  private getPool(): MySqlPool {
    if (!this.pool) throw new Error('Database not initialized');
    return this.pool;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const [rows] = await this.getPool().execute('SELECT * FROM categories ORDER BY name');
    return rows as Category[];
  }

  async getCategory(id: string): Promise<Category | null> {
    const [rows] = await this.getPool().execute('SELECT * FROM categories WHERE id = ?', [id]);
    const results = rows as Category[];
    return results[0] || null;
  }

  async createCategory(data: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = data.slug || nanoid(10);
      await this.getPool().execute(
        'INSERT INTO categories (id, name, slug, description, color) VALUES (?, ?, ?, ?, ?)',
        [id, data.name, data.slug, data.description || '', data.color || '#0ea5e9']
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<{ success: boolean; newId?: string; error?: string }> {
    try {
      const existing = await this.getCategory(id);
      if (!existing) return { success: false, error: 'Category not found' };

      const newSlug = data.slug || existing.slug;
      const newId = newSlug !== id ? newSlug : id;

      if (newId !== id) {
        await this.getPool().execute('DELETE FROM categories WHERE id = ?', [id]);
        await this.getPool().execute(
          'INSERT INTO categories (id, name, slug, description, color) VALUES (?, ?, ?, ?, ?)',
          [newId, data.name || existing.name, newSlug, data.description ?? existing.description, data.color ?? existing.color]
        );
        return { success: true, newId };
      } else {
        await this.getPool().execute(
          'UPDATE categories SET name = ?, slug = ?, description = ?, color = ? WHERE id = ?',
          [data.name || existing.name, newSlug, data.description ?? existing.description, data.color ?? existing.color, id]
        );
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().execute('DELETE FROM categories WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Posts
  async getPosts(): Promise<Post[]> {
    const [rows] = await this.getPool().execute('SELECT * FROM posts ORDER BY publish_date DESC');
    return (rows as Array<Record<string, unknown>>).map(row => ({
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date as string),
      updated_date: row.updated_date ? new Date(row.updated_date as string) : undefined,
    })) as Post[];
  }

  async getPost(id: string): Promise<Post | null> {
    const [rows] = await this.getPool().execute('SELECT * FROM posts WHERE id = ?', [id]);
    const results = rows as Array<Record<string, unknown>>;
    if (!results[0]) return null;
    const row = results[0];
    return {
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date as string),
      updated_date: row.updated_date ? new Date(row.updated_date as string) : undefined,
    } as Post;
  }

  async createPost(data: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = data.slug || nanoid(10);
      await this.getPool().execute(
        `INSERT INTO posts (id, title, slug, description, content, author, category, tags, draft, featured_image, publish_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.title, data.slug, data.description || '', data.content || '', data.author || 'Admin', data.category || 'Uncategorized',
         JSON.stringify(data.tags || []), data.draft ? 1 : 0, data.featured_image || '', data.publish_date || new Date()]
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updatePost(id: string, data: Partial<Post>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getPost(id);
      if (!existing) return { success: false, error: 'Post not found' };

      await this.getPool().execute(
        `UPDATE posts SET title = ?, slug = ?, description = ?, content = ?, author = ?, category = ?,
         tags = ?, draft = ?, featured_image = ?, updated_date = ? WHERE id = ?`,
        [data.title ?? existing.title, data.slug ?? existing.slug, data.description ?? existing.description,
         data.content ?? existing.content, data.author ?? existing.author, data.category ?? existing.category,
         JSON.stringify(data.tags ?? existing.tags), (data.draft ?? existing.draft) ? 1 : 0,
         data.featured_image ?? existing.featured_image, new Date(), id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deletePost(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().execute('DELETE FROM posts WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Pages
  async getPages(): Promise<Page[]> {
    const [rows] = await this.getPool().execute('SELECT * FROM pages ORDER BY title');
    return (rows as Array<Record<string, unknown>>).map(row => ({
      ...row,
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date as string),
      updated_date: row.updated_date ? new Date(row.updated_date as string) : undefined,
    })) as Page[];
  }

  async getPage(id: string): Promise<Page | null> {
    const [rows] = await this.getPool().execute('SELECT * FROM pages WHERE id = ?', [id]);
    const results = rows as Array<Record<string, unknown>>;
    if (!results[0]) return null;
    const row = results[0];
    return {
      ...row,
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date as string),
      updated_date: row.updated_date ? new Date(row.updated_date as string) : undefined,
    } as Page;
  }

  async createPage(data: Omit<Page, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = data.slug || nanoid(10);
      await this.getPool().execute(
        `INSERT INTO pages (id, title, slug, description, content, template, draft, featured_image, publish_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.title, data.slug, data.description || '', data.content || '', data.template || 'default',
         data.draft ? 1 : 0, data.featured_image || '', data.publish_date || new Date()]
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updatePage(id: string, data: Partial<Page>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getPage(id);
      if (!existing) return { success: false, error: 'Page not found' };

      await this.getPool().execute(
        `UPDATE pages SET title = ?, slug = ?, description = ?, content = ?, template = ?,
         draft = ?, featured_image = ?, updated_date = ? WHERE id = ?`,
        [data.title ?? existing.title, data.slug ?? existing.slug, data.description ?? existing.description,
         data.content ?? existing.content, data.template ?? existing.template,
         (data.draft ?? existing.draft) ? 1 : 0, data.featured_image ?? existing.featured_image, new Date(), id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deletePage(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().execute('DELETE FROM pages WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Authors
  async getAuthors(): Promise<Author[]> {
    const [rows] = await this.getPool().execute('SELECT * FROM authors ORDER BY name');
    return rows as Author[];
  }

  async getAuthor(id: string): Promise<Author | null> {
    const [rows] = await this.getPool().execute('SELECT * FROM authors WHERE id = ?', [id]);
    const results = rows as Author[];
    return results[0] || null;
  }

  async createAuthor(data: Omit<Author, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      await this.getPool().execute(
        'INSERT INTO authors (id, name, email, bio, avatar) VALUES (?, ?, ?, ?, ?)',
        [id, data.name, data.email || '', data.bio || '', data.avatar || '']
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateAuthor(id: string, data: Partial<Author>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getAuthor(id);
      if (!existing) return { success: false, error: 'Author not found' };

      await this.getPool().execute(
        'UPDATE authors SET name = ?, email = ?, bio = ?, avatar = ? WHERE id = ?',
        [data.name ?? existing.name, data.email ?? existing.email, data.bio ?? existing.bio, data.avatar ?? existing.avatar, id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteAuthor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().execute('DELETE FROM authors WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Menus
  async getMenus(): Promise<Menu[]> {
    const [rows] = await this.getPool().execute('SELECT * FROM menus ORDER BY name');
    return (rows as Array<Record<string, unknown>>).map(row => ({
      ...row,
      items: typeof row.items === 'string' ? row.items : JSON.stringify(row.items || []),
    })) as Menu[];
  }

  async getMenu(id: string): Promise<Menu | null> {
    const [rows] = await this.getPool().execute('SELECT * FROM menus WHERE id = ?', [id]);
    const results = rows as Array<Record<string, unknown>>;
    if (!results[0]) return null;
    return {
      ...results[0],
      items: typeof results[0].items === 'string' ? results[0].items : JSON.stringify(results[0].items || []),
    } as Menu;
  }

  async createMenu(data: Omit<Menu, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      await this.getPool().execute(
        'INSERT INTO menus (id, name, items) VALUES (?, ?, ?)',
        [id, data.name, data.items || '[]']
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateMenu(id: string, data: Partial<Menu>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getMenu(id);
      if (!existing) return { success: false, error: 'Menu not found' };

      await this.getPool().execute(
        'UPDATE menus SET name = ?, items = ? WHERE id = ?',
        [data.name ?? existing.name, data.items ?? existing.items, id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteMenu(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().execute('DELETE FROM menus WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    const [rows] = await this.getPool().execute('SELECT * FROM users ORDER BY username');
    return rows as User[];
  }

  async getUser(id: string): Promise<User | null> {
    const [rows] = await this.getPool().execute('SELECT * FROM users WHERE id = ?', [id]);
    const results = rows as User[];
    return results[0] || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [rows] = await this.getPool().execute('SELECT * FROM users WHERE username = ?', [username]);
    const results = rows as User[];
    return results[0] || null;
  }

  async createUser(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      await this.getPool().execute(
        'INSERT INTO users (id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [id, data.username, data.email || '', data.password_hash, data.role || 'editor']
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getUser(id);
      if (!existing) return { success: false, error: 'User not found' };

      await this.getPool().execute(
        'UPDATE users SET username = ?, email = ?, password_hash = ?, role = ? WHERE id = ?',
        [data.username ?? existing.username, data.email ?? existing.email, data.password_hash ?? existing.password_hash, data.role ?? existing.role, id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().execute('DELETE FROM users WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Media
  async getMediaFiles(): Promise<Media[]> {
    const [rows] = await this.getPool().execute('SELECT * FROM media ORDER BY created_at DESC');
    return rows as Media[];
  }

  async createMedia(data: Omit<Media, 'id' | 'created_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      await this.getPool().execute(
        'INSERT INTO media (id, name, url, size, mime_type) VALUES (?, ?, ?, ?, ?)',
        [id, data.name, data.url, data.size || 0, data.mime_type || '']
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteMedia(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().execute('DELETE FROM media WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
