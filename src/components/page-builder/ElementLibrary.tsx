'use client';

import { useDraggable } from '@dnd-kit/core';
import {
    Activity,
    AlignLeft,
    Code,
    Columns,
    Heading,
    Image,
    Layout,
    ListChecks,
    Map,
    Maximize2,
    Megaphone,
    Minus,
    MousePointer,
    PlayCircle,
    Quote,
    Sparkles,
    Square,
    Star,
    Type,
    Video,
} from 'lucide-react';
import { ELEMENT_CATEGORIES, type ElementType } from '../../lib/page-builder/types';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  square: Square,
  columns: Columns,
  heading: Heading,
  'align-left': AlignLeft,
  image: Image,
  'mouse-pointer': MousePointer,
  minus: Minus,
  'maximize-2': Maximize2,
  video: Video,
  star: Star,
  code: Code,
  layout: Layout,
  type: Type,
  'play-circle': PlayCircle,
  sparkles: Sparkles,
  megaphone: Megaphone,
  'list-checks': ListChecks,
  activity: Activity,
  quote: Quote,
  map: Map,
};

interface ElementLibraryProps {
  onAddElement: (type: ElementType, parentId?: string) => void;
}

export function ElementLibrary({ onAddElement }: ElementLibraryProps) {
  return (
    <div className="p-4 space-y-6">
      {ELEMENT_CATEGORIES.map(category => {
        const CategoryIcon = iconMap[category.icon] || Layout;
        return (
          <div key={category.id}>
            <div className="flex items-center gap-2 mb-3">
              <CategoryIcon className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {category.name}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {category.elements.map(element => (
                <DraggableElement
                  key={element.type}
                  type={element.type}
                  name={element.name}
                  icon={element.icon}
                  description={element.description}
                  onAdd={() => onAddElement(element.type)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DraggableElementProps {
  type: ElementType;
  name: string;
  icon: string;
  description: string;
  onAdd: () => void;
}

function DraggableElement({ type, name, icon, description, onAdd }: DraggableElementProps) {
  const { attributes, listeners, setNodeRef, isDragging, active } = useDraggable({
    id: `new-${type}`,
    data: { type, isNew: true },
  });

  const Icon = iconMap[icon] || Square;

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onAdd}
      className={`
        relative flex flex-col items-center gap-1.5 p-3 rounded-lg border 
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging 
          ? 'opacity-40 scale-95 border-emerald-500 bg-emerald-500/10 shadow-lg ring-2 ring-emerald-500/50' 
          : 'border-slate-700 bg-slate-800/50 hover:border-emerald-500/50 hover:bg-slate-800 hover:scale-105 hover:shadow-lg'
        }
      `}
      title={description}
    >
      <div className={`
        p-2 rounded-md transition-all duration-200
        ${isDragging ? 'bg-emerald-500/20' : 'bg-slate-700/50'}
      `}>
        <Icon className={`w-5 h-5 transition-colors ${isDragging ? 'text-emerald-400' : 'text-slate-300'}`} />
      </div>
      <span className={`text-xs font-medium transition-colors ${isDragging ? 'text-emerald-400' : 'text-slate-300'}`}>
        {name}
      </span>
      
      {isDragging && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
      )}
    </button>
  );
}