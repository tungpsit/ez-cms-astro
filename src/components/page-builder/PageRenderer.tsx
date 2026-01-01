'use client';

import type { PageBuilderData } from '../../lib/page-builder/types';
import { SectionRenderer } from './elements/SectionRenderer';

interface PageRendererProps {
  data: PageBuilderData;
}

export function PageRenderer({ data }: PageRendererProps) {
  if (!data || !data.rootElements) return null;

  return (
    <div className="page-builder-content">
      {data.rootElements.map(id => {
        const element = data.elements[id];
        if (!element || element.type !== 'section') return null;

        return (
          <SectionRenderer
            key={id}
            element={element as any}
            elements={data.elements}
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
  );
}
