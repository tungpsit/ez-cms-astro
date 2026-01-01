'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import type { FieldGroup, Field, FieldType, FieldGroupLocation } from '../../lib/acf/types';
import { FIELD_TYPE_OPTIONS, createDefaultField, createEmptyFieldGroup } from '../../lib/acf/types';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Save, Settings, AlertCircle, Check } from 'lucide-react';

interface FieldGroupEditorProps {
  initialData?: FieldGroup | null;
  isNew?: boolean;
}

export function FieldGroupEditor({ initialData, isNew = false }: FieldGroupEditorProps) {
  const [fieldGroup, setFieldGroup] = useState<FieldGroup>(initialData || createEmptyFieldGroup());
  const [expandedFields, setExpandedFields] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'fields' | 'location' | 'settings'>('fields');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const url = isNew ? '/api/acf/field-groups' : `/api/acf/field-groups/${fieldGroup.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldGroup),
      });

      const result = await response.json();

      if (result.success || result.id) {
        setSaveStatus('success');
        if (isNew && result.id) {
          window.location.href = `/admin/field-groups/${result.id}`;
        }
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const addField = (type: FieldType) => {
    const id = `field_${nanoid(8)}`;
    const name = `field_${fieldGroup.fields.length + 1}`;
    const newField = createDefaultField(type, id, name);
    setFieldGroup(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
    setExpandedFields(prev => [...prev, id]);
  };

  const updateField = (fieldId: string, updates: Partial<Field>) => {
    setFieldGroup(prev => ({
      ...prev,
      fields: prev.fields.map(f => (f.id === fieldId ? { ...f, ...updates } as Field : f)),
    }));
  };

  const removeField = (fieldId: string) => {
    setFieldGroup(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId),
    }));
  };

  const toggleField = (fieldId: string) => {
    setExpandedFields(prev =>
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    );
  };

  const addLocation = () => {
    setFieldGroup(prev => ({
      ...prev,
      location: [...prev.location, { param: 'post_type', operator: '==', value: 'page' }],
    }));
  };

  const updateLocation = (index: number, updates: Partial<FieldGroupLocation>) => {
    setFieldGroup(prev => ({
      ...prev,
      location: prev.location.map((loc, i) => (i === index ? { ...loc, ...updates } : loc)),
    }));
  };

  const removeLocation = (index: number) => {
    setFieldGroup(prev => ({
      ...prev,
      location: prev.location.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={fieldGroup.title}
            onChange={(e) => setFieldGroup(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Field Group Title"
            className="text-2xl font-bold bg-transparent border-none text-slate-100 w-full focus:outline-none focus:ring-0 placeholder-slate-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving || !fieldGroup.title}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 ${
            saveStatus === 'success'
              ? 'bg-emerald-600 text-white'
              : saveStatus === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          {saveStatus === 'success' ? <Check className="w-4 h-4" /> : saveStatus === 'error' ? <AlertCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : isNew ? 'Create' : 'Save'}
        </button>
      </div>

      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('fields')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'fields' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Fields
        </button>
        <button
          onClick={() => setActiveTab('location')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'location' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Location Rules
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'settings' ? 'text-emerald-400 border-emerald-400' : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Settings
        </button>
      </div>

      {activeTab === 'fields' && (
        <div className="space-y-4">
          {fieldGroup.fields.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-slate-400 mb-4">No fields yet. Add your first field:</p>
              <FieldTypeSelector onSelect={addField} />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {fieldGroup.fields.map((field, index) => (
                  <FieldEditor
                    key={field.id}
                    field={field}
                    isExpanded={expandedFields.includes(field.id)}
                    onToggle={() => toggleField(field.id)}
                    onUpdate={(updates) => updateField(field.id, updates)}
                    onRemove={() => removeField(field.id)}
                  />
                ))}
              </div>
              <FieldTypeSelector onSelect={addField} />
            </>
          )}
        </div>
      )}

      {activeTab === 'location' && (
        <div className="card space-y-4">
          <p className="text-sm text-slate-400">Show this field group when:</p>
          
          {fieldGroup.location.map((loc, index) => (
            <div key={index} className="flex items-center gap-3">
              {index > 0 && <span className="text-slate-500 text-sm">or</span>}
              <select
                value={loc.param}
                onChange={(e) => updateLocation(index, { param: e.target.value as any })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="post_type">Post Type</option>
                <option value="page_template">Page Template</option>
              </select>
              <select
                value={loc.operator}
                onChange={(e) => updateLocation(index, { operator: e.target.value as any })}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="==">is equal to</option>
                <option value="!=">is not equal to</option>
              </select>
              <select
                value={loc.value}
                onChange={(e) => updateLocation(index, { value: e.target.value })}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="page">Page</option>
                <option value="post">Post</option>
              </select>
              <button
                onClick={() => removeLocation(index)}
                className="p-2 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={addLocation}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Location Rule
          </button>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Position</label>
            <select
              value={fieldGroup.position}
              onChange={(e) => setFieldGroup(prev => ({ ...prev, position: e.target.value as any }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              <option value="normal">Normal (after content)</option>
              <option value="side">Side (in sidebar)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Order</label>
            <input
              type="number"
              value={fieldGroup.order}
              onChange={(e) => setFieldGroup(prev => ({ ...prev, order: Number(e.target.value) }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldGroup.active}
                onChange={(e) => setFieldGroup(prev => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-emerald-500"
              />
              <span className="text-sm text-slate-300">Active</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldTypeSelector({ onSelect }: { onSelect: (type: FieldType) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [...new Set(FIELD_TYPE_OPTIONS.map(o => o.category))];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-sm"
      >
        <Plus className="w-4 h-4" />
        Add Field
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 w-64 max-h-80 overflow-y-auto">
          {categories.map(category => (
            <div key={category}>
              <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase bg-slate-900/50">
                {category}
              </div>
              {FIELD_TYPE_OPTIONS.filter(o => o.category === category).map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                >
                  {option.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldEditor({
  field,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
}: {
  field: Field;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Field>) => void;
  onRemove: () => void;
}) {
  const fieldTypeLabel = FIELD_TYPE_OPTIONS.find(o => o.value === field.type)?.label || field.type;

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 bg-slate-800 px-4 py-3">
        <GripVertical className="w-4 h-4 text-slate-500 cursor-grab" />
        <button onClick={onToggle} className="flex-1 flex items-center gap-2 text-left">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="text-slate-100 font-medium">{field.label || field.name}</span>
          <span className="text-xs text-slate-500">({fieldTypeLabel})</span>
        </button>
        <button onClick={onRemove} className="p-1 text-red-400 hover:text-red-300">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-slate-900/30">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Field Label</label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Field Name</label>
              <input
                type="text"
                value={field.name}
                onChange={(e) => onUpdate({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Instructions</label>
            <textarea
              value={field.instructions || ''}
              onChange={(e) => onUpdate({ instructions: e.target.value })}
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) => onUpdate({ required: e.target.checked })}
                className="w-4 h-4 rounded bg-slate-800 border-slate-600 text-emerald-500"
              />
              <span className="text-sm text-slate-300">Required</span>
            </label>
          </div>

          {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Choices (one per line: value : label)</label>
              <textarea
                value={Object.entries((field as any).choices || {}).map(([k, v]) => `${k} : ${v}`).join('\n')}
                onChange={(e) => {
                  const choices: Record<string, string> = {};
                  e.target.value.split('\n').forEach(line => {
                    const [key, ...rest] = line.split(':');
                    if (key?.trim()) {
                      choices[key.trim()] = rest.join(':').trim() || key.trim();
                    }
                  });
                  onUpdate({ choices } as any);
                }}
                rows={4}
                placeholder="option1 : Option 1&#10;option2 : Option 2"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono resize-none"
              />
            </div>
          )}

          {field.type === 'repeater' && (
            <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/50">
              <p className="text-sm text-slate-400 mb-2">Sub Fields (edit in code for now)</p>
              <p className="text-xs text-slate-500">Repeater sub-fields can be managed via API</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
