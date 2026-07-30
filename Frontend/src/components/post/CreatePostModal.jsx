import { useState, useEffect, useRef } from "react";
import { X, Send, ImageIcon, Video, Code, Bold, Italic, Link } from "lucide-react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CreatePostModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const insertMarkdown = (prefix, suffix = "") => {
    const editor = editorRef.current;
    if (editor) {
      const selection = editor.getSelection();
      const model = editor.getModel();
      const text = model.getValueInRange(selection);
      const insertText = prefix + text + suffix;
      
      editor.executeEdits("toolbar", [{
        range: selection,
        text: insertText,
        forceMoveMarkers: true
      }]);
      editor.focus();
    }
  };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (!tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const success = await onSubmit({ title, content, tags, mediaUrls: [] });
      if (success === false) return;

      setTitle("");
      setContent("");
      setTags([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-5xl bg-[#1C1C1E] border border-white/[0.08] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >


        {/* Form Content */}
        <div className="flex flex-col flex-1 p-5 gap-4 overflow-y-auto h-[75vh] custom-scrollbar">
          
          {/* Title Input */}
          <input 
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title of your post"
            className="w-full bg-transparent border-none outline-none font-mono text-xl text-white/90 placeholder:text-white/30 font-bold"
          />

          {/* Toolbar */}
          <div className="flex items-center gap-1 bg-[#1A1A1A] border border-white/[0.04] p-1.5 rounded-lg">
            <button onClick={() => insertMarkdown("**", "**")} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded" title="Bold">
              <Bold size={14} />
            </button>
            <button onClick={() => insertMarkdown("*", "*")} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded" title="Italic">
              <Italic size={14} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onClick={() => insertMarkdown("[", "](url)")} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded" title="Link">
              <Link size={14} />
            </button>
            <button onClick={() => insertMarkdown("![Hình ảnh](", ")")} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded" title="Image">
              <ImageIcon size={14} />
            </button>
            <button onClick={() => insertMarkdown("![Video](", ")")} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded" title="Video">
              <Video size={14} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <button onClick={() => insertMarkdown("```\n", "\n```")} className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded" title="Code Block">
              <Code size={14} />
            </button>
          </div>

          {/* Editor / Preview Area */}
          <div className="flex-1 w-full min-h-[400px] mt-2 rounded-lg overflow-hidden border border-white/[0.04] focus-within:border-[#00a2ff]/50 transition-colors bg-[#1E1E1E] relative">
            <div className="absolute inset-0 flex flex-row">
              
              {/* Left: Monaco Editor */}
              <div className="w-1/2 h-full border-r border-white/[0.04] pt-3 relative">
                <Editor
                  height="100%"
                  language="markdown"
                  theme="vs-dark"
                  value={content}
                  onChange={(value) => setContent(value || "")}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    wordWrap: 'on',
                    padding: { top: 8 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: "smooth"
                  }}
                />
              </div>
              
              {/* Right: Preview */}
              <div className="w-1/2 h-full p-5 overflow-y-auto custom-scrollbar custom-markdown-preview">
                {content.trim() ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline ? (
                          <SyntaxHighlighter
                            style={dracula}
                            language={match ? match[1] : 'text'}
                            PreTag="div"
                            className="rounded-md border border-white/[0.05] !my-4 !bg-[#282a36] !font-mono !text-[14px]"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-white/10 text-[#00a2ff] px-1.5 py-0.5 rounded-md text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/30 font-mono text-sm italic">
                    Preview area
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Tags Input */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] border border-white/[0.1] rounded-md text-[12px] font-mono text-white/80">
                #{tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                  <X size={12} />
                </button>
              </span>
            ))}
            <div className="flex items-center flex-1 min-w-[200px]">
              <span className="text-white/40 font-mono text-sm mr-2">#</span>
              <input 
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags... (Press Enter)"
                className="w-full bg-transparent border-none outline-none font-mono text-sm text-white/80 placeholder:text-white/30"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/[0.04] bg-white/[0.01]">
          <div className="font-mono text-[11px] text-white/30">
            {content.length} characters // {tags.length} tags
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-mono text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-[#00a2ff] hover:bg-[#0088cc] disabled:opacity-50 text-white rounded-lg font-mono text-sm font-bold transition-all shadow-[0_0_15px_rgba(0,162,255,0.3)] hover:shadow-[0_0_20px_rgba(0,162,255,0.5)]"
            >
              <Send size={14} />
              {isSubmitting ? "Committing..." : "Commit Post"}
            </button>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-markdown-preview {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 15px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.85);
        }
        .custom-markdown-preview h1,
        .custom-markdown-preview h2,
        .custom-markdown-preview h3 {
          color: white;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .custom-markdown-preview h1 { font-size: 1.8em; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.3em; }
        .custom-markdown-preview h2 { font-size: 1.5em; }
        .custom-markdown-preview h3 { font-size: 1.25em; }
        .custom-markdown-preview p { margin-bottom: 1em; }
        .custom-markdown-preview a { color: #00a2ff; text-decoration: none; }
        .custom-markdown-preview a:hover { text-decoration: underline; }
        .custom-markdown-preview ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .custom-markdown-preview ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .custom-markdown-preview li { margin-bottom: 0.25em; }
        .custom-markdown-preview blockquote {
          border-left: 4px solid rgba(255,255,255,0.2);
          padding-left: 1em;
          color: rgba(255,255,255,0.6);
          margin-left: 0;
          margin-bottom: 1em;
        }
        .custom-markdown-preview img {
          max-width: 100%;
          border-radius: 8px;
          margin: 1em 0;
        }
      `}} />
    </div>
  );
}
