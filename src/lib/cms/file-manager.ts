import fs from 'node:fs/promises';
import path from 'node:path';

const CONTENT_DIR = path.join(process.cwd(), 'src/content');
const UPLOADS_DIR = path.join(process.cwd(), 'public/uploads');

export interface ContentFile {
  id: string;
  type: 'post' | 'page' | 'category' | 'author' | 'menu';
  data: Record<string, unknown>;
  content?: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function createPost(data: {
  title: string;
  description?: string;
  content: string;
  author?: string;
  category?: string;
  tags?: string[];
  draft?: boolean;
  featuredImage?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const slug = generateSlug(data.title);
    const filePath = path.join(CONTENT_DIR, 'posts', `${slug}.md`);
    
    const frontmatter = {
      title: data.title,
      description: data.description || '',
      author: data.author || 'Admin',
      publishDate: new Date().toISOString().split('T')[0],
      category: data.category || 'Uncategorized',
      tags: data.tags || [],
      draft: data.draft ?? false,
      featuredImage: data.featuredImage || '',
    };

    const fileContent = `---
title: "${frontmatter.title}"
description: "${frontmatter.description}"
author: "${frontmatter.author}"
publishDate: ${frontmatter.publishDate}
category: "${frontmatter.category}"
tags: [${frontmatter.tags.map(t => `"${t}"`).join(', ')}]
draft: ${frontmatter.draft}
featuredImage: "${frontmatter.featuredImage}"
---

${data.content}
`;

    await fs.writeFile(filePath, fileContent, 'utf-8');
    return { success: true, id: slug };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updatePost(id: string, data: {
  title?: string;
  description?: string;
  content?: string;
  author?: string;
  category?: string;
  tags?: string[];
  draft?: boolean;
  featuredImage?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(CONTENT_DIR, 'posts', `${id}.md`);
    const existing = await fs.readFile(filePath, 'utf-8');
    
    const frontmatterMatch = existing.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      return { success: false, error: 'Invalid file format' };
    }
    
    const existingContent = frontmatterMatch[2];
    
    const frontmatter = {
      title: data.title || '',
      description: data.description || '',
      author: data.author || 'Admin',
      publishDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      category: data.category || 'Uncategorized',
      tags: data.tags || [],
      draft: data.draft ?? false,
      featuredImage: data.featuredImage || '',
    };

    const fileContent = `---
title: "${frontmatter.title}"
description: "${frontmatter.description}"
author: "${frontmatter.author}"
publishDate: ${frontmatter.publishDate}
updatedDate: ${frontmatter.updatedDate}
category: "${frontmatter.category}"
tags: [${frontmatter.tags.map(t => `"${t}"`).join(', ')}]
draft: ${frontmatter.draft}
featuredImage: "${frontmatter.featuredImage}"
---

${data.content !== undefined ? data.content : existingContent}
`;

    await fs.writeFile(filePath, fileContent, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deletePost(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(CONTENT_DIR, 'posts', `${id}.md`);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function createPage(data: {
  title: string;
  description?: string;
  content: string;
  template?: string;
  draft?: boolean;
  featuredImage?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const slug = generateSlug(data.title);
    const filePath = path.join(CONTENT_DIR, 'pages', `${slug}.md`);
    
    const frontmatter = {
      title: data.title,
      description: data.description || '',
      template: data.template || 'default',
      publishDate: new Date().toISOString().split('T')[0],
      draft: data.draft ?? false,
      featuredImage: data.featuredImage || '',
    };

    const fileContent = `---
title: "${frontmatter.title}"
description: "${frontmatter.description}"
template: "${frontmatter.template}"
publishDate: ${frontmatter.publishDate}
draft: ${frontmatter.draft}
featuredImage: "${frontmatter.featuredImage}"
---

${data.content}
`;

    await fs.writeFile(filePath, fileContent, 'utf-8');
    return { success: true, id: slug };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updatePage(id: string, data: {
  title?: string;
  description?: string;
  content?: string;
  template?: string;
  draft?: boolean;
  featuredImage?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(CONTENT_DIR, 'pages', `${id}.md`);
    const existing = await fs.readFile(filePath, 'utf-8');
    
    const frontmatterMatch = existing.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      return { success: false, error: 'Invalid file format' };
    }
    
    const existingContent = frontmatterMatch[2];
    
    const frontmatter = {
      title: data.title || '',
      description: data.description || '',
      template: data.template || 'default',
      publishDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      draft: data.draft ?? false,
      featuredImage: data.featuredImage || '',
    };

    const fileContent = `---
title: "${frontmatter.title}"
description: "${frontmatter.description}"
template: "${frontmatter.template}"
publishDate: ${frontmatter.publishDate}
updatedDate: ${frontmatter.updatedDate}
draft: ${frontmatter.draft}
featuredImage: "${frontmatter.featuredImage}"
---

${data.content !== undefined ? data.content : existingContent}
`;

    await fs.writeFile(filePath, fileContent, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deletePage(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(CONTENT_DIR, 'pages', `${id}.md`);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function createCategory(data: {
  name: string;
  description?: string;
  color?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const slug = generateSlug(data.name);
    const filePath = path.join(CONTENT_DIR, 'categories', `${slug}.json`);
    
    const category = {
      name: data.name,
      slug: slug,
      description: data.description || '',
      color: data.color || '#0ea5e9',
    };

    await fs.writeFile(filePath, JSON.stringify(category, null, 2), 'utf-8');
    return { success: true, id: slug };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateCategory(id: string, data: {
  name?: string;
  description?: string;
  color?: string;
}): Promise<{ success: boolean; newId?: string; error?: string }> {
  try {
    const filePath = path.join(CONTENT_DIR, 'categories', `${id}.json`);
    const existing = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    
    const newSlug = data.name ? generateSlug(data.name) : id;
    
    const category = {
      name: data.name ?? existing.name,
      slug: newSlug,
      description: data.description ?? existing.description,
      color: data.color ?? existing.color,
    };

    if (newSlug !== id && data.name) {
      const newFilePath = path.join(CONTENT_DIR, 'categories', `${newSlug}.json`);
      await fs.writeFile(newFilePath, JSON.stringify(category, null, 2), 'utf-8');
      await fs.unlink(filePath);
      return { success: true, newId: newSlug };
    } else {
      await fs.writeFile(filePath, JSON.stringify(category, null, 2), 'utf-8');
      return { success: true };
    }
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(CONTENT_DIR, 'categories', `${id}.json`);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function uploadMedia(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    await ensureDir(UPLOADS_DIR);
    
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${safeName}`;
    const filePath = path.join(UPLOADS_DIR, fileName);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);
    
    return { success: true, url: `/uploads/${fileName}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function listMedia(): Promise<{ files: Array<{ name: string; url: string; size: number; modified: Date }> }> {
  try {
    await ensureDir(UPLOADS_DIR);
    const files = await fs.readdir(UPLOADS_DIR);
    
    const mediaFiles = await Promise.all(
      files.map(async (name) => {
        const filePath = path.join(UPLOADS_DIR, name);
        const stats = await fs.stat(filePath);
        return {
          name,
          url: `/uploads/${name}`,
          size: stats.size,
          modified: stats.mtime,
        };
      })
    );
    
    return { files: mediaFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime()) };
  } catch (error) {
    return { files: [] };
  }
}

export async function deleteMedia(fileName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = path.join(UPLOADS_DIR, fileName);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function readPostContent(id: string): Promise<{ frontmatter: Record<string, unknown>; content: string } | null> {
  try {
    const filePath = path.join(CONTENT_DIR, 'posts', `${id}.md`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return null;
    
    const frontmatterLines = match[1].split('\n');
    const frontmatter: Record<string, unknown> = {};
    
    for (const line of frontmatterLines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value: unknown = line.slice(colonIndex + 1).trim();
        
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value.replace(/"/g, '"'));
          } catch {
            value = [];
          }
        }
        
        frontmatter[key] = value;
      }
    }
    
    return { frontmatter, content: match[2].trim() };
  } catch {
    return null;
  }
}

export async function readPageContent(id: string): Promise<{ frontmatter: Record<string, unknown>; content: string } | null> {
  try {
    const filePath = path.join(CONTENT_DIR, 'pages', `${id}.md`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return null;
    
    const frontmatterLines = match[1].split('\n');
    const frontmatter: Record<string, unknown> = {};
    
    for (const line of frontmatterLines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value: unknown = line.slice(colonIndex + 1).trim();
        
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        frontmatter[key] = value;
      }
    }
    
    return { frontmatter, content: match[2].trim() };
  } catch {
    return null;
  }
}