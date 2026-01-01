'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SectionElement, PageElement, ElementType, RowElement } from '../../../lib/page-builder/types';
import { RowRenderer } from './RowRenderer';
import { ElementWrapper } from './ElementWrapper';
import { Plus, Columns, GripVertical } from 'lucide-react';

interface SectionRendererProps {
  element: SectionElement;
  elements: Record<string, PageElement>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddElement: (type: ElementType, parentId?: string, index?: number) => void;
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
  isPreview: boolean;
}

export function SectionRenderer({
  element,
  elements,
  selectedId,
  onSelect,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  isPreview,
}: SectionRendererProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: element.id,
    data: { accepts: ['row'] },
  });

  const containerMaxWidth = {
    full: '100%',
    boxed: '1200px',
    narrow: '800px',
  }[element.settings.containerWidth];

  const style: React.CSSProperties = {
    backgroundColor: element.style?.backgroundColor,
    backgroundImage: element.style?.backgroundImage ? `url(${element.style.backgroundImage})` : undefined,
    backgroundSize: element.style?.backgroundSize || 'cover',
    backgroundPosition: element.style?.backgroundPosition || 'center',
    padding: element.style?.padding,
    margin: element.style?.margin,
    minHeight: element.style?.minHeight,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(element.id);
  };

  if (isPreview) {
    return (
      <section style={style}>
        <div style={{ maxWidth: containerMaxWidth, margin: '0 auto', padding: element.style?.padding || '40px 20px' }}>
          {element.children.map(childId => {
            const child = elements[childId];
            if (!child || child.type !== 'row') return null;
            return (
              <RowRenderer
                key={childId}
                element={child}
                elements={elements}
                selectedId={null}
                onSelect={() => {}}
                onAddElement={() => {}}
                onUpdateElement={() => {}}
                onDeleteElement={() => {}}
                isPreview={true}
              />
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <ElementWrapper
      element={element}
      isSelected={selectedId === element.id}
      onSelect={() => onSelect(element.id)}
      onDelete={() => onDeleteElement(element.id)}
      label="Section"
    >
      <section
        ref={setNodeRef}
        onClick={handleClick}
        style={style}
        className={`transition-all duration-200 ${isOver ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/20' : ''}`}
      >
        <div style={{ maxWidth: containerMaxWidth, margin: '0 auto', padding: element.style?.padding || '40px 20px' }}>
          {element.children.length === 0 ? (
            <EmptySectionContent onAddRow={() => onAddElement('row', element.id)} isOver={isOver} />
          ) : (
            <SortableContext items={element.children} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {element.children.map((childId, index) => {
                  const child = elements[childId];
                  if (!child || child.type !== 'row') return null;
                  return (
                    <SortableRow
                      key={childId}
                      id={childId}
                      element={child as RowElement}
                      elements={elements}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      onAddElement={onAddElement}
                      onUpdateElement={onUpdateElement}
                      onDeleteElement={onDeleteElement}
                      isPreview={isPreview}
                      parentId={element.id}
                      index={index}
                    />
                  );
                })}
              </div>
            </SortableContext>
          )}
        </div>
      </section>
    </ElementWrapper>
  );
}

interface SortableRowProps {
  id: string;
  element: RowElement;
  elements: Record<string, PageElement>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddElement: (type: ElementType, parentId?: string, index?: number) => void;
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
  isPreview: boolean;
  parentId: string;
  index: number;
}

function SortableRow({
  id,
  element,
  elements,
  selectedId,
  onSelect,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  isPreview,
  parentId,
  index,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: 'row', parentId, sortable: true },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
    zIndex: isDragging ? 40 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group/row transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-[0.98]' : ''
      }`}
    >
      {!isPreview && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-1 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-20"
        >
          <div className="p-1.5 bg-blue-500 rounded shadow-lg hover:bg-blue-600 transition-colors">
            <GripVertical className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      
      <RowRenderer
        element={element}
        elements={elements}
        selectedId={selectedId}
        onSelect={onSelect}
        onAddElement={onAddElement}
        onUpdateElement={onUpdateElement}
        onDeleteElement={onDeleteElement}
        isPreview={isPreview}
      />
      
      <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 opacity-0 group-hover/row:opacity-100 transition-all duration-200 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddElement('row', parentId, index + 1);
          }}
          className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded-full shadow-lg hover:bg-blue-600 hover:scale-105 transition-all"
        >
          <Columns className="w-3 h-3" />
          Row
        </button>
      </div>
    </div>
  );
}

function EmptySectionContent({ onAddRow, isOver }: { onAddRow: () => void; isOver?: boolean }) {
  return (
    <div className={`min-h-[120px] flex items-center justify-center border-2 border-dashed rounded-lg transition-all duration-200 ${
      isOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50'
    }`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddRow();
        }}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 hover:scale-105 transition-all shadow-lg"
      >
        <Columns className="w-4 h-4" />
        Add Row
      </button>
    </div>
  );
}