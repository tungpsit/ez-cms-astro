// Contact Form Types

export type FieldType = 
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'hidden'
  | 'date'
  | 'url';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    customMessage?: string;
  };
  options?: FieldOption[]; // For select, checkbox, radio
  accept?: string; // For file input
  multiple?: boolean; // For file or select
  width?: 'full' | 'half' | 'third';
  cssClass?: string;
}

export interface MailSettings {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
  cc?: string;
  bcc?: string;
  attachFiles?: boolean;
}

export interface FormMessages {
  success: string;
  error: string;
  validationError: string;
  requiredField: string;
  invalidEmail: string;
  invalidPhone: string;
}

export interface ContactForm {
  id: string;
  title: string;
  slug: string;
  fields: FormField[];
  mailSettings: MailSettings;
  messages: FormMessages;
  submitButtonText: string;
  cssClass?: string;
  honeypot?: boolean; // Anti-spam
  created_at?: Date;
  updated_at?: Date;
}

export type SubmissionStatus = 'new' | 'read' | 'replied' | 'spam' | 'trash';

export interface FormSubmission {
  id: string;
  form_id: string;
  form_title: string;
  data: Record<string, unknown>;
  status: SubmissionStatus;
  ip_address?: string;
  user_agent?: string;
  created_at?: Date;
}

export interface ContactFormSettings {
  notificationEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
  successMessage: string;
  errorMessage: string;
  enableRecaptcha: boolean;
  recaptchaSiteKey: string;
  recaptchaSecretKey: string;
}

// Default form messages
export const DEFAULT_MESSAGES: FormMessages = {
  success: 'Thank you for your message. We will get back to you soon!',
  error: 'There was an error submitting your form. Please try again.',
  validationError: 'Please correct the errors below.',
  requiredField: 'This field is required.',
  invalidEmail: 'Please enter a valid email address.',
  invalidPhone: 'Please enter a valid phone number.',
};

// Default mail template
export const DEFAULT_MAIL_TEMPLATE = `New form submission from [your-name]

From: [your-name] <[your-email]>
Subject: [your-subject]

Message:
[your-message]

--
This email was sent from a contact form on your website.`;
