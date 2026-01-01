export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'url'
  | 'password'
  | 'wysiwyg'
  | 'image'
  | 'file'
  | 'gallery'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'true_false'
  | 'date_picker'
  | 'time_picker'
  | 'datetime_picker'
  | 'color_picker'
  | 'repeater'
  | 'group'
  | 'flexible_content';

export interface FieldGroup {
  id: string;
  title: string;
  location: FieldGroupLocation[];
  position: 'normal' | 'side';
  order: number;
  active: boolean;
  fields: Field[];
  created_at?: Date;
  updated_at?: Date;
}

export interface FieldGroupLocation {
  param: 'post_type' | 'page_template' | 'post_category' | 'user_role';
  operator: '==' | '!=';
  value: string;
}

export interface BaseField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  instructions?: string;
  required?: boolean;
  default_value?: string;
  placeholder?: string;
  wrapper?: {
    width?: string;
    class?: string;
  };
}

export interface TextField extends BaseField {
  type: 'text';
  maxlength?: number;
  prepend?: string;
  append?: string;
}

export interface TextareaField extends BaseField {
  type: 'textarea';
  rows?: number;
  maxlength?: number;
}

export interface NumberField extends BaseField {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  prepend?: string;
  append?: string;
}

export interface EmailField extends BaseField {
  type: 'email';
}

export interface UrlField extends BaseField {
  type: 'url';
}

export interface PasswordField extends BaseField {
  type: 'password';
}

export interface WysiwygField extends BaseField {
  type: 'wysiwyg';
  tabs?: 'all' | 'visual' | 'text';
  toolbar?: 'full' | 'basic';
  media_upload?: boolean;
}

export interface ImageField extends BaseField {
  type: 'image';
  return_format?: 'array' | 'url' | 'id';
  preview_size?: string;
  library?: 'all' | 'uploadedTo';
}

export interface FileField extends BaseField {
  type: 'file';
  return_format?: 'array' | 'url' | 'id';
  library?: 'all' | 'uploadedTo';
  mime_types?: string;
}

export interface GalleryField extends BaseField {
  type: 'gallery';
  return_format?: 'array' | 'url' | 'id';
  preview_size?: string;
  library?: 'all' | 'uploadedTo';
  min?: number;
  max?: number;
}

export interface SelectField extends BaseField {
  type: 'select';
  choices: Record<string, string>;
  allow_null?: boolean;
  multiple?: boolean;
  ui?: boolean;
  ajax?: boolean;
}

export interface CheckboxField extends BaseField {
  type: 'checkbox';
  choices: Record<string, string>;
  layout?: 'vertical' | 'horizontal';
  toggle?: boolean;
}

export interface RadioField extends BaseField {
  type: 'radio';
  choices: Record<string, string>;
  layout?: 'vertical' | 'horizontal';
  other_choice?: boolean;
  save_other_choice?: boolean;
}

export interface TrueFalseField extends BaseField {
  type: 'true_false';
  message?: string;
  ui?: boolean;
  ui_on_text?: string;
  ui_off_text?: string;
}

export interface DatePickerField extends BaseField {
  type: 'date_picker';
  display_format?: string;
  return_format?: string;
  first_day?: number;
}

export interface TimePickerField extends BaseField {
  type: 'time_picker';
  display_format?: string;
  return_format?: string;
}

export interface DateTimePickerField extends BaseField {
  type: 'datetime_picker';
  display_format?: string;
  return_format?: string;
  first_day?: number;
}

export interface ColorPickerField extends BaseField {
  type: 'color_picker';
  enable_opacity?: boolean;
}

export interface RepeaterField extends BaseField {
  type: 'repeater';
  sub_fields: Field[];
  min?: number;
  max?: number;
  layout?: 'table' | 'block' | 'row';
  button_label?: string;
}

export interface GroupField extends BaseField {
  type: 'group';
  sub_fields: Field[];
  layout?: 'block' | 'table' | 'row';
}

export interface FlexibleContentLayout {
  name: string;
  label: string;
  display?: 'block' | 'table' | 'row';
  sub_fields: Field[];
  min?: number;
  max?: number;
}

export interface FlexibleContentField extends BaseField {
  type: 'flexible_content';
  layouts: FlexibleContentLayout[];
  min?: number;
  max?: number;
  button_label?: string;
}

