import type { APIRoute } from 'astro';
import { getDatabase } from '../../../lib/cms/database';
import type { PageBuilderData } from '../../../lib/page-builder/types';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { pageId } = params;
    if (!pageId) {
      return new Response(JSON.stringify({ error: 'Page ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = await getDatabase();
    const page = await db.getPage(pageId);

    if (!page) {
      return new Response(JSON.stringify({ error: 'Page not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let builderData: PageBuilderData = {
      version: 1,
      rootElements: [],
      elements: {},
    };

    try {
      if (page.content && page.content.startsWith('{')) {
        const parsed = JSON.parse(page.content);
        if (parsed.version && parsed.rootElements && parsed.elements) {
          builderData = parsed;
        }
      }
    } catch {
    }

    return new Response(JSON.stringify({ success: true, data: builderData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { pageId } = params;
    if (!pageId) {
      return new Response(JSON.stringify({ error: 'Page ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const builderData: PageBuilderData = body.data;

    if (!builderData || !builderData.version || !builderData.elements) {
      return new Response(JSON.stringify({ error: 'Invalid page builder data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = await getDatabase();
    const result = await db.updatePage(pageId, {
      content: JSON.stringify(builderData),
    });

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
