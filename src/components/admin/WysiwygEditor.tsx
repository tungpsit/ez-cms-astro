'use client';

import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useState } from 'react';

interface WysiwygEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

export function WysiwygEditor({ content = '', onChange, placeholder = 'Start writing...' }: WysiwygEditorProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [codeContent, setCodeContent] = useState(content);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-emerald-400 underline hover:text-emerald-300',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setCodeContent(html);
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-emerald max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content);
      setCodeContent(content);
    }
  }, [content, editor]);

  const handleViewModeChange = (mode: 'visual' | 'code') => {
    if (mode === 'visual' && viewMode === 'code') {
      editor?.commands.setContent(codeContent);
    }
    setViewMode(mode);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setCodeContent(newContent);
    onChange?.(newContent);
  };

  const addLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    setLinkUrl('');
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setShowImageInput(false);
  }, [editor, imageUrl]);

  if (!editor) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl min-h-[500px] flex items-center justify-center">
        <div className="text-slate-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-800">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-900/80">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => handleViewModeChange('visual')}
            className={`text-sm font-medium transition-colors ${viewMode === 'visual' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Visual
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange('code')}
            className={`text-sm font-medium transition-colors ${viewMode === 'code' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Code
          </button>
        </div>
      </div>

      {viewMode === 'visual' ? (
        <>
          <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-700 bg-slate-900/50">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('bold') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Bold"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('italic') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Italic"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('strike') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Strikethrough"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/>
              </svg>
            </button>

            <div className="w-px h-6 bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Heading 1"
            >
              <span className="font-bold text-sm">H1</span>
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Heading 2"
            >
              <span className="font-bold text-sm">H2</span>
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Heading 3"
            >
              <span className="font-bold text-sm">H3</span>
            </button>

            <div className="w-px h-6 bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Bullet List"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Numbered List"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('blockquote') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Quote"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('codeBlock') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
              title="Code Block"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
              </svg>
            </button>

            <div className="w-px h-6 bg-slate-700 mx-1" />

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLinkInput(!showLinkInput)}
                className={`p-2 rounded hover:bg-slate-700 transition-colors ${editor.isActive('link') ? 'bg-slate-700 text-emerald-400' : 'text-slate-400'}`}
                title="Add Link"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                </svg>
              </button>
              {showLinkInput && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 flex gap-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-100 w-48"
                  />
                  <button
                    type="button"
                    onClick={addLink}
                    className="px-2 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-500"
                  >
                    Add
                  </button>
                  {editor.isActive('link') && (
                    <button
                      type="button"
                      onClick={removeLink}
                      className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="p-2 rounded hover:bg-slate-700 transition-colors text-slate-400"
                title="Add Image"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </button>
              {showImageInput && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Image URL..."
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-slate-100 w-48"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-2 py-1 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-500"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 rounded hover:bg-slate-700 transition-colors text-slate-400 disabled:opacity-30"
              title="Undo"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded hover:bg-slate-700 transition-colors text-slate-400 disabled:opacity-30"
              title="Redo"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/>
              </svg>
            </button>
          </div>
          <EditorContent editor={editor} />
        </>
      ) : (
        <textarea
          value={codeContent}
          onChange={handleCodeChange}
          className="w-full min-h-[448px] p-4 bg-slate-900 text-slate-300 font-mono text-sm focus:outline-none resize-none"
          placeholder="Enter HTML/Markdown code..."
        />
      )}
    </div>
  );
}

export default WysiwygEditor;