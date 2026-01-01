'use client';

import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PageBuilderData, PageElement, ElementType, SectionElement } from '../../lib/page-builder/types';
import { SectionRenderer } from './elements/SectionRenderer';
import { Plus, GripVertical } from 'lucide-react';

interface CanvasProps {
  data: PageBuilderData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddElement: (type: ElementType, parentId?: string, index?: number) => void;
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
  isPreview: boolean;
  overId?: string | null;
}

export function Canvas({
  data,
  selectedId,
  onSelect,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  isPreview,
  overId,
}: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
    data: { accepts: ['section'] },
  });

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelect(null);
    }
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleCanvasClick}
      className={`min-h-[600px] bg-white rounded-lg shadow-2xl transition-all duration-200 ${
        isOver ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''
      }`}
    >
      {data.rootElements.length === 0 ? (
        <EmptyCanvas onAddSection={() => onAddElement('section')} isOver={isOver} />
      ) : (
        <div className="relative">
          {data.rootElements.map((id, index) => {
            const element = data.elements[id];
            if (!element || element.type !== 'section') return null;

            return (
              <SortableSection
                key={id}
                id={id}
                element={element as SectionElement}
                elements={data.elements}
                selectedId={selectedId}
                onSelect={onSelect}
                onAddElement={onAddElement}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                isPreview={isPreview}
                index={index}
                isOverlay={overId === id}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface SortableSectionProps {
  id: string;
  element: SectionElement;
  elements: Record<string, PageElement>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddElement: (type: ElementType, parentId?: string, index?: number) => void;
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
  isPreview: boolean;
  index: number;
  isOverlay?: boolean;
}

function SortableSection({
  id,
  element,
  elements,
  selectedId,
  onSelect,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  isPreview,
  index,
  isOverlay,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    data: { type: 'section', sortable: true },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group/section transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-[0.98]' : ''
      } ${isOverlay ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''}`}
    >
      {!isPreview && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 opacity-0 group-hover/section:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20"
        >
          <div className="p-2 bg-slate-800 rounded-lg shadow-lg hover:bg-slate-700 transition-colors">
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      )}
      
      <SectionRenderer
        element={element}
        elements={elements}
        selectedId={selectedId}
        onSelect={onSelect}
        onAddElement={onAddElement}
        onUpdateElement={onUpdateElement}
        onDeleteElement={onDeleteElement}
        isPreview={isPreview}
      />
      
      {!isPreview && (
        <div className="absolute left-1/2 -bottom-3 -translate-x-1/2 opacity-0 group-hover/section:opacity-100 transition-all duration-200 z-10">
          <button
            onClick={() => onAddElement('section', undefined, index + 1)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-full shadow-lg hover:bg-emerald-600 hover:scale-105 transition-all"
          >
            <Plus className="w-3 h-3" />
            Section
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyCanvas({ onAddSection, isOver }: { onAddSection: () => void; isOver?: boolean }) {
  return (
    <div className={`min-h-[600px] flex items-center justify-center transition-all duration-200 ${
      isOver ? 'bg-emerald-50' : ''
    }`}>
      <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-200 ${
          isOver ? 'bg-emerald-100 scale-110' : 'bg-slate-100'
        }`}>
          <Plus className={`w-8 h-8 transition-colors ${isOver ? 'text-emerald-500' : 'text-slate-400'}`} />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          {isOver ? 'Drop here to add section' : 'Start building your page'}
        </h3>
        <p className="text-slate-500 mb-4">
          {isOver ? 'Release to create a new section' : 'Add a section to get started'}
        </p>
        {!isOver && (
          <button
            onClick={onAddSection}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 hover:scale-105 transition-all shadow-lg"
          >
            Add Section
          </button>
        )}
      </div>
    </div>
  );
}