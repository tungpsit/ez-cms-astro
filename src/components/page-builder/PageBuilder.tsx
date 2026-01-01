'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { nanoid } from 'nanoid';
import type { PageBuilderData, PageElement, ElementType } from '../../lib/page-builder/types';
import { createDefaultElement, createEmptyPageBuilderData, ELEMENT_CATEGORIES } from '../../lib/page-builder/types';
import { ElementLibrary } from './ElementLibrary';
import { Canvas } from './Canvas';
import { ElementSettings } from './ElementSettings';
import { ElementPreview } from './elements/ElementPreview';
import { 
  Layers, 
  Settings, 
  Eye, 
  Save, 
  Undo, 
  Redo, 
  Monitor, 
  Tablet, 
  Smartphone,
  PanelLeft,
  Plus,
  Check,
  AlertCircle,
} from 'lucide-react';

interface PageBuilderProps {
  pageId: string;
  initialData?: PageBuilderData | null;
  onSave?: (data: PageBuilderData) => Promise<void>;
}

type SidebarTab = 'elements' | 'settings' | 'layers';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export function PageBuilder({ pageId, initialData, onSave }: PageBuilderProps) {
  const [data, setData] = useState<PageBuilderData>(initialData || createEmptyPageBuilderData());
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('elements');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<ElementType | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [history, setHistory] = useState<PageBuilderData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const selectedElement = selectedElementId ? data.elements[selectedElementId] : null;
  const activeElement = activeId ? data.elements[activeId] : null;

  const pushHistory = useCallback((newData: PageBuilderData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newData)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setData(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setData(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [history, historyIndex]);

  const addElement = useCallback((type: ElementType, parentId?: string, index?: number) => {
    const id = nanoid(10);
    const element = createDefaultElement(type, id);

    setData(prev => {
      const newData = { ...prev, elements: { ...prev.elements, [id]: element } };

      if (type === 'section') {
        if (index !== undefined) {
          newData.rootElements = [...prev.rootElements.slice(0, index), id, ...prev.rootElements.slice(index)];
        } else {
          newData.rootElements = [...prev.rootElements, id];
        }
      } else if (type === 'row' && parentId) {
        const parent = prev.elements[parentId];
        if (parent && 'children' in parent) {
          const newChildren = index !== undefined
            ? [...parent.children.slice(0, index), id, ...parent.children.slice(index)]
            : [...parent.children, id];
          newData.elements[parentId] = { ...parent, children: newChildren };
        }
        
        const col1Id = nanoid(10);
        const col2Id = nanoid(10);
        const col1 = createDefaultElement('column', col1Id);
        const col2 = createDefaultElement('column', col2Id);
        newData.elements[col1Id] = col1;
        newData.elements[col2Id] = col2;
        (newData.elements[id] as any).children = [col1Id, col2Id];
      } else if (parentId) {
        const parent = prev.elements[parentId];
        if (parent && 'children' in parent) {
          const newChildren = index !== undefined
            ? [...parent.children.slice(0, index), id, ...parent.children.slice(index)]
            : [...parent.children, id];
          newData.elements[parentId] = { ...parent, children: newChildren };
        }
      }

      pushHistory(newData);
      return newData;
    });

    setSelectedElementId(id);
    if (type !== 'section' && type !== 'row') {
      setSidebarTab('settings');
    }
  }, [pushHistory]);

  const updateElement = useCallback((id: string, updates: Partial<PageElement>) => {
    setData(prev => {
      const element = prev.elements[id];
      if (!element) return prev;

      const newData = {
        ...prev,
        elements: {
          ...prev.elements,
          [id]: { ...element, ...updates } as PageElement,
        },
      };
      return newData;
    });
  }, []);

  const updateRowColumns = useCallback((rowId: string, count: number) => {
    setData(prev => {
      const row = prev.elements[rowId];
      if (!row || row.type !== 'row' || !('children' in row)) return prev;

      const currentCount = row.children.length;
      if (currentCount === count) return prev;

      let newElements = { ...prev.elements };
      let newChildren = [...row.children];

      if (count > currentCount) {
        // Add columns
        for (let i = 0; i < count - currentCount; i++) {
          const colId = nanoid(10);
          const col = createDefaultElement('column', colId);
          // Set width based on new count? For now let's rely on ratio setting or auto layout
          newElements[colId] = col;
          newChildren.push(colId);
        }
      } else if (count < currentCount) {
        // Remove columns from the end
        const toRemove = newChildren.slice(count);
        newChildren = newChildren.slice(0, count);

        // Helper to recursively delete
        const deleteRecursively = (id: string) => {
          const el = newElements[id];
          if (el && 'children' in el) {
            el.children.forEach(childId => deleteRecursively(childId));
          }
          delete newElements[id];
        };

        toRemove.forEach(id => deleteRecursively(id));
      }

      // Update row
      newElements[rowId] = {
        ...row,
        children: newChildren,
        settings: {
          ...row.settings,
          columns: count,
          // Reset ratio to equal distribution
          columnRatio: Array(count).fill('1').join(':'),
        },
      } as PageElement;

      const newData = { ...prev, elements: newElements };
      pushHistory(newData);
      return newData;
    });
  }, [pushHistory]);

  const deleteElement = useCallback((id: string) => {
    setData(prev => {
      const element = prev.elements[id];
      if (!element) return prev;

      const newElements = { ...prev.elements };
      const collectChildren = (elId: string) => {
        const el = newElements[elId];
        if (el && 'children' in el) {
          el.children.forEach(childId => {
            collectChildren(childId);
            delete newElements[childId];
          });
        }
        delete newElements[elId];
      };

      collectChildren(id);

      let newRootElements = prev.rootElements.filter(rid => rid !== id);
      
      Object.keys(newElements).forEach(key => {
        const el = newElements[key];
        if (el && 'children' in el) {
          (newElements[key] as any).children = el.children.filter(cid => cid !== id);
        }
      });

      const newData = { ...prev, elements: newElements, rootElements: newRootElements };
      pushHistory(newData);
      return newData;
    });

    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }, [selectedElementId, pushHistory]);

  const duplicateElement = useCallback((id: string) => {
    const element = data.elements[id];
    if (!element) return;

    const newId = nanoid(10);
    const newElement = JSON.parse(JSON.stringify(element));
    newElement.id = newId;

    const duplicateChildren = (el: PageElement, parentNewId: string): Record<string, PageElement> => {
      let newElements: Record<string, PageElement> = {};
      if ('children' in el && el.children.length > 0) {
        const newChildren: string[] = [];
        el.children.forEach(childId => {
          const child = data.elements[childId];
          if (child) {
            const childNewId = nanoid(10);
            const childCopy = JSON.parse(JSON.stringify(child));
            childCopy.id = childNewId;
            newChildren.push(childNewId);
            newElements[childNewId] = childCopy;
            newElements = { ...newElements, ...duplicateChildren(child, childNewId) };
          }
        });
        (newElements[parentNewId] as any).children = newChildren;
      }
      return newElements;
    };

    setData(prev => {
      let newElements = { ...prev.elements, [newId]: newElement };

      if ('children' in element) {
        newElement.children = [];
        const childElements = duplicateChildren(element, newId);
        newElements = { ...newElements, ...childElements, [newId]: { ...newElement, children: Object.keys(childElements).filter(k => {
          const original = data.elements[element.children.find(c => true) || ''];
          return original && childElements[k]?.type === original.type;
        }).slice(0, element.children.length) } };
      }

      let newRootElements = prev.rootElements;
      if (element.type === 'section') {
        const idx = prev.rootElements.indexOf(id);
        newRootElements = [...prev.rootElements.slice(0, idx + 1), newId, ...prev.rootElements.slice(idx + 1)];
      } else {
        Object.keys(prev.elements).forEach(key => {
          const el = prev.elements[key];
          if (el && 'children' in el && el.children.includes(id)) {
            const idx = el.children.indexOf(id);
            (newElements[key] as any).children = [...el.children.slice(0, idx + 1), newId, ...el.children.slice(idx + 1)];
          }
        });
      }

      const newData = { ...prev, elements: newElements, rootElements: newRootElements };
      pushHistory(newData);
      return newData;
    });
  }, [data, pushHistory]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const activeData = active.data.current;
    if (activeData?.isNew) {
      setActiveType(activeData.type as ElementType);
    } else {
      const element = data.elements[active.id as string];
      setActiveType(element?.type || null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);
    setOverId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    if (activeData?.isNew && activeData?.type) {
      const type = activeData.type as ElementType;
      if (type === 'section') {
        if (overIdStr === 'canvas') {
          addElement(type);
        } else if (data.elements[overIdStr]?.type === 'section') {
          const overIndex = data.rootElements.indexOf(overIdStr);
          addElement(type, undefined, overIndex + 1);
        }
      } else if (overData?.accepts?.includes(type)) {
        addElement(type, overIdStr);
      }
      return;
    }

    const activeElement = data.elements[activeIdStr];
    if (!activeElement) return;

    if (activeElement.type === 'section' && overIdStr !== activeIdStr) {
      const oldIndex = data.rootElements.indexOf(activeIdStr);
      let newIndex = data.rootElements.indexOf(overIdStr);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setData(prev => {
          const newRootElements = arrayMove(prev.rootElements, oldIndex, newIndex);
          const newData = { ...prev, rootElements: newRootElements };
          pushHistory(newData);
          return newData;
        });
      }
    }

    const findParent = (elementId: string): string | null => {
      for (const [key, el] of Object.entries(data.elements)) {
        if ('children' in el && el.children.includes(elementId)) {
          return key;
        }
      }
      return null;
    };

    // Generic reordering for any non-section element
    if (activeElement.type !== 'section') {
      const parentId = findParent(activeIdStr);
      const overParentId = findParent(overIdStr);
      
      // If items share the same parent, reorder them
      if (parentId && parentId === overParentId) {
        const parent = data.elements[parentId];
        if (parent && 'children' in parent) {
          const oldIndex = parent.children.indexOf(activeIdStr);
          const newIndex = parent.children.indexOf(overIdStr);
          
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            setData(prev => {
              const parentEl = prev.elements[parentId];
              if (!parentEl || !('children' in parentEl)) return prev;
              
              const newChildren = arrayMove(parentEl.children, oldIndex, newIndex);
              const newData = {
                ...prev,
                elements: {
                  ...prev.elements,
                  [parentId]: { ...parentEl, children: newChildren },
                },
              };
              pushHistory(newData);
              return newData;
            });
          }
        }
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      if (onSave) {
        await onSave(data);
      } else {
        const response = await fetch(`/api/page-builder/${pageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }),
        });
        
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to save');
        }
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const getDeviceWidth = () => {
    switch (deviceMode) {
      case 'tablet': return '768px';
      case 'mobile': return '375px';
      default: return '100%';
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: { strategy: MeasuringStrategy.Always },
      }}
    >
      <div className="h-screen flex flex-col bg-slate-950">
        {/* Toolbar */}
        <div className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <a href="/admin/pages" className="text-slate-400 hover:text-slate-200 p-2 transition-colors">
              <PanelLeft className="w-5 h-5" />
            </a>
            <div className="h-6 w-px bg-slate-700" />
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-colors"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-2 rounded transition-all ${deviceMode === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-2 rounded transition-all ${deviceMode === 'tablet' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-2 rounded transition-all ${deviceMode === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                isPreview ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                saveStatus === 'success' 
                  ? 'bg-emerald-600 text-white' 
                  : saveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {saveStatus === 'success' ? (
                <Check className="w-4 h-4" />
              ) : saveStatus === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          {!isPreview && (
            <div className="w-72 border-r border-slate-800 bg-slate-900 flex flex-col">
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setSidebarTab('elements')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                    sidebarTab === 'elements' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Elements
                </button>
                <button
                  onClick={() => setSidebarTab('settings')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                    sidebarTab === 'settings' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  onClick={() => setSidebarTab('layers')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${
                    sidebarTab === 'layers' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Layers
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {sidebarTab === 'elements' && (
                  <ElementLibrary onAddElement={addElement} />
                )}
                {sidebarTab === 'settings' && selectedElement && (
                  <ElementSettings
                    element={selectedElement}
                    onUpdate={(updates) => updateElement(selectedElementId!, updates)}
                    onDelete={() => deleteElement(selectedElementId!)}
                    onDuplicate={() => duplicateElement(selectedElementId!)}
                    onUpdateRowColumns={(count) => updateRowColumns(selectedElementId!, count)}
                  />
                )}
                {sidebarTab === 'settings' && !selectedElement && (
                  <div className="p-4 text-center text-slate-400">
                    <p className="text-sm">Select an element to edit its settings</p>
                  </div>
                )}
                {sidebarTab === 'layers' && (
                  <LayersPanel
                    data={data}
                    selectedId={selectedElementId}
                    onSelect={setSelectedElementId}
                  />
                )}
              </div>
            </div>
          )}

          {/* Canvas */}
          <div className="flex-1 overflow-auto bg-slate-950 p-8">
            <div
              className="mx-auto transition-all duration-300"
              style={{ width: getDeviceWidth(), maxWidth: '100%' }}
            >
              <SortableContext items={data.rootElements} strategy={verticalListSortingStrategy}>
                <Canvas
                  data={data}
                  selectedId={selectedElementId}
                  onSelect={setSelectedElementId}
                  onAddElement={addElement}
                  onUpdateElement={updateElement}
                  onDeleteElement={deleteElement}
                  isPreview={isPreview}
                  overId={overId}
                />
              </SortableContext>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeId && (
          <div className="transform scale-105 shadow-2xl rounded-lg ring-2 ring-emerald-500 ring-opacity-50">
            {activeElement ? (
              <div className="opacity-90 bg-white rounded-lg overflow-hidden">
                <ElementPreview element={activeElement} />
              </div>
            ) : activeType && (
              <div className="px-4 py-3 bg-slate-800 rounded-lg border border-emerald-500 text-emerald-400 text-sm font-medium capitalize shadow-lg">
                {activeType}
              </div>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function LayersPanel({ 
  data, 
  selectedId, 
  onSelect 
}: { 
  data: PageBuilderData; 
  selectedId: string | null; 
  onSelect: (id: string) => void;
}) {
  const renderElement = (id: string, depth: number = 0) => {
    const element = data.elements[id];
    if (!element) return null;

    const isSelected = selectedId === id;
    const hasChildren = 'children' in element && element.children.length > 0;

    return (
      <div key={id}>
        <button
          onClick={() => onSelect(id)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-all ${
            isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-300 hover:bg-slate-800'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          <span className="capitalize">{element.type}</span>
        </button>
        {hasChildren && (element as any).children.map((childId: string) => renderElement(childId, depth + 1))}
      </div>
    );
  };

  return (
    <div className="py-2">
      {data.rootElements.length === 0 ? (
        <p className="p-4 text-sm text-slate-400 text-center">No elements yet</p>
      ) : (
        data.rootElements.map(id => renderElement(id))
      )}
    </div>
  );
}