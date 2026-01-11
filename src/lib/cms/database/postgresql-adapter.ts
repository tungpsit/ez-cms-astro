import { nanoid } from 'nanoid';
import type { Author, Category, ContactForm, DatabaseAdapter, FormSubmission, Media, Menu, Page, Post, User } from './types';

type PgPool = import('pg').Pool;

export class PostgresqlAdapter implements DatabaseAdapter {
  private pool: PgPool | null = null;
  private config: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    connectionString?: string;
  };

  constructor(config: { host?: string; port?: number; user?: string; password?: string; database?: string; connectionString?: string }) {
    this.config = config;
  }

  async init(): Promise<void> {
    const { Pool } = await import('pg');
    this.pool = new Pool({
      ...this.config,
      max: 10,
      ssl: this.config.connectionString ? { rejectUnauthorized: false } : false,
    });
    
    await this.createTables();
  }

  private async createTables(): Promise<void> {
    if (!this.pool) throw new Error('Database not initialized');

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        color VARCHAR(20) DEFAULT '#0ea5e9',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        content TEXT DEFAULT '',
        author VARCHAR(255) DEFAULT 'Admin',
        category VARCHAR(255) DEFAULT 'Uncategorized',
        tags JSONB DEFAULT '[]',
        draft BOOLEAN DEFAULT FALSE,
        featured_image VARCHAR(500) DEFAULT '',
        publish_date TIMESTAMP,
        updated_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        content TEXT DEFAULT '',
        template VARCHAR(100) DEFAULT 'default',
        draft BOOLEAN DEFAULT FALSE,
        featured_image VARCHAR(500) DEFAULT '',
        publish_date TIMESTAMP,
        updated_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS authors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) DEFAULT '',
        bio TEXT DEFAULT '',
        avatar VARCHAR(500) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS menus (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        items JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) DEFAULT '',
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'editor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS media (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        size INTEGER DEFAULT 0,
        mime_type VARCHAR(100) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS contact_forms (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        fields JSONB DEFAULT '[]',
        mail_settings JSONB DEFAULT '{}',
        messages JSONB DEFAULT '{}',
        submit_button_text VARCHAR(100) DEFAULT 'Send Message',
        css_class VARCHAR(100) DEFAULT '',
        honeypot BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id VARCHAR(50) PRIMARY KEY,
        form_id VARCHAR(50) NOT NULL REFERENCES contact_forms(id) ON DELETE CASCADE,
        form_title VARCHAR(255) NOT NULL,
        data JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'new',
        ip_address VARCHAR(45) DEFAULT '',
        user_agent TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  private getPool(): PgPool {
    if (!this.pool) throw new Error('Database not initialized');
    return this.pool;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const result = await this.getPool().query('SELECT * FROM categories ORDER BY name');
    return result.rows as Category[];
  }

  async getCategory(id: string): Promise<Category | null> {
    const result = await this.getPool().query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] as Category || null;
  }

  async createCategory(data: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = data.slug || nanoid(10);
      await this.getPool().query(
        'INSERT INTO categories (id, name, slug, description, color) VALUES ($1, $2, $3, $4, $5)',
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
        await this.getPool().query('DELETE FROM categories WHERE id = $1', [id]);
        await this.getPool().query(
          'INSERT INTO categories (id, name, slug, description, color, updated_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
          [newId, data.name || existing.name, newSlug, data.description ?? existing.description, data.color ?? existing.color]
        );
        return { success: true, newId };
      } else {
        await this.getPool().query(
          'UPDATE categories SET name = $1, slug = $2, description = $3, color = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
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
      await this.getPool().query('DELETE FROM categories WHERE id = $1', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Posts
  async getPosts(): Promise<Post[]> {
    const result = await this.getPool().query('SELECT * FROM posts ORDER BY publish_date DESC');
    return result.rows.map(row => ({
      ...row,
      tags: row.tags || [],
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date),
      updated_date: row.updated_date ? new Date(row.updated_date) : undefined,
    })) as Post[];
  }

  async getPost(id: string): Promise<Post | null> {
    const result = await this.getPool().query('SELECT * FROM posts WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      tags: row.tags || [],
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date),
      updated_date: row.updated_date ? new Date(row.updated_date) : undefined,
    } as Post;
  }

  async createPost(data: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = data.slug || nanoid(10);
      await this.getPool().query(
        `INSERT INTO posts (id, title, slug, description, content, author, category, tags, draft, featured_image, publish_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [id, data.title, data.slug, data.description || '', data.content || '', data.author || 'Admin', data.category || 'Uncategorized',
         JSON.stringify(data.tags || []), data.draft || false, data.featured_image || '', data.publish_date || new Date()]
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

      await this.getPool().query(
        `UPDATE posts SET title = $1, slug = $2, description = $3, content = $4, author = $5, category = $6,
         tags = $7, draft = $8, featured_image = $9, updated_date = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11`,
        [data.title ?? existing.title, data.slug ?? existing.slug, data.description ?? existing.description,
         data.content ?? existing.content, data.author ?? existing.author, data.category ?? existing.category,
         JSON.stringify(data.tags ?? existing.tags), data.draft ?? existing.draft,
         data.featured_image ?? existing.featured_image, new Date(), id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deletePost(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().query('DELETE FROM posts WHERE id = $1', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Pages
  async getPages(): Promise<Page[]> {
    const result = await this.getPool().query('SELECT * FROM pages ORDER BY title');
    return result.rows.map(row => ({
      ...row,
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date),
      updated_date: row.updated_date ? new Date(row.updated_date) : undefined,
    })) as Page[];
  }

  async getPage(id: string): Promise<Page | null> {
    const result = await this.getPool().query('SELECT * FROM pages WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date),
      updated_date: row.updated_date ? new Date(row.updated_date) : undefined,
    } as Page;
  }

  async createPage(data: Omit<Page, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = data.slug || nanoid(10);
      await this.getPool().query(
        `INSERT INTO pages (id, title, slug, description, content, template, draft, featured_image, publish_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, data.title, data.slug, data.description || '', data.content || '', data.template || 'default',
         data.draft || false, data.featured_image || '', data.publish_date || new Date()]
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

      await this.getPool().query(
        `UPDATE pages SET title = $1, slug = $2, description = $3, content = $4, template = $5,
         draft = $6, featured_image = $7, updated_date = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9`,
        [data.title ?? existing.title, data.slug ?? existing.slug, data.description ?? existing.description,
         data.content ?? existing.content, data.template ?? existing.template,
         data.draft ?? existing.draft, data.featured_image ?? existing.featured_image, new Date(), id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deletePage(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().query('DELETE FROM pages WHERE id = $1', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Authors
  async getAuthors(): Promise<Author[]> {
    const result = await this.getPool().query('SELECT * FROM authors ORDER BY name');
    return result.rows as Author[];
  }

  async getAuthor(id: string): Promise<Author | null> {
    const result = await this.getPool().query('SELECT * FROM authors WHERE id = $1', [id]);
    return result.rows[0] as Author || null;
  }

  async createAuthor(data: Omit<Author, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      await this.getPool().query(
        'INSERT INTO authors (id, name, email, bio, avatar) VALUES ($1, $2, $3, $4, $5)',
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

      await this.getPool().query(
        'UPDATE authors SET name = $1, email = $2, bio = $3, avatar = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
        [data.name ?? existing.name, data.email ?? existing.email, data.bio ?? existing.bio, data.avatar ?? existing.avatar, id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteAuthor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().query('DELETE FROM authors WHERE id = $1', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Menus
  async getMenus(): Promise<Menu[]> {
    const result = await this.getPool().query('SELECT * FROM menus ORDER BY name');
    return result.rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? row.items : JSON.stringify(row.items || []),
    })) as Menu[];
  }

  async getMenu(id: string): Promise<Menu | null> {
    const result = await this.getPool().query('SELECT * FROM menus WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    return {
      ...result.rows[0],
      items: typeof result.rows[0].items === 'string' ? result.rows[0].items : JSON.stringify(result.rows[0].items || []),
    } as Menu;
  }

  async createMenu(data: Omit<Menu, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      await this.getPool().query(
        'INSERT INTO menus (id, name, items) VALUES ($1, $2, $3)',
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

      await this.getPool().query(
        'UPDATE menus SET name = $1, items = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [data.name ?? existing.name, data.items ?? existing.items, id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteMenu(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().query('DELETE FROM menus WHERE id = $1', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    const result = await this.getPool().query('SELECT * FROM users ORDER BY username');
    return result.rows as User[];
  }

  async getUser(id: string): Promise<User | null> {
    const result = await this.getPool().query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] as User || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await this.getPool().query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] as User || null;
  }

  async createUser(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      await this.getPool().query(
        'INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
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

      await this.getPool().query(
        'UPDATE users SET username = $1, email = $2, password_hash = $3, role = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5',
        [data.username ?? existing.username, data.email ?? existing.email, data.password_hash ?? existing.password_hash, data.role ?? existing.role, id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().query('DELETE FROM users WHERE id = $1', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Media
  async getMediaFiles(): Promise<Media[]> {
    const result = await this.getPool().query('SELECT * FROM media ORDER BY created_at DESC');
    return result.rows as Media[];
  }

  async createMedia(data: Omit<Media, 'id' | 'created_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      await this.getPool().query(
        'INSERT INTO media (id, name, url, size, mime_type) VALUES ($1, $2, $3, $4, $5)',
        [id, data.name, data.url, data.size || 0, data.mime_type || '']
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteMedia(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().query('DELETE FROM media WHERE id = $1', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Contact Forms
  async getContactForms(): Promise<ContactForm[]> {
    const result = await this.getPool().query('SELECT * FROM contact_forms ORDER BY created_at DESC');
    return result.rows.map(row => ({
      ...row,
      fields: typeof row.fields === 'string' ? row.fields : JSON.stringify(row.fields || []),
      mail_settings: typeof row.mail_settings === 'string' ? row.mail_settings : JSON.stringify(row.mail_settings || {}),
      messages: typeof row.messages === 'string' ? row.messages : JSON.stringify(row.messages || {}),
      honeypot: Boolean(row.honeypot),
    })) as ContactForm[];
  }

  async getContactForm(id: string): Promise<ContactForm | null> {
    const result = await this.getPool().query('SELECT * FROM contact_forms WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      fields: typeof row.fields === 'string' ? row.fields : JSON.stringify(row.fields || []),
      mail_settings: typeof row.mail_settings === 'string' ? row.mail_settings : JSON.stringify(row.mail_settings || {}),
      messages: typeof row.messages === 'string' ? row.messages : JSON.stringify(row.messages || {}),
      honeypot: Boolean(row.honeypot),
    } as ContactForm;
  }

  async getContactFormBySlug(slug: string): Promise<ContactForm | null> {
    const result = await this.getPool().query('SELECT * FROM contact_forms WHERE slug = $1', [slug]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      fields: typeof row.fields === 'string' ? row.fields : JSON.stringify(row.fields || []),
      mail_settings: typeof row.mail_settings === 'string' ? row.mail_settings : JSON.stringify(row.mail_settings || {}),
      messages: typeof row.messages === 'string' ? row.messages : JSON.stringify(row.messages || {}),
      honeypot: Boolean(row.honeypot),
    } as ContactForm;
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    const result = await this.getPool().query('SELECT * FROM posts WHERE slug = $1', [slug]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      tags: row.tags || [],
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date),
      updated_date: row.updated_date ? new Date(row.updated_date) : undefined,
    } as Post;
  }

  async getPageBySlug(slug: string): Promise<Page | null> {
    const result = await this.getPool().query('SELECT * FROM pages WHERE slug = $1', [slug]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    return {
      ...row,
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date),
      updated_date: row.updated_date ? new Date(row.updated_date) : undefined,
    } as Page;
  }

  async createContactForm(data: Omit<ContactForm, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = data.slug || nanoid(10);
      await this.getPool().query(
        `INSERT INTO contact_forms (id, title, slug, fields, mail_settings, messages, submit_button_text, css_class, honeypot)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, data.title, data.slug, data.fields || '[]', data.mail_settings || '{}',
         data.messages || '{}', data.submit_button_text || 'Send Message', data.css_class || '', data.honeypot ?? true]
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateContactForm(id: string, data: Partial<ContactForm>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getContactForm(id);
      if (!existing) return { success: false, error: 'Form not found' };

      await this.getPool().query(
        `UPDATE contact_forms SET title = $1, slug = $2, fields = $3, mail_settings = $4, messages = $5,
         submit_button_text = $6, css_class = $7, honeypot = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9`,
        [data.title ?? existing.title, data.slug ?? existing.slug, data.fields ?? existing.fields,
         data.mail_settings ?? existing.mail_settings, data.messages ?? existing.messages,
         data.submit_button_text ?? existing.submit_button_text, data.css_class ?? existing.css_class,
         data.honeypot ?? existing.honeypot, id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteContactForm(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().query('DELETE FROM contact_forms WHERE id = $1', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Form Submissions
  async getFormSubmissions(formId?: string): Promise<FormSubmission[]> {
    if (formId) {
      const result = await this.getPool().query('SELECT * FROM form_submissions WHERE form_id = $1 ORDER BY created_at DESC', [formId]);
      return result.rows.map(row => ({
        ...row,
        data: typeof row.data === 'string' ? row.data : JSON.stringify(row.data || {}),
      })) as FormSubmission[];
    }
    const result = await this.getPool().query('SELECT * FROM form_submissions ORDER BY created_at DESC');
    return result.rows.map(row => ({
      ...row,
      data: typeof row.data === 'string' ? row.data : JSON.stringify(row.data || {}),
    })) as FormSubmission[];
  }

  async getFormSubmission(id: string): Promise<FormSubmission | null> {
    const result = await this.getPool().query('SELECT * FROM form_submissions WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    return {
      ...result.rows[0],
      data: typeof result.rows[0].data === 'string' ? result.rows[0].data : JSON.stringify(result.rows[0].data || {}),
    } as FormSubmission;
  }

  async createFormSubmission(data: Omit<FormSubmission, 'id' | 'created_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      await this.getPool().query(
        `INSERT INTO form_submissions (id, form_id, form_title, data, status, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, data.form_id, data.form_title, data.data || '{}', data.status || 'new', data.ip_address || '', data.user_agent || '']
      );
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateFormSubmission(id: string, data: Partial<FormSubmission>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getFormSubmission(id);
      if (!existing) return { success: false, error: 'Submission not found' };

      await this.getPool().query('UPDATE form_submissions SET status = $1 WHERE id = $2', [data.status ?? existing.status, id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteFormSubmission(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getPool().query('DELETE FROM form_submissions WHERE id = $1', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
