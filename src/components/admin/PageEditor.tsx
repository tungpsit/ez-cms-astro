'use client';

import { useCallback, useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { WysiwygEditor } from './WysiwygEditor';

interface PageEditorProps {
  initialData?: {
    title?: string;
    description?: string;
    content?: string;
    template?: string;
    featuredImage?: string;
    draft?: boolean;
  };
  isEditing?: boolean;
  pageId?: string;
}

export function PageEditor({ initialData, isEditing = false, pageId }: PageEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [template, setTemplate] = useState(initialData?.template || 'default');
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || '');
  const [draft, setDraft] = useState(initialData?.draft || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  const showToast = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      showToast('Title is required', true);
      return;
    }

    if (!content.trim()) {
      showToast('Content is required', true);
      return;
    }

    setIsSubmitting(true);

    const data = {
      title,
      description,
      content,
      template,
      featuredImage,
      draft,
    };

    try {
      const url = isEditing ? `/api/pages/${pageId}` : '/api/pages';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        showToast(isEditing ? 'Page updated successfully!' : 'Page created successfully!');
        setTimeout(() => {
          window.location.href = '/admin/pages';
        }, 1500);
      } else {
        showToast(result.error || 'Failed to save page', true);
      }
    } catch (err) {
      showToast('An error occurred', true);
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, content, template, featuredImage, draft, isEditing, pageId, showToast]);

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input w-full"
            placeholder="Enter page title..."
            required
          />
        </div>

        <div className="card">
          <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input w-full"
            rows={2}
            placeholder="Brief description for SEO and previews..."
          />
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">Content</label>
            {isEditing && content.startsWith('{"version":') && (
              <a 
                href={`/admin/pages/builder/${pageId}`}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit in Page Builder
              </a>
            )}
          </div>
          
          {isEditing && content.startsWith('{"version":') ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h4 className="text-slate-100 font-medium mb-2">Page Builder Content Detected</h4>
              <p className="text-slate-400 text-sm mb-6">
                This page was created using the visual Page Builder. Using the rich text editor below will overwrite the Page Builder layout.
              </p>
              <a href={`/admin/pages/builder/${pageId}`} className="btn btn-primary btn-sm">
                Open Page Builder
              </a>
              
              <div className="mt-8 pt-8 border-t border-slate-700">
                <p className="text-xs text-slate-500 mb-4 uppercase tracking-wider">Or edit raw JSON (Advanced)</p>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="input w-full font-mono text-xs"
                  rows={10}
                />
              </div>
            </div>
          ) : (
            <WysiwygEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your page content..."
            />
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h3 className="font-semibold text-slate-100 mb-4">Publish</h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft}
                  onChange={(e) => setDraft(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-300">Save as draft</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEditing ? 'Update Page' : 'Publish Page'}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-100 mb-4">Template</h3>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="input w-full"
          >
            <option value="default">Default</option>
            <option value="landing">Landing Page</option>
            <option value="contact">Contact</option>
            <option value="about">About</option>
          </select>
        </div>

        <div className="card">
          <ImageUploader
            value={featuredImage}
            onChange={setFeaturedImage}
            label="Featured Image"
          />
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 ${toast.isError ? 'bg-red-500' : 'bg-emerald-500'} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>
          {toast.message}
        </div>
      )}
    </form>
  );
}

export default PageEditor;
