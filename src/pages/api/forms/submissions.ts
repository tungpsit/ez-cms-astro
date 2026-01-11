import { getDatabase } from '@lib/cms/database';
import type { APIRoute } from 'astro';

// GET /api/forms/submissions - List all submissions
// GET /api/forms/submissions?formId=xxx - List submissions for a form
export const GET: APIRoute = async ({ url }) => {
  try {
    const db = await getDatabase();
    const formId = url.searchParams.get('formId');
    
    const submissions = await db.getFormSubmissions(formId || undefined);
    
    // Parse data JSON for each submission
    const formattedSubmissions = submissions.map(sub => ({
      ...sub,
      data: typeof sub.data === 'string' ? JSON.parse(sub.data) : sub.data,
    }));
    
    return new Response(JSON.stringify({ submissions: formattedSubmissions }), {
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

// PUT /api/forms/submissions - Update submission status
export const PUT: APIRoute = async ({ request }) => {
  try {
    const db = await getDatabase();
    const { id, status } = await request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Submission ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await db.updateFormSubmission(id, { status });
    
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

// DELETE /api/forms/submissions - Delete submission
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const db = await getDatabase();
    const { id } = await request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Submission ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await db.deleteFormSubmission(id);
    
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
