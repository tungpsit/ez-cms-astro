import type { ContactForm, ContactFormSettings, FormField } from './types';

// Parse shortcodes in content and replace with form HTML
function parseShortcode(content: string, settings: ContactFormSettings): string {
  const shortcodeRegex = /\[contact-form\s+id=["']([^"']+)["']\s*\/?]/g;
  
  return content.replace(shortcodeRegex, (match, formId) => {
    return `<div class="ez-contact-form-container" data-form-id="${formId}">
      <div class="ez-contact-form-loading">
        <div class="ez-spinner"></div>
        <p>Loading form...</p>
      </div>
    </div>`;
  });
}

// Generate form HTML from form configuration
export function generateFormHtml(form: ContactForm): string {
  const fieldsHtml = form.fields.map(field => generateFieldHtml(field)).join('\n');
  
  return `
    <form class="ez-contact-form ${form.cssClass || ''}" id="ez-form-${form.slug}" data-form-id="${form.id}" novalidate>
      ${form.honeypot ? `<div class="ez-hp-field" aria-hidden="true"><input type="text" name="_hp_${form.id}" tabindex="-1" autocomplete="off" /></div>` : ''}
      <div class="ez-form-fields">
        ${fieldsHtml}
      </div>
      <div class="ez-form-messages" aria-live="polite"></div>
      <div class="ez-form-actions">
        <button type="submit" class="ez-submit-btn">
          <span class="ez-btn-text">${form.submitButtonText || 'Send Message'}</span>
          <span class="ez-btn-spinner" aria-hidden="true"></span>
        </button>
      </div>
    </form>
  `;
}

// Generate HTML for individual form field
function generateFieldHtml(field: FormField): string {
  const widthClass = field.width === 'half' ? 'ez-field-half' : field.width === 'third' ? 'ez-field-third' : 'ez-field-full';
  const requiredAttr = field.required ? 'required' : '';
  const requiredMark = field.required ? '<span class="ez-required" aria-hidden="true">*</span>' : '';
  
  let inputHtml = '';
  
  switch (field.type) {
    case 'textarea':
      inputHtml = `<textarea 
        id="field-${field.id}" 
        name="${field.name}" 
        placeholder="${field.placeholder || ''}"
        class="ez-input ez-textarea ${field.cssClass || ''}"
        ${requiredAttr}
        ${field.validation?.minLength ? `minlength="${field.validation.minLength}"` : ''}
        ${field.validation?.maxLength ? `maxlength="${field.validation.maxLength}"` : ''}
      >${field.defaultValue || ''}</textarea>`;
      break;
      
    case 'select':
      const selectOptions = (field.options || []).map(opt => 
        `<option value="${opt.value}"${opt.value === field.defaultValue ? ' selected' : ''}>${opt.label}</option>`
      ).join('');
      inputHtml = `<select 
        id="field-${field.id}" 
        name="${field.name}" 
        class="ez-input ez-select ${field.cssClass || ''}"
        ${requiredAttr}
        ${field.multiple ? 'multiple' : ''}
      >
        <option value="">${field.placeholder || 'Select an option...'}</option>
        ${selectOptions}
      </select>`;
      break;
      
    case 'checkbox':
      if (field.options && field.options.length > 0) {
        // Multiple checkboxes
        inputHtml = `<div class="ez-checkbox-group">
          ${field.options.map((opt, i) => `
            <label class="ez-checkbox-label">
              <input type="checkbox" name="${field.name}[]" value="${opt.value}" class="ez-checkbox">
              <span class="ez-checkbox-text">${opt.label}</span>
            </label>
          `).join('')}
        </div>`;
      } else {
        // Single checkbox
        inputHtml = `<label class="ez-checkbox-label">
          <input type="checkbox" id="field-${field.id}" name="${field.name}" value="1" class="ez-checkbox" ${requiredAttr}>
          <span class="ez-checkbox-text">${field.placeholder || field.label}</span>
        </label>`;
      }
      break;
      
    case 'radio':
      inputHtml = `<div class="ez-radio-group" role="radiogroup" aria-labelledby="label-${field.id}">
        ${(field.options || []).map((opt, i) => `
          <label class="ez-radio-label">
            <input type="radio" name="${field.name}" value="${opt.value}" class="ez-radio" ${i === 0 ? requiredAttr : ''}>
            <span class="ez-radio-text">${opt.label}</span>
          </label>
        `).join('')}
      </div>`;
      break;
      
    case 'file':
      inputHtml = `<input 
        type="file" 
        id="field-${field.id}" 
        name="${field.name}" 
        class="ez-input ez-file ${field.cssClass || ''}"
        ${field.accept ? `accept="${field.accept}"` : ''}
        ${field.multiple ? 'multiple' : ''}
        ${requiredAttr}
      >`;
      break;
      
    case 'hidden':
      return `<input type="hidden" name="${field.name}" value="${field.defaultValue || ''}">`;
      
    default:
      // text, email, tel, number, date, url
      inputHtml = `<input 
        type="${field.type}" 
        id="field-${field.id}" 
        name="${field.name}" 
        placeholder="${field.placeholder || ''}"
        value="${field.defaultValue || ''}"
        class="ez-input ${field.cssClass || ''}"
        ${requiredAttr}
        ${field.validation?.pattern ? `pattern="${field.validation.pattern}"` : ''}
        ${field.validation?.minLength ? `minlength="${field.validation.minLength}"` : ''}
        ${field.validation?.maxLength ? `maxlength="${field.validation.maxLength}"` : ''}
        ${field.validation?.min !== undefined ? `min="${field.validation.min}"` : ''}
        ${field.validation?.max !== undefined ? `max="${field.validation.max}"` : ''}
      >`;
  }
  
  // For checkbox without label above, we handle it differently
  if (field.type === 'checkbox' && (!field.options || field.options.length === 0)) {
    return `<div class="ez-form-field ${widthClass}" data-field-id="${field.id}">
      ${inputHtml}
      <span class="ez-field-error" role="alert"></span>
    </div>`;
  }
  
  return `<div class="ez-form-field ${widthClass}" data-field-id="${field.id}">
    <label for="field-${field.id}" id="label-${field.id}" class="ez-label">
      ${field.label}${requiredMark}
    </label>
    ${inputHtml}
    <span class="ez-field-error" role="alert"></span>
  </div>`;
}

