'use client';

import type { RowElement, PageElement, ElementType } from '../../../lib/page-builder/types';
import { ColumnRenderer } from './ColumnRenderer';
import { ElementWrapper } from './ElementWrapper';

interface RowRendererProps {
  element: RowElement;
  elements: Record<string, PageElement>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddElement: (type: ElementType, parentId?: string, index?: number) => void;
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void;
  onDeleteElement: (id: string) => void;
  isPreview: boolean;
}

export function RowRenderer({
  element,
  elements,
  selectedId,
  onSelect,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  isPreview,
}: RowRendererProps) {
  const ratios = element.settings.columnRatio.split(':').map(Number);
  const totalRatio = ratios.reduce((a, b) => a + b, 0);

  const style: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: element.settings.gap,
    alignItems: {
      top: 'flex-start',
      middle: 'center',
      bottom: 'flex-end',
      stretch: 'stretch',
    }[element.settings.verticalAlign],
    backgroundColor: element.style?.backgroundColor,
    padding: element.style?.padding,
    margin: element.style?.margin,
    borderRadius: element.style?.borderRadius,
  };

  const getColumnWidth = (index: number) => {
    const ratio = ratios[index] || 1;
    return `calc(${(ratio / totalRatio) * 100}% - ${element.settings.gap})`;
  };

  if (isPreview) {
    return (
      <div style={style}>
        {element.children.map((childId, index) => {
          const child = elements[childId];
          if (!child || child.type !== 'column') return null;
          return (
            <div key={childId} style={{ flex: `0 0 ${getColumnWidth(index)}`, minWidth: 0 }}>
              <ColumnRenderer
                element={child}
                elements={elements}
                selectedId={null}
                onSelect={() => {}}
                onAddElement={() => {}}
                onUpdateElement={() => {}}
                onDeleteElement={() => {}}
                isPreview={true}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ElementWrapper
      element={element}
      isSelected={selectedId === element.id}
      onSelect={() => onSelect(element.id)}
      onDelete={() => onDeleteElement(element.id)}
      label="Row"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect(element.id);
        }}
        style={style}
      >
        {element.children.map((childId, index) => {
          const child = elements[childId];
          if (!child || child.type !== 'column') return null;
          return (
            <div key={childId} style={{ flex: `0 0 ${getColumnWidth(index)}`, minWidth: 0 }}>
              <ColumnRenderer
                element={child}
                elements={elements}
                selectedId={selectedId}
                onSelect={onSelect}
                onAddElement={onAddElement}
                onUpdateElement={onUpdateElement}
                onDeleteElement={onDeleteElement}
                isPreview={isPreview}
              />
            </div>
          );
        })}
      </div>
    </ElementWrapper>
  );
}
