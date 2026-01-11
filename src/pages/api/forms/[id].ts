import { getDatabase } from '@lib/cms/database';
import { generateFormHtml } from '@plugins/contact-form';
import type { APIRoute } from 'astro';

// GET /api/forms/[id] - Get single form by ID
// GET /api/forms/[id]?render=true - Get form HTML
export const GET: APIRoute = async ({ params, url }) => {
  try {
    const db = await getDatabase();
    const { id } = params;
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Form ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const render = url.searchParams.get('render') === 'true';
    const form = await db.getContactForm(id) || await db.getContactFormBySlug(id);
    
    if (!form) {
      return new Response(JSON.stringify({ error: 'Form not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (render) {
      // Parse JSON fields and generate HTML
      const formData = {
        id: form.id,
        title: form.title,
        slug: form.slug,
        fields: JSON.parse(form.fields || '[]'),
        mailSettings: JSON.parse(form.mail_settings || '{}'),
        messages: JSON.parse(form.messages || '{}'),
        submitButtonText: form.submit_button_text,
        cssClass: form.css_class,
        honeypot: form.honeypot,
      };
      const html = generateFormHtml(formData);
      return new Response(JSON.stringify({ form: formData, html }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ form }), {
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
