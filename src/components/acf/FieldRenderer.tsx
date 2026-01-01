'use client';

import { useState } from 'react';
import type { Field, FieldValue, RepeaterField, GroupField, FlexibleContentField } from '../../lib/acf/types';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { nanoid } from 'nanoid';

interface FieldRendererProps {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  depth?: number;
}

export function FieldRenderer({ field, value, onChange, depth = 0 }: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return <TextField field={field} value={value as string} onChange={onChange} />;
    case 'textarea':
      return <TextareaField field={field} value={value as string} onChange={onChange} />;
    case 'number':
      return <NumberFieldComponent field={field} value={value as number} onChange={onChange} />;
    case 'email':
      return <EmailFieldComponent field={field} value={value as string} onChange={onChange} />;
    case 'url':
      return <UrlFieldComponent field={field} value={value as string} onChange={onChange} />;
    case 'password':
      return <PasswordFieldComponent field={field} value={value as string} onChange={onChange} />;
    case 'wysiwyg':
      return <WysiwygFieldComponent field={field} value={value as string} onChange={onChange} />;
    case 'image':
      return <ImageFieldComponent field={field} value={value as string} onChange={onChange} />;
    case 'select':
      return <SelectFieldComponent field={field} value={value as string} onChange={onChange} />;
    case 'checkbox':
      return <CheckboxFieldComponent field={field} value={value as string[]} onChange={onChange} />;
    case 'radio':
      return <RadioFieldComponent field={field} value={value as string} onChange={onChange} />;
    case 'true_false':
      return <TrueFalseFieldComponent field={field} value={value as boolean} onChange={onChange} />;
    case 'date_picker':
      return <DatePickerFieldComponent field={field} value={value as string} onChange={onChange} />;
    case 'color_picker':
      return <ColorPickerFieldComponent field={field} value={value as string} onChange={onChange} />;
    case 'repeater':
      return <RepeaterFieldComponent field={field} value={value as Record<string, unknown>[]} onChange={onChange} depth={depth} />;
    case 'group':
      return <GroupFieldComponent field={field} value={value as Record<string, unknown>} onChange={onChange} depth={depth} />;
    default:
      return <TextField field={field as any} value={value as string} onChange={onChange} />;
  }
}

function FieldWrapper({ field, children }: { field: Field; children: React.ReactNode }) {
  return (
    <div className="space-y-1" style={{ width: field.wrapper?.width }}>
      <label className="block text-sm font-medium text-slate-200">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {field.instructions && (
        <p className="text-xs text-slate-400">{field.instructions}</p>
      )}
      {children}
    </div>
  );
}

