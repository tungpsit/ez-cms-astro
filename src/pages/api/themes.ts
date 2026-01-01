import type { APIRoute } from 'astro';
import { getAllThemes, getActiveTheme, setActiveTheme } from '../../lib/cms/themes';

export const GET: APIRoute = async () => {
  try {
    const themes = getAllThemes();
    const active = getActiveTheme();
    return new Response(JSON.stringify({ themes, activeThemeId: active.id }), {
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

export const PUT: APIRoute = async ({ request }) => {
  try {
    const { themeId } = await request.json();
    
    if (!themeId) {
      return new Response(JSON.stringify({ success: false, error: 'Theme ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await setActiveTheme(themeId);
    
    if (result.success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
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
