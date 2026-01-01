'use client';

import type { PageElement } from '../../../lib/page-builder/types';
import { Trash2, GripVertical } from 'lucide-react';

interface ElementWrapperProps {
  element: PageElement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  label: string;
  children: React.ReactNode;
}

export function ElementWrapper({
  element,
  isSelected,
  onSelect,
  onDelete,
  label,
  children,
}: ElementWrapperProps) {
  return (
    <div className={`relative group ${isSelected ? 'z-10' : ''}`}>
      {isSelected && (
        <div className="absolute -top-6 left-0 flex items-center gap-1 bg-emerald-500 text-white text-xs px-2 py-1 rounded-t">
          <GripVertical className="w-3 h-3 cursor-grab" />
          <span>{label}</span>
        </div>
      )}
      
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={`relative transition-all ${
          isSelected
            ? 'ring-2 ring-emerald-500'
            : 'hover:ring-1 hover:ring-slate-300'
        }`}
      >
        {children}
      </div>

      {isSelected && (
        <div className="absolute -top-6 right-0 flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