export default {
  // Transform content to replace shortcodes with form placeholders
  transformContent(content: string, settings: ContactFormSettings) {
    return parseShortcode(content, settings);
  },
  
  // Inject CSS for form styling
  injectHead(settings: ContactFormSettings) {
    return `
    <!-- Contact Form Plugin Styles -->
    <style>
      .ez-contact-form-container {
        margin: 2rem 0;
      }
      
      .ez-contact-form-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        color: #64748b;
      }
      
      .ez-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e2e8f0;
        border-top-color: #0ea5e9;
        border-radius: 50%;
        animation: ez-spin 0.8s linear infinite;
      }
      
      @keyframes ez-spin {
        to { transform: rotate(360deg); }
      }
      
      .ez-contact-form {
        display: block;
      }
      
      .ez-form-fields {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }
      
      .ez-form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .ez-field-full { grid-column: 1 / -1; }
      .ez-field-half { grid-column: span 1; }
      .ez-field-third { grid-column: span 1; }
      
      @media (max-width: 640px) {
        .ez-form-fields { grid-template-columns: 1fr; }
        .ez-field-half, .ez-field-third { grid-column: 1 / -1; }
      }
      
      .ez-label {
        font-weight: 500;
        color: #1e293b;
        font-size: 0.875rem;
      }
      
      .dark .ez-label { color: #e2e8f0; }
      
      .ez-required { color: #ef4444; margin-left: 0.25rem; }
      
      .ez-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
        background: #fff;
        color: #1e293b;
      }
      
      .dark .ez-input {
        background: #1e293b;
        border-color: #475569;
        color: #e2e8f0;
      }
      
      .ez-input:focus {
        outline: none;
        border-color: #0ea5e9;
        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
      }
      
      .ez-input.ez-error {
        border-color: #ef4444;
      }
      
      .ez-input.ez-error:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
      
      .ez-textarea {
        min-height: 120px;
        resize: vertical;
      }
      
      .ez-checkbox-group,
      .ez-radio-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .ez-checkbox-label,
      .ez-radio-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        color: #475569;
      }
      
      .dark .ez-checkbox-label,
      .dark .ez-radio-label { color: #94a3b8; }
      
      .ez-checkbox,
      .ez-radio {
        width: 1rem;
        height: 1rem;
        cursor: pointer;
      }
      
      .ez-field-error {
        font-size: 0.75rem;
        color: #ef4444;
        min-height: 1rem;
      }
      
      .ez-form-messages {
        margin: 1rem 0;
      }
      
      .ez-message {
        padding: 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
      }
      
      .ez-message-success {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #86efac;
      }
      
      .ez-message-error {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }
      
      .dark .ez-message-success {
        background: rgba(34, 197, 94, 0.1);
        color: #86efac;
        border-color: rgba(34, 197, 94, 0.3);
      }
      
      .dark .ez-message-error {
        background: rgba(239, 68, 68, 0.1);
        color: #fca5a5;
        border-color: rgba(239, 68, 68, 0.3);
      }
      
      .ez-form-actions {
        margin-top: 1.5rem;
      }
      
      .ez-submit-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem 2rem;
        background: linear-gradient(135deg, #0ea5e9, #06b6d4);
        color: #fff;
        font-weight: 600;
        border: none;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        font-size: 1rem;
      }
      
      .ez-submit-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
      }
      
      .ez-submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }
      
      .ez-btn-spinner {
        display: none;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: ez-spin 0.8s linear infinite;
      }
      
      .ez-submit-btn.ez-loading .ez-btn-text { display: none; }
      .ez-submit-btn.ez-loading .ez-btn-spinner { display: block; }
      
      .ez-hp-field {
        position: absolute;
        left: -9999px;
        opacity: 0;
        height: 0;
        overflow: hidden;
      }
    </style>`;
  },
  
  // Inject JavaScript for form handling
  injectBodyEnd(settings: ContactFormSettings) {
    return `
    <!-- Contact Form Plugin Scripts -->
    <script>
      (function() {
        // Initialize all contact forms on the page
        document.querySelectorAll('.ez-contact-form-container').forEach(async container => {
          const formId = container.dataset.formId;
          if (!formId) return;
          
          try {
            // Fetch form configuration
            const response = await fetch('/api/forms/' + formId);
            if (!response.ok) throw new Error('Form not found');
            
            const { form } = await response.json();
            if (!form) throw new Error('Form not found');
            
            // Render form HTML (simplified version - actual rendering done server-side)
            const formHtml = await fetchFormHtml(formId);
            container.innerHTML = formHtml;
            
            // Initialize form handlers
            const formEl = container.querySelector('form');
            if (formEl) initForm(formEl);
          } catch (error) {
            container.innerHTML = '<p class="ez-message ez-message-error">Failed to load form.</p>';
          }
        });
        
        async function fetchFormHtml(formId) {
          const response = await fetch('/api/forms/' + formId + '?render=true');
          const data = await response.json();
          return data.html || '<p>Form not available.</p>';
        }
        
        function initForm(form) {
          const messagesEl = form.querySelector('.ez-form-messages');
          const submitBtn = form.querySelector('.ez-submit-btn');
          
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear previous messages
            messagesEl.innerHTML = '';
            form.querySelectorAll('.ez-field-error').forEach(el => el.textContent = '');
            form.querySelectorAll('.ez-input.ez-error').forEach(el => el.classList.remove('ez-error'));
            
            // Client-side validation
            if (!validateForm(form)) {
              messagesEl.innerHTML = '<p class="ez-message ez-message-error">Please correct the errors below.</p>';
              return;
            }
            
            // Set loading state
            submitBtn.classList.add('ez-loading');
            submitBtn.disabled = true;
            
            try {
              const formData = new FormData(form);
              const formId = form.dataset.formId;
              
              const response = await fetch('/api/forms/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  formId,
                  data: Object.fromEntries(formData.entries())
                })
              });
              
              const result = await response.json();
              
              if (result.success) {
                messagesEl.innerHTML = '<p class="ez-message ez-message-success">' + 
                  (result.message || '${settings.successMessage}') + '</p>';
                form.reset();
              } else {
                messagesEl.innerHTML = '<p class="ez-message ez-message-error">' + 
                  (result.error || '${settings.errorMessage}') + '</p>';
                
                // Show field-specific errors
                if (result.errors) {
                  Object.entries(result.errors).forEach(([field, message]) => {
                    const fieldEl = form.querySelector('[name="' + field + '"]');
                    if (fieldEl) {
                      fieldEl.classList.add('ez-error');
                      const errorEl = fieldEl.closest('.ez-form-field')?.querySelector('.ez-field-error');
                      if (errorEl) errorEl.textContent = message;
                    }
                  });
                }
              }
            } catch (error) {
              messagesEl.innerHTML = '<p class="ez-message ez-message-error">${settings.errorMessage}</p>';
            } finally {
              submitBtn.classList.remove('ez-loading');
              submitBtn.disabled = false;
            }
          });
        }
        
        function validateForm(form) {
          let isValid = true;
          
          form.querySelectorAll('.ez-input[required], .ez-checkbox[required], .ez-radio[required]').forEach(input => {
            const field = input.closest('.ez-form-field');
            const errorEl = field?.querySelector('.ez-field-error');
            
            if (!input.value.trim()) {
              isValid = false;
              input.classList.add('ez-error');
              if (errorEl) errorEl.textContent = 'This field is required.';
            } else if (input.type === 'email' && !isValidEmail(input.value)) {
              isValid = false;
              input.classList.add('ez-error');
              if (errorEl) errorEl.textContent = 'Please enter a valid email address.';
            } else if (input.type === 'tel' && input.value && !isValidPhone(input.value)) {
              isValid = false;
              input.classList.add('ez-error');
              if (errorEl) errorEl.textContent = 'Please enter a valid phone number.';
            }
          });
          
          return isValid;
        }
        
        function isValidEmail(email) {
          return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
        }
        
        function isValidPhone(phone) {
          return /^[\\d\\s\\-+()]{7,}$/.test(phone);
        }
      })();
    </script>`;
  }
};
