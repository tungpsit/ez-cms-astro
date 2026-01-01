'use client';

import { useState, useCallback } from 'react';
import { WysiwygEditor } from './WysiwygEditor';
import { ImageUploader } from './ImageUploader';

interface Category {
  name: string;
  slug: string;
}

interface PostEditorProps {
  initialData?: {
    title?: string;
    description?: string;
    content?: string;
    category?: string;
    tags?: string[];
    featuredImage?: string;
    author?: string;
    draft?: boolean;
  };
  categories: Category[];
  isEditing?: boolean;
  postId?: string;
}

export function PostEditor({ initialData, categories, isEditing = false, postId }: PostEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || 'Uncategorized');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || '');
  const [author, setAuthor] = useState(initialData?.author || 'Admin');
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

    const tagsList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    const data = {
      title,
      description,
      content,
      category,
      tags: tagsList,
      featuredImage,
      author,
      draft,
    };

    try {
      const url = isEditing ? `/api/posts/${postId}` : '/api/posts';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        showToast(isEditing ? 'Post updated successfully!' : 'Post created successfully!');
        setTimeout(() => {
          window.location.href = '/admin/posts';
        }, 1500);
      } else {
        showToast(result.error || 'Failed to save post', true);
      }
    } catch (err) {
      showToast('An error occurred', true);
    } finally {
      setIsSubmitting(false);
    }
  }, [title, description, content, category, tags, featuredImage, author, draft, isEditing, postId, showToast]);

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
            placeholder="Enter post title..."
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
          <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
          <WysiwygEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your post..."
          />
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
                  {isEditing ? 'Update Post' : 'Publish Post'}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card">
          <ImageUploader
            value={featuredImage}
            onChange={setFeaturedImage}
            label="Featured Image"
          />
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-100 mb-4">Category</h3>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input w-full"
          >
            <option value="Uncategorized">Uncategorized</option>
            {categories.map(cat => (
              <option key={cat.slug} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-100 mb-4">Tags</h3>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input w-full"
            placeholder="tag1, tag2, tag3"
          />
          <p className="text-xs text-slate-500 mt-2">Separate tags with commas</p>
        </div>

        <div className="card">
          <h3 className="font-semibold text-slate-100 mb-4">Author</h3>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="input w-full"
          />
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 ${toast.isError ? 'bg-red-500' : 'bg-emerald-500'} text-white px-6 py-3 rounded-lg shadow-lg`}>
          {toast.message}
        </div>
      )}
    </form>
  );
}

export default PostEditor;
