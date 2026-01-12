export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  draft: boolean;
  featured_image: string;
  publish_date: Date;
  updated_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  template: string;
  draft: boolean;
  featured_image: string;
  publish_date: Date;
  updated_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface Author {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Menu {
  id: string;
  name: string;
  items: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Media {
  id: string;
  name: string;
  url: string;
  size: number;
  mime_type: string;
  created_at?: Date;
}

export interface ContactForm {
  id: string;
  title: string;
  slug: string;
  fields: string; // JSON string of FormField[]
  mail_settings: string; // JSON string of MailSettings
  messages: string; // JSON string of FormMessages
  submit_button_text: string;
  css_class: string;
  honeypot: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export type SubmissionStatus = 'new' | 'read' | 'replied' | 'spam' | 'trash';

export interface FormSubmission {
  id: string;
  form_id: string;
  form_title: string;
  data: string; // JSON string of submission data
  status: SubmissionStatus;
  ip_address: string;
  user_agent: string;
  created_at?: Date;
}

export interface DatabaseAdapter {
  init(): Promise<void>;
  close(): Promise<void>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | null>;
  createCategory(data: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }>;
  updateCategory(id: string, data: Partial<Category>): Promise<{ success: boolean; newId?: string; error?: string }>;
  deleteCategory(id: string): Promise<{ success: boolean; error?: string }>;
  
  // Posts
  getPosts(): Promise<Post[]>;
  getPost(id: string): Promise<Post | null>;
  getPostBySlug(slug: string): Promise<Post | null>;
  createPost(data: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }>;
  updatePost(id: string, data: Partial<Post>): Promise<{ success: boolean; error?: string }>;
  deletePost(id: string): Promise<{ success: boolean; error?: string }>;
  
  // Pages
  getPages(): Promise<Page[]>;
  getPage(id: string): Promise<Page | null>;
  getPageBySlug(slug: string): Promise<Page | null>;
  createPage(data: Omit<Page, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }>;
  updatePage(id: string, data: Partial<Page>): Promise<{ success: boolean; error?: string }>;
  deletePage(id: string): Promise<{ success: boolean; error?: string }>;
  
  // Authors
  getAuthors(): Promise<Author[]>;
  getAuthor(id: string): Promise<Author | null>;
  createAuthor(data: Omit<Author, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }>;
  updateAuthor(id: string, data: Partial<Author>): Promise<{ success: boolean; error?: string }>;
  deleteAuthor(id: string): Promise<{ success: boolean; error?: string }>;
  
  // Menus
  getMenus(): Promise<Menu[]>;
  getMenu(id: string): Promise<Menu | null>;
  createMenu(data: Omit<Menu, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }>;
  updateMenu(id: string, data: Partial<Menu>): Promise<{ success: boolean; error?: string }>;
  deleteMenu(id: string): Promise<{ success: boolean; error?: string }>;
  
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(data: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }>;
  updateUser(id: string, data: Partial<User>): Promise<{ success: boolean; error?: string }>;
  deleteUser(id: string): Promise<{ success: boolean; error?: string }>;
  
  // Media
  getMediaFiles(): Promise<Media[]>;
  createMedia(data: Omit<Media, 'id' | 'created_at'>): Promise<{ success: boolean; id?: string; error?: string }>;
  deleteMedia(id: string): Promise<{ success: boolean; error?: string }>;
  
  // Contact Forms
  getContactForms(): Promise<ContactForm[]>;
  getContactForm(id: string): Promise<ContactForm | null>;
  getContactFormBySlug(slug: string): Promise<ContactForm | null>;
  createContactForm(data: Omit<ContactForm, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }>;
  updateContactForm(id: string, data: Partial<ContactForm>): Promise<{ success: boolean; error?: string }>;
  deleteContactForm(id: string): Promise<{ success: boolean; error?: string }>;
  
  // Form Submissions
  getFormSubmissions(formId?: string): Promise<FormSubmission[]>;
  getFormSubmission(id: string): Promise<FormSubmission | null>;
  createFormSubmission(data: Omit<FormSubmission, 'id' | 'created_at'>): Promise<{ success: boolean; id?: string; error?: string }>;
  updateFormSubmission(id: string, data: Partial<FormSubmission>): Promise<{ success: boolean; error?: string }>;
  deleteFormSubmission(id: string): Promise<{ success: boolean; error?: string }>;
}

export type DatabaseType = 'sqlite' | 'mysql' | 'postgresql' | 'supabase';

export interface DatabaseConfig {
  type: DatabaseType;
  sqlite?: {
    filename: string;
  };
  mysql?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  postgresql?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  supabase?: {
    url: string;
    key: string;
  };
}
