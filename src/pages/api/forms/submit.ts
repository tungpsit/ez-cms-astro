import { getDatabase } from '@lib/cms/database';
import type { APIRoute } from 'astro';

// POST /api/forms/submit - Handle form submission
export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const db = await getDatabase();
    const { formId, data } = await request.json();
    
    if (!formId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Form ID is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get form configuration
    const form = await db.getContactForm(formId) || await db.getContactFormBySlug(formId);
    if (!form) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Form not found' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse form fields for validation
    const fields = JSON.parse(form.fields || '[]');
    const messages = JSON.parse(form.messages || '{}');
    const errors: Record<string, string> = {};
    
    // Check honeypot field (anti-spam)
    if (form.honeypot && data[`_hp_${form.id}`]) {
      // Bot detected - silently accept but don't store
      return new Response(JSON.stringify({ 
        success: true, 
        message: messages.success || 'Thank you for your message!' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Remove honeypot field from data
    const cleanData = { ...data };
    delete cleanData[`_hp_${form.id}`];
    
    // Validate required fields
    for (const field of fields) {
      if (field.required && !cleanData[field.name]?.toString().trim()) {
        errors[field.name] = field.validation?.customMessage || messages.requiredField || 'This field is required.';
      }
      
      // Email validation
      if (field.type === 'email' && cleanData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanData[field.name])) {
          errors[field.name] = messages.invalidEmail || 'Please enter a valid email address.';
        }
      }
      
      // Phone validation
      if (field.type === 'tel' && cleanData[field.name]) {
        const phoneRegex = /^[\d\s\-+()]{7,}$/;
        if (!phoneRegex.test(cleanData[field.name])) {
          errors[field.name] = messages.invalidPhone || 'Please enter a valid phone number.';
        }
      }
      
      // Pattern validation
      if (field.validation?.pattern && cleanData[field.name]) {
        const pattern = new RegExp(field.validation.pattern);
        if (!pattern.test(cleanData[field.name])) {
          errors[field.name] = field.validation.customMessage || 'Invalid format.';
        }
      }
    }
    
    if (Object.keys(errors).length > 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: messages.validationError || 'Please correct the errors below.',
        errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Store submission
    const userAgent = request.headers.get('user-agent') || '';
    const result = await db.createFormSubmission({
      form_id: form.id,
      form_title: form.title,
      data: JSON.stringify(cleanData),
      status: 'new',
      ip_address: clientAddress || '',
      user_agent: userAgent,
    });
    
    if (!result.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: messages.error || 'There was an error submitting your form.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // TODO: Send email notification if configured
    // const mailSettings = JSON.parse(form.mail_settings || '{}');
    // if (mailSettings.to) {
    //   await sendEmail(mailSettings, cleanData);
    // }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: messages.success || 'Thank you for your message. We will get back to you soon!',
      submissionId: result.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Form submission error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'There was an error submitting your form. Please try again.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
