import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import type { Author, Category, ContactForm, DatabaseAdapter, FormSubmission, Media, Menu, Page, Post, User } from './types';

export class SupabaseAdapter implements DatabaseAdapter {
  private supabase: SupabaseClient | null = null;
  private config: {
    url: string;
    key: string;
  };

  constructor(config: { url: string; key: string }) {
    this.config = config;
  }

  async init(): Promise<void> {
    if (!this.config.url || !this.config.key) {
      throw new Error('Supabase URL and Key are required');
    }
    this.supabase = createClient(this.config.url, this.config.key, {
      auth: {
        persistSession: false,
      },
    });
    
    // We don't create tables via API as it's not supported by supabase-js
    // Users should create tables via Supabase SQL Editor
    console.log('[SupabaseAdapter] Initialized. Ensure tables exist in your Supabase project.');
  }

  async close(): Promise<void> {
    this.supabase = null;
  }

  private getClient(): SupabaseClient {
    if (!this.supabase) throw new Error('Database not initialized');
    return this.supabase;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.getClient()
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Category[];
  }

  async getCategory(id: string): Promise<Category | null> {
    const { data, error } = await this.getClient()
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Category | null;
  }

  async createCategory(data: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = data.slug || nanoid(10);
      const { error } = await this.getClient()
        .from('categories')
        .insert([{
          id,
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          color: data.color || '#0ea5e9'
        }]);
      
      if (error) throw error;
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
        // Handle ID change (delete and re-insert)
        const { error: deleteError } = await this.getClient()
          .from('categories')
          .delete()
          .eq('id', id);
        
        if (deleteError) throw deleteError;

        const { error: insertError } = await this.getClient()
          .from('categories')
          .insert([{
            id: newId,
            name: data.name || existing.name,
            slug: newSlug,
            description: data.description ?? existing.description,
            color: data.color ?? existing.color,
            updated_at: new Date().toISOString()
          }]);
        
        if (insertError) throw insertError;
        return { success: true, newId };
      } else {
        const { error } = await this.getClient()
          .from('categories')
          .update({
            name: data.name || existing.name,
            slug: newSlug,
            description: data.description ?? existing.description,
            color: data.color ?? existing.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
        
        if (error) throw error;
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient()
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Posts
  async getPosts(): Promise<Post[]> {
    const { data, error } = await this.getClient()
      .from('posts')
      .select('*')
      .order('publish_date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(row => ({
      ...row,
      tags: row.tags || [],
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date),
      updated_date: row.updated_date ? new Date(row.updated_date) : undefined,
    })) as Post[];
  }

