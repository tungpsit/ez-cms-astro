export interface CMSConfig {
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  logo?: string;
  favicon?: string;
  language: string;
  timezone: string;
  postsPerPage: number;
  dateFormat: string;
  theme: string;
  plugins: string[];
  social: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    github?: string;
    linkedin?: string;
  };
  seo: {
    defaultMetaTitle?: string;
    defaultMetaDescription?: string;
    defaultOgImage?: string;
    googleAnalyticsId?: string;
  };
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  description?: string;
  content: string;
  author: string;
  publishDate: Date;
  updatedDate?: Date;
  featuredImage?: string;
  category: string;
  tags: string[];
  draft: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  description?: string;
  content: string;
  template: 'default' | 'landing' | 'contact' | 'about';
  publishDate?: Date;
  updatedDate?: Date;
  featuredImage?: string;
  draft: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
  };
}

export interface Author {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  avatar?: string;
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
}

export interface MenuItem {
  label: string;
  url: string;
  target: '_self' | '_blank';
  children?: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  location: 'header' | 'footer' | 'sidebar';
  items: MenuItem[];
}

export interface Theme {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  thumbnail?: string;
  settings: Record<string, unknown>;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  hooks: PluginHook[];
}

export interface PluginHook {
  name: string;
  priority: number;
  callback: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  uploadedAt: Date;
}
