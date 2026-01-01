'use client';

import type { PageElement } from '../../../lib/page-builder/types';
import { Square, Columns, Heading, AlignLeft, Image, MousePointer, Minus, Maximize2, Video, Star, Code, Megaphone, ListChecks, Activity, Quote } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  section: Square,
  row: Columns,
  column: Square,
  heading: Heading,
  text: AlignLeft,
  image: Image,
  button: MousePointer,
  divider: Minus,
  spacer: Maximize2,
  video: Video,
  icon: Star,
  html: Code,
  cta: Megaphone,
  'icon-list': ListChecks,
  stats: Activity,
  testimonial: Quote,
};

interface ElementPreviewProps {
  element: PageElement;
}

export function ElementPreview({ element }: ElementPreviewProps) {
  const Icon = iconMap[element.type] || Square;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg shadow-lg border border-slate-700">
      <Icon className="w-4 h-4" />
      <span className="text-sm capitalize">{element.type}</span>
    </div>
  );
}