  async getPost(id: string): Promise<Post | null> {
    const { data, error } = await this.getClient()
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      ...data,
      tags: data.tags || [],
      draft: Boolean(data.draft),
      publish_date: new Date(data.publish_date),
      updated_date: data.updated_date ? new Date(data.updated_date) : undefined,
    } as Post;
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    const { data, error } = await this.getClient()
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      ...data,
      tags: data.tags || [],
      draft: Boolean(data.draft),
      publish_date: new Date(data.publish_date),
      updated_date: data.updated_date ? new Date(data.updated_date) : undefined,
    } as Post;
  }

  async createPost(data: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = data.slug || nanoid(10);
      const { error } = await this.getClient()
        .from('posts')
        .insert([{
          id,
          title: data.title,
          slug: data.slug,
          description: data.description || '',
          content: data.content || '',
          author: data.author || 'Admin',
          category: data.category || 'Uncategorized',
          tags: data.tags || [],
          draft: data.draft || false,
          featured_image: data.featured_image || '',
          publish_date: data.publish_date || new Date().toISOString()
        }]);
      
      if (error) throw error;
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updatePost(id: string, data: Partial<Post>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getPost(id);
      if (!existing) return { success: false, error: 'Post not found' };

      const { error } = await this.getClient()
        .from('posts')
        .update({
          title: data.title ?? existing.title,
          slug: data.slug ?? existing.slug,
          description: data.description ?? existing.description,
          content: data.content ?? existing.content,
          author: data.author ?? existing.author,
          category: data.category ?? existing.category,
          tags: data.tags ?? existing.tags,
          draft: data.draft ?? existing.draft,
          featured_image: data.featured_image ?? existing.featured_image,
          updated_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deletePost(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient()
        .from('posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Pages
  async getPages(): Promise<Page[]> {
    const { data, error } = await this.getClient()
      .from('pages')
      .select('*')
      .order('title');
    
    if (error) throw error;
    return (data || []).map(row => ({
      ...row,
      draft: Boolean(row.draft),
      publish_date: new Date(row.publish_date),
      updated_date: row.updated_date ? new Date(row.updated_date) : undefined,
    })) as Page[];
  }

  async getPage(id: string): Promise<Page | null> {
    const { data, error } = await this.getClient()
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      ...data,
      draft: Boolean(data.draft),
      publish_date: new Date(data.publish_date),
      updated_date: data.updated_date ? new Date(data.updated_date) : undefined,
    } as Page;
  }

  async getPageBySlug(slug: string): Promise<Page | null> {
    const { data, error } = await this.getClient()
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      ...data,
      draft: Boolean(data.draft),
      publish_date: new Date(data.publish_date),
      updated_date: data.updated_date ? new Date(data.updated_date) : undefined,
    } as Page;
  }

  async createPage(data: Omit<Page, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = data.slug || nanoid(10);
      const { error } = await this.getClient()
        .from('pages')
        .insert([{
          id,
          title: data.title,
          slug: data.slug,
          description: data.description || '',
          content: data.content || '',
          template: data.template || 'default',
          draft: data.draft || false,
          featured_image: data.featured_image || '',
          publish_date: data.publish_date || new Date().toISOString()
        }]);
      
      if (error) throw error;
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updatePage(id: string, data: Partial<Page>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getPage(id);
      if (!existing) return { success: false, error: 'Page not found' };

      const { error } = await this.getClient()
        .from('pages')
        .update({
          title: data.title ?? existing.title,
          slug: data.slug ?? existing.slug,
          description: data.description ?? existing.description,
          content: data.content ?? existing.content,
          template: data.template ?? existing.template,
          draft: data.draft ?? existing.draft,
          featured_image: data.featured_image ?? existing.featured_image,
          updated_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deletePage(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient()
        .from('pages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Authors
  async getAuthors(): Promise<Author[]> {
    const { data, error } = await this.getClient()
      .from('authors')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Author[];
  }

  async getAuthor(id: string): Promise<Author | null> {
    const { data, error } = await this.getClient()
      .from('authors')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Author | null;
  }

  async createAuthor(data: Omit<Author, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      const { error } = await this.getClient()
        .from('authors')
        .insert([{
          id,
          name: data.name,
          email: data.email || '',
          bio: data.bio || '',
          avatar: data.avatar || ''
        }]);
      
      if (error) throw error;
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateAuthor(id: string, data: Partial<Author>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getAuthor(id);
      if (!existing) return { success: false, error: 'Author not found' };

      const { error } = await this.getClient()
        .from('authors')
        .update({
          name: data.name ?? existing.name,
          email: data.email ?? existing.email,
          bio: data.bio ?? existing.bio,
          avatar: data.avatar ?? existing.avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteAuthor(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient()
        .from('authors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Menus
  async getMenus(): Promise<Menu[]> {
    const { data, error } = await this.getClient()
      .from('menus')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []).map(row => ({
      ...row,
      items: typeof row.items === 'string' ? row.items : JSON.stringify(row.items || []),
    })) as Menu[];
  }

  async getMenu(id: string): Promise<Menu | null> {
    const { data, error } = await this.getClient()
      .from('menus')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      ...data,
      items: typeof data.items === 'string' ? data.items : JSON.stringify(data.items || []),
    } as Menu;
  }

  async createMenu(data: Omit<Menu, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      const { error } = await this.getClient()
        .from('menus')
        .insert([{
          id,
          name: data.name,
          items: data.items || '[]'
        }]);
      
      if (error) throw error;
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateMenu(id: string, data: Partial<Menu>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getMenu(id);
      if (!existing) return { success: false, error: 'Menu not found' };

      const { error } = await this.getClient()
        .from('menus')
        .update({
          name: data.name ?? existing.name,
          items: data.items ?? existing.items,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteMenu(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient()
        .from('menus')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await this.getClient()
      .from('users')
      .select('*')
      .order('username');
    
    if (error) throw error;
    return data as User[];
  }

  async getUser(id: string): Promise<User | null> {
    const { data, error } = await this.getClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as User | null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await this.getClient()
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as User | null;
  }

  async createUser(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      const { error } = await this.getClient()
        .from('users')
        .insert([{
          id,
          username: data.username,
          email: data.email || '',
          password_hash: data.password_hash,
          role: data.role || 'editor'
        }]);
      
      if (error) throw error;
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getUser(id);
      if (!existing) return { success: false, error: 'User not found' };

      const { error } = await this.getClient()
        .from('users')
        .update({
          username: data.username ?? existing.username,
          email: data.email ?? existing.email,
          password_hash: data.password_hash ?? existing.password_hash,
          role: data.role ?? existing.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient()
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Media
  async getMediaFiles(): Promise<Media[]> {
    const { data, error } = await this.getClient()
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Media[];
  }

  async createMedia(data: Omit<Media, 'id' | 'created_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      const { error } = await this.getClient()
        .from('media')
        .insert([{
          id,
          name: data.name,
          url: data.url,
          size: data.size || 0,
          mime_type: data.mime_type || ''
        }]);
      
      if (error) throw error;
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteMedia(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient()
        .from('media')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Contact Forms
  async getContactForms(): Promise<ContactForm[]> {
    const { data, error } = await this.getClient()
      .from('contact_forms')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(row => ({
      ...row,
      fields: typeof row.fields === 'string' ? row.fields : JSON.stringify(row.fields || []),
      mail_settings: typeof row.mail_settings === 'string' ? row.mail_settings : JSON.stringify(row.mail_settings || {}),
      messages: typeof row.messages === 'string' ? row.messages : JSON.stringify(row.messages || {}),
      honeypot: Boolean(row.honeypot),
    })) as ContactForm[];
  }

  async getContactForm(id: string): Promise<ContactForm | null> {
    const { data, error } = await this.getClient()
      .from('contact_forms')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      ...data,
      fields: typeof data.fields === 'string' ? data.fields : JSON.stringify(data.fields || []),
      mail_settings: typeof data.mail_settings === 'string' ? data.mail_settings : JSON.stringify(data.mail_settings || {}),
      messages: typeof data.messages === 'string' ? data.messages : JSON.stringify(data.messages || {}),
      honeypot: Boolean(data.honeypot),
    } as ContactForm;
  }

  async getContactFormBySlug(slug: string): Promise<ContactForm | null> {
    const { data, error } = await this.getClient()
      .from('contact_forms')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      ...data,
      fields: typeof data.fields === 'string' ? data.fields : JSON.stringify(data.fields || []),
      mail_settings: typeof data.mail_settings === 'string' ? data.mail_settings : JSON.stringify(data.mail_settings || {}),
      messages: typeof data.messages === 'string' ? data.messages : JSON.stringify(data.messages || {}),
      honeypot: Boolean(data.honeypot),
    } as ContactForm;
  }

  async createContactForm(data: Omit<ContactForm, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = data.slug || nanoid(10);
      const { error } = await this.getClient()
        .from('contact_forms')
        .insert([{
          id,
          title: data.title,
          slug: data.slug,
          fields: data.fields || '[]',
          mail_settings: data.mail_settings || '{}',
          messages: data.messages || '{}',
          submit_button_text: data.submit_button_text || 'Send Message',
          css_class: data.css_class || '',
          honeypot: data.honeypot ?? true
        }]);
      
      if (error) throw error;
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateContactForm(id: string, data: Partial<ContactForm>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getContactForm(id);
      if (!existing) return { success: false, error: 'Form not found' };

      const { error } = await this.getClient()
        .from('contact_forms')
        .update({
          title: data.title ?? existing.title,
          slug: data.slug ?? existing.slug,
          fields: data.fields ?? existing.fields,
          mail_settings: data.mail_settings ?? existing.mail_settings,
          messages: data.messages ?? existing.messages,
          submit_button_text: data.submit_button_text ?? existing.submit_button_text,
          css_class: data.css_class ?? existing.css_class,
          honeypot: data.honeypot ?? existing.honeypot,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteContactForm(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient()
        .from('contact_forms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  // Form Submissions
  async getFormSubmissions(formId?: string): Promise<FormSubmission[]> {
    let query = this.getClient()
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (formId) {
      query = query.eq('form_id', formId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []).map(row => ({
      ...row,
      data: typeof row.data === 'string' ? row.data : JSON.stringify(row.data || {}),
    })) as FormSubmission[];
  }

  async getFormSubmission(id: string): Promise<FormSubmission | null> {
    const { data, error } = await this.getClient()
      .from('form_submissions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      ...data,
      data: typeof data.data === 'string' ? data.data : JSON.stringify(data.data || {}),
    } as FormSubmission;
  }

  async createFormSubmission(data: Omit<FormSubmission, 'id' | 'created_at'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const id = nanoid(10);
      const { error } = await this.getClient()
        .from('form_submissions')
        .insert([{
          id,
          form_id: data.form_id,
          form_title: data.form_title,
          data: data.data || '{}',
          status: data.status || 'new',
          ip_address: data.ip_address || '',
          user_agent: data.user_agent || ''
        }]);
      
      if (error) throw error;
      return { success: true, id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateFormSubmission(id: string, data: Partial<FormSubmission>): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.getFormSubmission(id);
      if (!existing) return { success: false, error: 'Submission not found' };

      const { error } = await this.getClient()
        .from('form_submissions')
        .update({
          status: data.status ?? existing.status
        })
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async deleteFormSubmission(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient()
        .from('form_submissions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
}
