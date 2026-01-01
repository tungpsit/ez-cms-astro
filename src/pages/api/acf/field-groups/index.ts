import type { APIRoute } from 'astro';
import { getFieldGroups, createFieldGroup } from '../../../../lib/acf/store';

export const GET: APIRoute = async () => {
  try {
    const fieldGroups = await getFieldGroups();
    return new Response(JSON.stringify({ success: true, data: fieldGroups }), {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const result = await createFieldGroup(body);

    if (result.success) {
      return new Response(JSON.stringify({ success: true, id: result.id }), {
        status: 201,
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
