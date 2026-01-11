import type { APIRoute } from 'astro';
import { getDatabase } from '../../../lib/cms/database';

export const GET: APIRoute = async () => {
  try {
    const db = await getDatabase();
    const menus = await db.getMenus();
    return new Response(JSON.stringify({ menus }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    if (!data.name) {
      return new Response(JSON.stringify({ success: false, error: 'Menu name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const db = await getDatabase();
    const result = await db.createMenu({
      name: data.name,
      items: JSON.stringify(data.items || [])
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
