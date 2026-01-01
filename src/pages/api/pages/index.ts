import type { APIRoute } from 'astro';
import { getDatabase } from '../../../lib/cms/database';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const GET: APIRoute = async () => {
  try {
    const db = await getDatabase();
    const pages = await db.getPages();
    
    return new Response(JSON.stringify({ success: true, data: pages }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const db = await getDatabase();
    
    const slug = generateSlug(data.title);
    const result = await db.createPage({
      title: data.title,
      slug,
      description: data.description || '',
      content: data.content || '',
      template: data.template || 'default',
      draft: data.draft ?? false,
      featured_image: data.featuredImage || '',
      publish_date: new Date(),
    });
    
    if (result.success) {
      return new Response(JSON.stringify({ success: true, id: result.id }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