export type Field =
  | TextField
  | TextareaField
  | NumberField
  | EmailField
  | UrlField
  | PasswordField
  | WysiwygField
  | ImageField
  | FileField
  | GalleryField
  | SelectField
  | CheckboxField
  | RadioField
  | TrueFalseField
  | DatePickerField
  | TimePickerField
  | DateTimePickerField
  | ColorPickerField
  | RepeaterField
  | GroupField
  | FlexibleContentField;

export interface FieldValue {
  id: string;
  post_id: string;
  post_type: string;
  field_id: string;
  field_name: string;
  value: unknown;
  order?: number;
}

export const FIELD_TYPE_OPTIONS: { value: FieldType; label: string; category: string }[] = [
  { value: 'text', label: 'Text', category: 'Basic' },
  { value: 'textarea', label: 'Text Area', category: 'Basic' },
  { value: 'number', label: 'Number', category: 'Basic' },
  { value: 'email', label: 'Email', category: 'Basic' },
  { value: 'url', label: 'URL', category: 'Basic' },
  { value: 'password', label: 'Password', category: 'Basic' },
  { value: 'wysiwyg', label: 'WYSIWYG Editor', category: 'Content' },
  { value: 'image', label: 'Image', category: 'Content' },
  { value: 'file', label: 'File', category: 'Content' },
  { value: 'gallery', label: 'Gallery', category: 'Content' },
  { value: 'select', label: 'Select', category: 'Choice' },
  { value: 'checkbox', label: 'Checkbox', category: 'Choice' },
  { value: 'radio', label: 'Radio Button', category: 'Choice' },
  { value: 'true_false', label: 'True / False', category: 'Choice' },
  { value: 'date_picker', label: 'Date Picker', category: 'Date & Time' },
  { value: 'time_picker', label: 'Time Picker', category: 'Date & Time' },
  { value: 'datetime_picker', label: 'Date Time Picker', category: 'Date & Time' },
  { value: 'color_picker', label: 'Color Picker', category: 'Other' },
  { value: 'repeater', label: 'Repeater', category: 'Layout' },
  { value: 'group', label: 'Group', category: 'Layout' },
  { value: 'flexible_content', label: 'Flexible Content', category: 'Layout' },
];

export function createDefaultField(type: FieldType, id: string, name: string): Field {
  const base = {
    id,
    name,
    label: name,
    type,
    required: false,
  };

  switch (type) {
    case 'text':
      return { ...base, type: 'text' };
    case 'textarea':
      return { ...base, type: 'textarea', rows: 4 };
    case 'number':
      return { ...base, type: 'number' };
    case 'email':
      return { ...base, type: 'email' };
    case 'url':
      return { ...base, type: 'url' };
    case 'password':
      return { ...base, type: 'password' };
    case 'wysiwyg':
      return { ...base, type: 'wysiwyg', tabs: 'all', toolbar: 'full', media_upload: true };
    case 'image':
      return { ...base, type: 'image', return_format: 'url', preview_size: 'medium' };
    case 'file':
      return { ...base, type: 'file', return_format: 'url' };
    case 'gallery':
      return { ...base, type: 'gallery', return_format: 'url' };
    case 'select':
      return { ...base, type: 'select', choices: {}, allow_null: false, multiple: false };
    case 'checkbox':
      return { ...base, type: 'checkbox', choices: {}, layout: 'vertical' };
    case 'radio':
      return { ...base, type: 'radio', choices: {}, layout: 'vertical' };
    case 'true_false':
      return { ...base, type: 'true_false', ui: true };
    case 'date_picker':
      return { ...base, type: 'date_picker', display_format: 'Y-m-d', return_format: 'Y-m-d' };
    case 'time_picker':
      return { ...base, type: 'time_picker', display_format: 'H:i', return_format: 'H:i' };
    case 'datetime_picker':
      return { ...base, type: 'datetime_picker', display_format: 'Y-m-d H:i', return_format: 'Y-m-d H:i' };
    case 'color_picker':
      return { ...base, type: 'color_picker', enable_opacity: false };
    case 'repeater':
      return { ...base, type: 'repeater', sub_fields: [], layout: 'table', button_label: 'Add Row' };
    case 'group':
      return { ...base, type: 'group', sub_fields: [], layout: 'block' };
    case 'flexible_content':
      return { ...base, type: 'flexible_content', layouts: [], button_label: 'Add Layout' };
    default:
      return { ...base, type: 'text' } as TextField;
  }
}

export function createEmptyFieldGroup(): FieldGroup {
  return {
    id: '',
    title: '',
    location: [{ param: 'post_type', operator: '==', value: 'page' }],
    position: 'normal',
    order: 0,
    active: true,
    fields: [],
  };
}