function TextField({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  return (
    <FieldWrapper field={field}>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        required={field.required}
      />
    </FieldWrapper>
  );
}

function TextareaField({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const textareaField = field as any;
  return (
    <FieldWrapper field={field}>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={textareaField.rows || 4}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 resize-y"
        required={field.required}
      />
    </FieldWrapper>
  );
}

function NumberFieldComponent({ field, value, onChange }: { field: Field; value: number; onChange: (v: number) => void }) {
  const numField = field as any;
  return (
    <FieldWrapper field={field}>
      <div className="flex items-center">
        {numField.prepend && <span className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-l-lg text-sm text-slate-300">{numField.prepend}</span>}
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(Number(e.target.value))}
          min={numField.min}
          max={numField.max}
          step={numField.step}
          className={`flex-1 bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 ${
            numField.prepend ? 'rounded-r-lg' : numField.append ? 'rounded-l-lg' : 'rounded-lg'
          }`}
          required={field.required}
        />
        {numField.append && <span className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-r-lg text-sm text-slate-300">{numField.append}</span>}
      </div>
    </FieldWrapper>
  );
}

function EmailFieldComponent({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  return (
    <FieldWrapper field={field}>
      <input
        type="email"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        required={field.required}
      />
    </FieldWrapper>
  );
}

function UrlFieldComponent({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  return (
    <FieldWrapper field={field}>
      <input
        type="url"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || 'https://'}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        required={field.required}
      />
    </FieldWrapper>
  );
}

function PasswordFieldComponent({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  return (
    <FieldWrapper field={field}>
      <input
        type="password"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        required={field.required}
      />
    </FieldWrapper>
  );
}

function WysiwygFieldComponent({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  return (
    <FieldWrapper field={field}>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={8}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 resize-y font-mono"
        required={field.required}
      />
    </FieldWrapper>
  );
}

function ImageFieldComponent({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  return (
    <FieldWrapper field={field}>
      <div className="space-y-2">
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter image URL..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        />
        {value && (
          <div className="relative">
            <img src={value} alt="" className="max-w-full h-auto max-h-48 rounded-lg border border-slate-700" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </FieldWrapper>
  );
}

function SelectFieldComponent({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const selectField = field as any;
  return (
    <FieldWrapper field={field}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        required={field.required}
      >
        {selectField.allow_null && <option value="">— Select —</option>}
        {Object.entries(selectField.choices || {}).map(([key, label]) => (
          <option key={key} value={key}>{label as string}</option>
        ))}
      </select>
    </FieldWrapper>
  );
}

function CheckboxFieldComponent({ field, value, onChange }: { field: Field; value: string[]; onChange: (v: string[]) => void }) {
  const checkboxField = field as any;
  const currentValue = Array.isArray(value) ? value : [];

  const handleChange = (key: string, checked: boolean) => {
    if (checked) {
      onChange([...currentValue, key]);
    } else {
      onChange(currentValue.filter(v => v !== key));
    }
  };

  return (
    <FieldWrapper field={field}>
      <div className={`space-y-2 ${checkboxField.layout === 'horizontal' ? 'flex flex-wrap gap-4' : ''}`}>
        {Object.entries(checkboxField.choices || {}).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentValue.includes(key)}
              onChange={(e) => handleChange(key, e.target.checked)}
              className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-emerald-500"
            />
            <span className="text-sm text-slate-200">{label as string}</span>
          </label>
        ))}
      </div>
    </FieldWrapper>
  );
}

function RadioFieldComponent({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  const radioField = field as any;

  return (
    <FieldWrapper field={field}>
      <div className={`space-y-2 ${radioField.layout === 'horizontal' ? 'flex flex-wrap gap-4' : ''}`}>
        {Object.entries(radioField.choices || {}).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={field.name}
              value={key}
              checked={value === key}
              onChange={() => onChange(key)}
              className="w-4 h-4 bg-slate-800 border-slate-600 text-emerald-500"
            />
            <span className="text-sm text-slate-200">{label as string}</span>
          </label>
        ))}
      </div>
    </FieldWrapper>
  );
}

function TrueFalseFieldComponent({ field, value, onChange }: { field: Field; value: boolean; onChange: (v: boolean) => void }) {
  const tfField = field as any;

  if (tfField.ui) {
    return (
      <FieldWrapper field={field}>
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? 'bg-emerald-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        {tfField.message && <p className="text-xs text-slate-400 mt-1">{tfField.message}</p>}
      </FieldWrapper>
    );
  }

  return (
    <FieldWrapper field={field}>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-emerald-500"
        />
        {tfField.message && <span className="text-sm text-slate-200">{tfField.message}</span>}
      </label>
    </FieldWrapper>
  );
}

function DatePickerFieldComponent({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  return (
    <FieldWrapper field={field}>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        required={field.required}
      />
    </FieldWrapper>
  );
}

function ColorPickerFieldComponent({ field, value, onChange }: { field: Field; value: string; onChange: (v: string) => void }) {
  return (
    <FieldWrapper field={field}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 bg-slate-800 border border-slate-700 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
        />
      </div>
    </FieldWrapper>
  );
}

function RepeaterFieldComponent({
  field,
  value,
  onChange,
  depth,
}: {
  field: RepeaterField;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
  depth: number;
}) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const rows = Array.isArray(value) ? value : [];

  const addRow = () => {
    const newRow: Record<string, unknown> = { _id: nanoid(8) };
    field.sub_fields.forEach(sf => {
      newRow[sf.name] = sf.default_value ?? '';
    });
    onChange([...rows, newRow]);
    setExpandedRows([...expandedRows, rows.length]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
    setExpandedRows(expandedRows.filter(i => i !== index).map(i => (i > index ? i - 1 : i)));
  };

  const updateRow = (index: number, fieldName: string, fieldValue: unknown) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [fieldName]: fieldValue };
    onChange(newRows);
  };

  const toggleRow = (index: number) => {
    setExpandedRows(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <FieldWrapper field={field}>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={row._id as string || index} className="border border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-2">
              <GripVertical className="w-4 h-4 text-slate-500 cursor-grab" />
              <button
                type="button"
                onClick={() => toggleRow(index)}
                className="flex-1 flex items-center gap-2 text-left text-sm text-slate-200"
              >
                {expandedRows.includes(index) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                Row {index + 1}
              </button>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {expandedRows.includes(index) && (
              <div className="p-4 space-y-4 bg-slate-900/50">
                {field.sub_fields.map(subField => (
                  <FieldRenderer
                    key={subField.id}
                    field={subField}
                    value={row[subField.name]}
                    onChange={(v) => updateRow(index, subField.name, v)}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        
        {(!field.max || rows.length < field.max) && (
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            {field.button_label || 'Add Row'}
          </button>
        )}
      </div>
    </FieldWrapper>
  );
}

function GroupFieldComponent({
  field,
  value,
  onChange,
  depth,
}: {
  field: GroupField;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  depth: number;
}) {
  const groupValue = value || {};

  const updateField = (fieldName: string, fieldValue: unknown) => {
    onChange({ ...groupValue, [fieldName]: fieldValue });
  };

  return (
    <FieldWrapper field={field}>
      <div className="border border-slate-700 rounded-lg p-4 space-y-4 bg-slate-900/30">
        {field.sub_fields.map(subField => (
          <FieldRenderer
            key={subField.id}
            field={subField}
            value={groupValue[subField.name]}
            onChange={(v) => updateField(subField.name, v)}
            depth={depth + 1}
          />
        ))}
      </div>
    </FieldWrapper>
  );
}
