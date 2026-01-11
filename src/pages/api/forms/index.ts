import { getDatabase } from '@lib/cms/database';
import { generateFormHtml } from '@plugins/contact-form';
import type { APIRoute } from 'astro';

// GET /api/forms - List all forms
// GET /api/forms?id=xxx - Get single form
// GET /api/forms?id=xxx&render=true - Get form HTML
export const GET: APIRoute = async ({ url }) => {
  try {
    const db = await getDatabase();
    const id = url.searchParams.get('id');
    const render = url.searchParams.get('render') === 'true';
    
    if (id) {
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
          ...form,
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
    }
    
    const forms = await db.getContactForms();
    return new Response(JSON.stringify({ forms }), {
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

// POST /api/forms - Create new form
export const POST: APIRoute = async ({ request }) => {
  try {
    const db = await getDatabase();
    const data = await request.json();
    
    if (!data.title || !data.slug) {
      return new Response(JSON.stringify({ success: false, error: 'Title and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await db.createContactForm({
      title: data.title,
      slug: data.slug,
      fields: JSON.stringify(data.fields || []),
      mail_settings: JSON.stringify(data.mailSettings || {}),
      messages: JSON.stringify(data.messages || {}),
      submit_button_text: data.submitButtonText || 'Send Message',
      css_class: data.cssClass || '',
      honeypot: data.honeypot !== false,
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

// PUT /api/forms - Update form
export const PUT: APIRoute = async ({ request }) => {
  try {
    const db = await getDatabase();
    const data = await request.json();
    
    if (!data.id) {
      return new Response(JSON.stringify({ success: false, error: 'Form ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.fields !== undefined) updateData.fields = JSON.stringify(data.fields);
    if (data.mailSettings !== undefined) updateData.mail_settings = JSON.stringify(data.mailSettings);
    if (data.messages !== undefined) updateData.messages = JSON.stringify(data.messages);
    if (data.submitButtonText !== undefined) updateData.submit_button_text = data.submitButtonText;
    if (data.cssClass !== undefined) updateData.css_class = data.cssClass;
    if (data.honeypot !== undefined) updateData.honeypot = data.honeypot;
    
    const result = await db.updateContactForm(data.id, updateData);
    
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

// DELETE /api/forms - Delete form
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const db = await getDatabase();
    const { id } = await request.json();
    
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Form ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await db.deleteContactForm(id);
    
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
