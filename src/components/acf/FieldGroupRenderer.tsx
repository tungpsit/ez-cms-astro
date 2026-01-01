'use client';

import { useState, useEffect } from 'react';
import type { FieldGroup, Field } from '../../lib/acf/types';
import { FieldRenderer } from './FieldRenderer';

interface FieldGroupRendererProps {
  fieldGroups: FieldGroup[];
  postId: string;
  postType: string;
  initialValues?: Record<string, unknown>;
  onChange?: (values: Record<string, unknown>) => void;
}

export function FieldGroupRenderer({
  fieldGroups,
  postId,
  postType,
  initialValues = {},
  onChange,
}: FieldGroupRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleFieldChange = (fieldName: string, value: unknown) => {
    const newValues = { ...values, [fieldName]: value };
    setValues(newValues);
    onChange?.(newValues);
  };

  const matchingGroups = fieldGroups.filter(group => {
    if (!group.active) return false;
    
    return group.location.some(loc => {
      if (loc.param === 'post_type') {
        return loc.operator === '==' ? loc.value === postType : loc.value !== postType;
      }
      return false;
    });
  });

  if (matchingGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {matchingGroups.map(group => (
        <div key={group.id} className="card">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">{group.title}</h3>
          <div className="space-y-4">
            {group.fields.map(field => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={values[field.name]}
                onChange={(v) => handleFieldChange(field.name, v)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
