import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    author: z.string().default('Admin'),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    featuredImage: z.string().optional(),
    category: z.string().default('Uncategorized'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    seo: z.object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      ogImage: z.string().optional(),
    }).optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    template: z.enum(['default', 'landing', 'contact', 'about']).default('default'),
    publishDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    featuredImage: z.string().optional(),
    draft: z.boolean().default(false),
    seo: z.object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      ogImage: z.string().optional(),
    }).optional(),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
  schema: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    social: z.object({
      twitter: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
    }).optional(),
  }),
});

const categories = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/categories' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    color: z.string().default('#0ea5e9'),
  }),
});

const menus = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/menus' }),
  schema: z.object({
    name: z.string(),
    location: z.enum(['header', 'footer', 'sidebar']),
    items: z.array(z.object({
      label: z.string(),
      url: z.string(),
      target: z.enum(['_self', '_blank']).default('_self'),
      children: z.array(z.object({
        label: z.string(),
        url: z.string(),
        target: z.enum(['_self', '_blank']).default('_self'),
      })).optional(),
    })),
  }),
});

export const collections = { posts, pages, authors, categories, menus };
