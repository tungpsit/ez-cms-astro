import type { APIRoute } from 'astro';
import { getFieldValues, saveFieldValues } from '../../../../../lib/acf/store';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { postType, postId } = params;
    if (!postType || !postId) {
      return new Response(JSON.stringify({ error: 'Post type and ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const values = await getFieldValues(postId, postType);
    return new Response(JSON.stringify({ success: true, data: values }), {
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
    const { postType, postId } = params;
    if (!postType || !postId) {
      return new Response(JSON.stringify({ error: 'Post type and ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const result = await saveFieldValues(postId, postType, body.values || body);

    if (result.success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: result.error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
