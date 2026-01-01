'use client';

import { useState } from 'react';
import type { PageElement, ElementStyle, IconListItem, StatItem } from '../../lib/page-builder/types';
import { Trash2, Copy, ChevronDown, ChevronRight, Plus, Type, Layout, Palette, Box, Layers } from 'lucide-react';
import { nanoid } from 'nanoid';

interface ElementSettingsProps {
  element: PageElement;
  onUpdate: (updates: Partial<PageElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUpdateRowColumns?: (count: number) => void;
}

export function ElementSettings({ element, onUpdate, onDelete, onDuplicate, onUpdateRowColumns }: ElementSettingsProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['content', 'typography', 'spacing', 'background', 'border', 'effects']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const updateStyle = (key: keyof ElementStyle, value: string) => {
    onUpdate({ style: { ...element.style, [key]: value } });
  };

  const updateSettings = (key: string, value: unknown) => {
    if ('settings' in element) {
      onUpdate({ settings: { ...(element as any).settings, [key]: value } } as any);
    }
  };

  const updateContent = (value: string) => {
    if ('content' in element) {
      onUpdate({ content: value } as any);
    }
  };

  return (
    <div className="divide-y divide-slate-800">
      {/* Element Type Header */}
      <div className="p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200 capitalize">{element.type}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onDuplicate}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Settings */}
      {'content' in element && (
        <SettingsSection
          title="Content"
          expanded={expandedSections.includes('content')}
          onToggle={() => toggleSection('content')}
        >
          {element.type === 'text' || element.type === 'html' ? (
            <textarea
              value={element.content}
              onChange={(e) => updateContent(e.target.value)}
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-slate-200 resize-none"
              placeholder={element.type === 'html' ? 'Enter HTML...' : 'Enter text...'}
            />
          ) : (
            <input
              type="text"
              value={element.content}
              onChange={(e) => updateContent(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              placeholder="Enter content..."
            />
          )}
        </SettingsSection>
      )}

      {/* Type-specific Settings */}
      {'settings' in element && (
        <SettingsSection
          title="Settings"
          expanded={expandedSections.includes('settings')}
          onToggle={() => toggleSection('settings')}
        >
          {element.type === 'heading' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Level</label>
                <select
                  value={element.settings.level}
                  onChange={(e) => updateSettings('level', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="h1">H1</option>
                  <option value="h2">H2</option>
                  <option value="h3">H3</option>
                  <option value="h4">H4</option>
                  <option value="h5">H5</option>
                  <option value="h6">H6</option>
                </select>
              </div>
            </div>
          )}

          {element.type === 'image' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Image URL</label>
                <input
                  type="text"
                  value={element.settings.src}
                  onChange={(e) => updateSettings('src', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Alt Text</label>
                <input
                  type="text"
                  value={element.settings.alt}
                  onChange={(e) => updateSettings('alt', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  placeholder="Image description"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Object Fit</label>
                <select
                  value={element.settings.objectFit || 'cover'}
                  onChange={(e) => updateSettings('objectFit', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                </select>
              </div>
            </div>
          )}

          {element.type === 'button' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Link URL</label>
                <input
                  type="text"
                  value={element.settings.link}
                  onChange={(e) => updateSettings('link', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Variant</label>
                <select
                  value={element.settings.variant}
                  onChange={(e) => updateSettings('variant', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="outline">Outline</option>
                  <option value="ghost">Ghost</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Size</label>
                <select
                  value={element.settings.size}
                  onChange={(e) => updateSettings('size', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="sm">Small</option>
                  <option value="md">Medium</option>
                  <option value="lg">Large</option>
                </select>
              </div>
            </div>
          )}

          {element.type === 'divider' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Style</label>
                <select
                  value={element.settings.style}
                  onChange={(e) => updateSettings('style', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Color</label>
                <input
                  type="color"
                  value={element.settings.color}
                  onChange={(e) => updateSettings('color', e.target.value)}
                  className="w-full h-8 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {element.type === 'spacer' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Height</label>
              <input
                type="text"
                value={element.settings.height}
                onChange={(e) => updateSettings('height', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                placeholder="40px"
              />
            </div>
          )}

          {element.type === 'video' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Video URL</label>
                <input
                  type="text"
                  value={element.settings.src}
                  onChange={(e) => updateSettings('src', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  placeholder="YouTube or Vimeo URL"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Type</label>
                <select
                  value={element.settings.type}
                  onChange={(e) => updateSettings('type', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="youtube">YouTube</option>
                  <option value="vimeo">Vimeo</option>
                  <option value="self-hosted">Self Hosted</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={element.settings.autoplay}
                    onChange={(e) => updateSettings('autoplay', e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700"
                  />
                  Autoplay
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={element.settings.loop}
                    onChange={(e) => updateSettings('loop', e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700"
                  />
                  Loop
                </label>
              </div>
            </div>
          )}

          {element.type === 'section' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Container Width</label>
                <select
                  value={element.settings.containerWidth}
                  onChange={(e) => updateSettings('containerWidth', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="full">Full Width</option>
                  <option value="boxed">Boxed (1200px)</option>
                  <option value="narrow">Narrow (800px)</option>
                </select>
              </div>
            </div>
          )}

          {element.type === 'row' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Columns</label>
                <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => onUpdateRowColumns?.(num)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                        'children' in element && element.children.length === num
                          ? 'bg-emerald-500 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Column Ratio</label>
                <select
                  value={element.settings.columnRatio}
                  onChange={(e) => updateSettings('columnRatio', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                >
                  <option value="1:1">1:1 (Equal)</option>
                  <option value="1:2">1:2</option>
                  <option value="2:1">2:1</option>
                  <option value="1:1:1">1:1:1 (Three equal)</option>
                  <option value="1:2:1">1:2:1</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Gap</label>
                <input
                  type="text"
                  value={element.settings.gap}
                  onChange={(e) => updateSettings('gap', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  placeholder="24px"
                />
              </div>
            </div>
          )}
        </SettingsSection>
      )}

      {/* Style Settings - Broken down into categories */}
      
      {/* Typography */}
      <SettingsSection
        title="Typography"
        icon={<Type className="w-3.5 h-3.5" />}
        expanded={expandedSections.includes('typography')}
        onToggle={() => toggleSection('typography')}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Font Family</label>
            <select
              value={element.style?.fontFamily || 'inherit'}
              onChange={(e) => updateStyle('fontFamily', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              <option value="inherit">Inherit</option>
              <option value="sans-serif">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Size</label>
              <input
                type="text"
                value={element.style?.fontSize || ''}
                onChange={(e) => updateStyle('fontSize', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                placeholder="16px"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Weight</label>
              <select
                value={element.style?.fontWeight || 'normal'}
                onChange={(e) => updateStyle('fontWeight', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="semibold">Semibold</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <div>
              <label className="block text-xs text-slate-400 mb-1">Line Height</label>
              <input
                type="text"
                value={element.style?.lineHeight || ''}
                onChange={(e) => updateStyle('lineHeight', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                placeholder="1.5"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Letter Spacing</label>
              <input
                type="text"
                value={element.style?.letterSpacing || ''}
                onChange={(e) => updateStyle('letterSpacing', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                placeholder="0px"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={element.style?.color || '#000000'}
                onChange={(e) => updateStyle('color', e.target.value)}
                className="w-10 h-8 bg-slate-800 border border-slate-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={element.style?.color || ''}
                onChange={(e) => updateStyle('color', e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm text-slate-200"
                placeholder="inherit"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Align</label>
            <div className="flex bg-slate-800 rounded-lg border border-slate-700 p-1">
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => updateStyle('textAlign', align as any)}
                  className={`flex-1 py-1 text-xs capitalize rounded ${
                    element.style?.textAlign === align ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Spacing */}
      <SettingsSection
        title="Spacing"
        icon={<Layout className="w-3.5 h-3.5" />}
        expanded={expandedSections.includes('spacing')}
        onToggle={() => toggleSection('spacing')}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Padding</label>
            <input
              type="text"
              value={element.style?.padding || ''}
              onChange={(e) => updateStyle('padding', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              placeholder="16px"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Margin</label>
            <input
              type="text"
              value={element.style?.margin || ''}
              onChange={(e) => updateStyle('margin', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              placeholder="16px"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Gap (Flex/Grid)</label>
            <input
              type="text"
              value={element.style?.gap || ''}
              onChange={(e) => updateStyle('gap', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              placeholder="16px"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Background */}
      <SettingsSection
        title="Background"
        icon={<Palette className="w-3.5 h-3.5" />}
        expanded={expandedSections.includes('background')}
        onToggle={() => toggleSection('background')}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={element.style?.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                className="w-10 h-8 bg-slate-800 border border-slate-700 rounded cursor-pointer"
              />
              <input
                type="text"
                value={element.style?.backgroundColor || ''}
                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm text-slate-200"
                placeholder="transparent"
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Border */}
      <SettingsSection
        title="Border"
        icon={<Box className="w-3.5 h-3.5" />}
        expanded={expandedSections.includes('border')}
        onToggle={() => toggleSection('border')}
      >
        <div className="space-y-3">
           <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Radius</label>
              <input
                type="text"
                value={element.style?.borderRadius || ''}
                onChange={(e) => updateStyle('borderRadius', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                placeholder="4px"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Width</label>
              <input
                type="text"
                value={element.style?.borderWidth || ''}
                onChange={(e) => updateStyle('borderWidth', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                placeholder="1px"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Style</label>
              <select
                value={element.style?.borderStyle || 'none'}
                onChange={(e) => updateStyle('borderStyle', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
            <div>
               <label className="block text-xs text-slate-400 mb-1">Color</label>
               <div className="flex gap-1">
                 <input
                  type="color"
                  value={element.style?.borderColor || '#e2e8f0'}
                  onChange={(e) => updateStyle('borderColor', e.target.value)}
                  className="w-8 h-9 bg-slate-800 border border-slate-700 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={element.style?.borderColor || ''}
                  onChange={(e) => updateStyle('borderColor', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-sm text-slate-200"
                />
               </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Effects */}
      <SettingsSection
        title="Effects"
        icon={<Layers className="w-3.5 h-3.5" />}
        expanded={expandedSections.includes('effects')}
        onToggle={() => toggleSection('effects')}
      >
        <div className="space-y-3">
           <div>
            <label className="block text-xs text-slate-400 mb-1">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={element.style?.opacity || '1'}
              onChange={(e) => updateStyle('opacity', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Box Shadow</label>
            <select
               value={element.style?.boxShadow || 'none'}
               onChange={(e) => updateStyle('boxShadow', e.target.value)}
               className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
            >
              <option value="none">None</option>
              <option value="0 1px 2px 0 rgb(0 0 0 / 0.05)">Small</option>
              <option value="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)">Medium</option>
              <option value="0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)">Large</option>
              <option value="0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)">X-Large</option>
            </select>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-200 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          {title}
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>
      {expanded && <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">{children}</div>}
    </div>
  );
}