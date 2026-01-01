---
title: "Getting Started with EZ CMS"
description: "Learn how to set up and customize your new content management system"
author: "Admin"
publishDate: 2025-12-11
updatedDate: 2025-12-11
category: "Tutorial"
tags: ["guide", "tutorial", "cms", "astro"]
draft: true
featuredImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200"
---

# Welcome to EZ CMS

EZ CMS is a powerful, flexible content management system built with Astro. It combines the performance of static site generation with the flexibility of a modern CMS.

## Key Features

### 🎨 Customizable Themes
Choose from multiple pre-built themes or create your own. Each theme comes with its own settings and customization options.

### 🔌 Plugin System
Extend functionality with plugins. Enable SEO optimization, analytics, social sharing, and more with just a click.

### 📝 Content Collections
Organize your content with built-in collections for posts, pages, authors, and categories.

### ⚡ Lightning Fast
Built on Astro, your site generates lightning-fast static pages while supporting dynamic features where needed.

## Getting Started

1. **Create Content**: Add markdown files to the `src/content/posts` directory
2. **Customize Theme**: Select a theme from the admin dashboard
3. **Configure Settings**: Update site settings in the configuration
4. **Deploy**: Build and deploy your site to any static hosting provider

## Code Example

```javascript
// Example of fetching posts
import { getCollection } from 'astro:content';

const posts = await getCollection('posts', ({ data }) => {
  return !data.draft;
});
```

Happy publishing! 🚀
