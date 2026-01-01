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
    const categories = await db.getCategories();
    
    return new Response(JSON.stringify({ success: true, data: categories }), {
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
    
    const slug = generateSlug(data.name);
    const result = await db.createCategory({
      name: data.name,
      slug,
      description: data.description || '',
      color: data.color || '#0ea5e9',
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
