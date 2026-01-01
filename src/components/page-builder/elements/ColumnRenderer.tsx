'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ColumnElement, PageElement, ElementType } from '../../../lib/page-builder/types';
import { BasicElementRenderer } from './BasicElementRenderer';
import { Plus, GripVertical } from 'lucide-react';

interface ColumnRendererProps {
  element: ColumnElement;
  elements: Record<string, PageElement>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddElement: (type: ElementType, parentId?: string, index?: number) => void;
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
  isPreview: boolean;
}

export function ColumnRenderer({
  element,
  elements,
  selectedId,
  onSelect,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  isPreview,
}: ColumnRendererProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: element.id,
    data: { accepts: ['text', 'heading', 'image', 'button', 'divider', 'spacer', 'html', 'video', 'icon'] },
  });

  const style: React.CSSProperties = {
    backgroundColor: element.style?.backgroundColor,
    padding: element.style?.padding || '12px',
    borderRadius: element.style?.borderRadius,
    minHeight: isPreview ? undefined : '80px',
  };

  if (isPreview) {
    return (
      <div style={style}>
        {element.children.map(childId => {
          const child = elements[childId];
          if (!child) return null;
          return (
            <BasicElementRenderer
              key={childId}
              element={child}
              isSelected={false}
              onSelect={() => {}}
              onDelete={() => {}}
              isPreview={true}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.id);
      }}
      style={style}
      className={`relative transition-all duration-200 border-2 ${
        selectedId === element.id
          ? 'border-emerald-500 bg-emerald-50/10'
          : isOver
          ? 'border-emerald-400 border-dashed bg-emerald-50/20 scale-[1.02]'
          : 'border-transparent hover:border-slate-200 border-dashed'
      }`}
    >
      {element.children.length === 0 ? (
        <EmptyColumnContent
          columnId={element.id}
          onAddElement={onAddElement}
          isOver={isOver}
        />
      ) : (
        <SortableContext items={element.children} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {element.children.map((childId, index) => {
              const child = elements[childId];
              if (!child) return null;
              return (
                <SortableElement
                  key={childId}
                  id={childId}
                  element={child}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onDeleteElement={onDeleteElement}
                  onAddElement={onAddElement}
                  columnId={element.id}
                  index={index}
                  isPreview={isPreview}
                />
              );
            })}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

interface SortableElementProps {
  id: string;
  element: PageElement;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDeleteElement: (id: string) => void;
  onAddElement: (type: ElementType, parentId?: string, index?: number) => void;
  columnId: string;
  index: number;
  isPreview: boolean;
}

function SortableElement({
  id,
  element,
  selectedId,
  onSelect,
  onDeleteElement,
  onAddElement,
  columnId,
  index,
  isPreview,
}: SortableElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: element.type, parentId: columnId, sortable: true },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 30 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group/element transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
    >
      {!isPreview && (
        <div
          {...attributes}
          {...listeners}
          className="absolute right-0 top-0 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover/element:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20"
        >
          <div className="p-1 bg-slate-600 rounded shadow-lg hover:bg-slate-500 transition-colors">
            <GripVertical className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      
      <BasicElementRenderer
        element={element}
        isSelected={selectedId === id}
        onSelect={() => onSelect(id)}
        onDelete={() => onDeleteElement(id)}
        isPreview={isPreview}
      />
      
      <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 opacity-0 group-hover/element:opacity-100 transition-all duration-200 z-10">
        <AddElementDropdown
          onAdd={(type) => onAddElement(type, columnId, index + 1)}
        />
      </div>
    </div>
  );
}

function EmptyColumnContent({
  columnId,
  onAddElement,
  isOver,
}: {
  columnId: string;
  onAddElement: (type: ElementType, parentId?: string, index?: number) => void;
  isOver?: boolean;
}) {
  return (
    <div className={`flex items-center justify-center h-full min-h-[60px] transition-all duration-200 rounded-lg ${
      isOver ? 'bg-emerald-50 ring-2 ring-emerald-400 ring-dashed' : ''
    }`}>
      {isOver ? (
        <span className="text-sm text-emerald-500 font-medium animate-pulse">Drop here</span>
      ) : (
        <AddElementDropdown onAdd={(type) => onAddElement(type, columnId)} />
      )}
    </div>
  );
}

function AddElementDropdown({ onAdd }: { onAdd: (type: ElementType) => void }) {
  const elements: { type: ElementType; label: string }[] = [
    { type: 'heading', label: 'Heading' },
    { type: 'text', label: 'Text' },
    { type: 'image', label: 'Image' },
    { type: 'button', label: 'Button' },
    { type: 'divider', label: 'Divider' },
    { type: 'spacer', label: 'Spacer' },
    { type: 'video', label: 'Video' },
    { type: 'html', label: 'HTML' },
  ];

  return (
    <div className="relative group/dropdown">
      <button
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 px-2 py-1 bg-slate-600 text-white text-xs rounded-full shadow-lg hover:bg-slate-500 hover:scale-110 transition-all"
      >
        <Plus className="w-3 h-3" />
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/dropdown:block">
        <div className="bg-slate-800 rounded-lg shadow-xl p-1 min-w-[120px] animate-in fade-in slide-in-from-bottom-2 duration-200">
          {elements.map(el => (
            <button
              key={el.type}
              onClick={(e) => {
                e.stopPropagation();
                onAdd(el.type);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 hover:text-emerald-400 rounded transition-colors"
            >
              {el.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}