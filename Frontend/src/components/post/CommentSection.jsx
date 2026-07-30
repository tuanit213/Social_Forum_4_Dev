import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Send, Trash2, X, MoreHorizontal, Edit, Bold, Italic, Link, ImageIcon, Code, Smile } from 'lucide-react';
import api from '@/services/authService';
import EmojiPicker from 'emoji-picker-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ConfirmModal from '@/components/ui/ConfirmModal';

const DEFAULT_EMOJIS = [
  { icon: '👍', color: 'text-blue-500', name: 'Thích', id: 'like' },
  { icon: '❤️', color: 'text-red-500', name: 'Yêu thích', id: 'love' },
  { icon: '😂', color: 'text-yellow-500', name: 'Haha', id: 'haha' },
  { icon: '😢', color: 'text-yellow-500', name: 'Buồn', id: 'sad' },
  { icon: '😡', color: 'text-orange-500', name: 'Phẫn nộ', id: 'angry' }
];

export default function CommentSection({ post, currentUser, onClose, onCommentCountChange }) {
  const postId = post._id;
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // States for main input
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // States for editing
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [showDropdownId, setShowDropdownId] = useState(null);
  const editRef = useRef(null);

  // States for replying
  const [replyingToId, setReplyingToId] = useState(null);
  
  // State for deletion
  const [commentToDelete, setCommentToDelete] = useState(null);

  const currentUserId = currentUser?._id || currentUser?.id;

  const postAuthorName = post.userId?.displayName || post.userId?.username || 'Người dùng ẩn danh';
  const postInitial = postAuthorName.charAt(0).toUpperCase();
  const postFormattedDate = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi }) : 'Vừa xong';

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await api.get(`/comments/post/${postId}`);
        if (res.data.success) {
          setComments(res.data.comments);
        }
      } catch (error) {
        console.error("Lỗi khi tải bình luận:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [postId]);

  const insertMarkdown = (prefix, suffix = "", target = 'new') => {
    let ref, text, setter;
    if (target === 'edit') { ref = editRef; text = editContent; setter = setEditContent; }
    else { ref = textareaRef; text = newComment; setter = setNewComment; }

    if (!ref.current) return;
    const textarea = ref.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    
    setter(before + prefix + selected + suffix + after);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const payload = { postId, content: newComment };
      if (replyingToId) {
        payload.parentCommentId = replyingToId;
      }
      
      const res = await api.post('/comments', payload);
      if (res.data.success) {
        if (replyingToId) {
          // Gắn vào cuối danh sách replies
          setComments([...comments, res.data.comment]);
        } else {
          // Bình luận gốc đẩy lên đầu
          setComments([res.data.comment, ...comments]);
        }
        setNewComment("");
        setReplyingToId(null);
        if (onCommentCountChange) onCommentCountChange(1);
      }
    } catch (error) {
      console.error("Lỗi thêm bình luận:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      // Xoá comment và cả các comment con của nó
      setComments(comments.filter(c => c._id !== commentId && c.parentCommentId !== commentId));
      if (onCommentCountChange) onCommentCountChange(-1);
    } catch (error) {
      console.error("Lỗi xóa bình luận:", error);
    }
  };

  const handleUpdate = async (commentId) => {
    if (!editContent.trim()) return;
    try {
      const res = await api.put(`/comments/${commentId}`, { content: editContent });
      if (res.data.success) {
        setComments(comments.map(c => c._id === commentId ? { ...c, content: editContent } : c));
        setEditingId(null);
      }
    } catch (error) {
      console.error("Lỗi cập nhật bình luận:", error);
    }
  };

  const handleReact = async (commentId, emojiName) => {
    try {
      // Optimistic update
      const updatedComments = comments.map(c => {
        if (c._id === commentId) {
          let newReactions = [...(c.reactions || [])];
          const oldReactionIndex = newReactions.findIndex(r => r.users.includes(currentUserId));
          
          if (oldReactionIndex !== -1) {
            newReactions[oldReactionIndex].users = newReactions[oldReactionIndex].users.filter(id => id !== currentUserId);
            if (newReactions[oldReactionIndex].users.length === 0) {
              newReactions.splice(oldReactionIndex, 1);
            }
          }
          
          // If clicked a different emoji, add it
          if (oldReactionIndex === -1 || newReactions[oldReactionIndex]?.emoji !== emojiName) {
            const existingEmojiIndex = newReactions.findIndex(r => r.emoji === emojiName);
            if (existingEmojiIndex !== -1) {
              newReactions[existingEmojiIndex].users.push(currentUserId);
            } else {
              newReactions.push({ emoji: emojiName, users: [currentUserId] });
            }
          }
          return { ...c, reactions: newReactions };
        }
        return c;
      });
      
      setComments(updatedComments);
      await api.post(`/comments/${commentId}/react`, { emoji: emojiName });
    } catch (error) {
      console.error("Lỗi thả cảm xúc:", error);
    }
  };

  const MarkdownRenderer = ({ content }) => (
    <div className="prose max-w-none prose-p:font-mono prose-p:text-[14px] prose-p:text-[var(--text-primary)] prose-p:leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <div className="my-3 rounded-lg overflow-hidden bg-[var(--bg-primary)] border border-[var(--border)]">
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match ? match[1] : 'text'}
                  PreTag="div"
                  customStyle={{ margin: 0, padding: '12px 8px', background: 'var(--bg-primary)', fontSize: '13px' }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className="bg-[var(--bg-elevated)] text-[var(--accent)] rounded px-1.5 py-0.5 text-[13px] font-mono" {...props}>{children}</code>
            );
          },
          img({ src, alt }) {
            return <img src={src} alt={alt} className="max-w-full rounded-lg border border-[var(--border)] my-2 max-h-[300px] object-contain" loading="lazy" />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );

  const Toolbar = ({ target }) => (
    <div className="flex items-center gap-1 border-b border-[var(--border)] px-3 py-2 bg-[var(--bg-primary)] rounded-t-xl">
      <button type="button" onClick={() => insertMarkdown("**", "**", target)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded"><Bold size={14} /></button>
      <button type="button" onClick={() => insertMarkdown("*", "*", target)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded"><Italic size={14} /></button>
      <div className="w-px h-4 bg-[var(--border)] mx-1"></div>
      <button type="button" onClick={() => insertMarkdown("[", "](url)", target)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded"><Link size={14} /></button>
      <button type="button" onClick={() => insertMarkdown("![Hình ảnh](", ")", target)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded"><ImageIcon size={14} /></button>
      <button type="button" onClick={() => insertMarkdown("```\n", "\n```", target)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded"><Code size={14} /></button>
    </div>
  );

  const CommentItem = ({ comment, isReply = false }) => {
    const isCommentAuthor = (comment.userId?._id || comment.userId) === currentUserId;
    const authorName = comment.userId?.displayName || comment.userId?.username || 'Ẩn danh';
    const initial = authorName.charAt(0).toUpperCase();
    const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi });
    const isEditing = editingId === comment._id;
    const hasReactions = comment.reactions && comment.reactions.length > 0;
    const myReaction = comment.reactions?.find(r => r.users.includes(currentUserId));

    return (
      <div className={`flex gap-3 group ${isReply ? 'mt-4' : ''}`}>
        <div className="flex flex-col items-center">
          <div className={`rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-white shrink-0 z-10 shadow-md ${isReply ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'}`}>
            {initial}
          </div>
          {!isReply && <div className="w-[2px] h-full bg-[var(--border)] mt-2 rounded-full group-last:hidden"></div>}
        </div>
        
        <div className="flex-1 pb-2 group-last:pb-0">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-3 relative shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[14px] text-[var(--text-primary)]">{authorName}</span>
                <span className="text-[var(--text-secondary)] text-[10px]">•</span>
                <span className="font-mono text-[12px] text-[var(--text-secondary)]">{timeAgo}</span>
              </div>
              
              {isCommentAuthor && !isEditing && (
                <div className="relative">
                  <button onClick={() => setShowDropdownId(showDropdownId === comment._id ? null : comment._id)} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded transition opacity-0 group-hover:opacity-100">
                    <MoreHorizontal size={16} />
                  </button>
                  {showDropdownId === comment._id && (
                    <div className="absolute right-0 mt-1 w-32 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden z-10">
                      <button onClick={() => { setEditingId(comment._id); setEditContent(comment.content); setShowDropdownId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"><Edit size={14} /> Chỉnh sửa</button>
                      <button onClick={() => { setCommentToDelete(comment._id); setShowDropdownId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--danger)] hover:bg-[var(--bg-elevated)] transition"><Trash2 size={14} /> Xóa</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {isEditing ? (
              <div className="mt-2 border border-[var(--border)] focus-within:border-[var(--accent)] rounded-xl overflow-hidden transition-colors">
                <Toolbar target="edit" />
                <div className="bg-[var(--bg-secondary)] p-2">
                  <textarea ref={editRef} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-transparent border-none outline-none font-mono text-[14px] text-[var(--text-primary)] min-h-[80px] resize-none p-2 custom-scrollbar" />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">Hủy</button>
                    <button onClick={() => handleUpdate(comment._id)} className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]">Lưu</button>
                  </div>
                </div>
              </div>
            ) : (
              <MarkdownRenderer content={comment.content} />
            )}
            
            {/* Reaction & Reply Bar */}
            {!isEditing && (
              <div className="flex items-center gap-4 mt-2">
                <div className="relative group/react">
                  <button 
                    onClick={() => {
                      if (myReaction) handleReact(comment._id, myReaction.emoji);
                      else handleReact(comment._id, 'like');
                    }}
                    className={`py-1 text-xs font-mono font-bold transition flex items-center gap-1 ${myReaction ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    {myReaction ? (() => {
                      const eData = DEFAULT_EMOJIS.find(e => e.id === myReaction.emoji || e.name === myReaction.emoji);
                      return eData ? <span className={`flex items-center gap-1 ${eData.color}`}><span className="text-base leading-none">{eData.icon}</span> <span>{eData.name}</span></span> : 'Thích';
                    })() : 'Thích'}
                  </button>
                  {/* Emoji Popover */}
                  <div className="absolute bottom-full left-0 pb-1 hidden group-hover/react:flex z-20">
                    <div className="flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--border)] p-1.5 rounded-full shadow-2xl">
                    {DEFAULT_EMOJIS.map(emoji => {
                      return (
                        <button key={emoji.id} onClick={() => handleReact(comment._id, emoji.id)} className={`w-8 h-8 flex items-center justify-center rounded-full transition hover:-translate-y-1 hover:scale-125 ${myReaction?.emoji === emoji.id ? "bg-[var(--bg-elevated)]" : ""}`}>
                          <span className="text-xl leading-none">{emoji.icon}</span>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    const parentId = isReply ? comment.parentCommentId : comment._id;
                    setReplyingToId(parentId);
                    
                    const prefix = `**@${authorName}** `;
                    if (!newComment.includes(prefix)) {
                      setNewComment((prev) => (prev ? prev + `\n${prefix}` : prefix));
                    }
                    setTimeout(() => textareaRef.current?.focus(), 0);
                  }}
                  className="py-1 text-xs font-mono font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                >
                  Trả lời
                </button>
                
                {/* Display Reactions */}
                {hasReactions && (
                  <div className="flex items-center gap-1 ml-auto bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                    <div className="flex -space-x-1">
                      {comment.reactions.slice(0, 3).map((r, i) => {
                        const iconData = DEFAULT_EMOJIS.find(e => e.id === r.emoji || e.name === r.emoji);
                        return <span key={i} className="text-xs">{iconData ? iconData.icon : '👍'}</span>;
                      })}
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] ml-1">
                      {comment.reactions.reduce((sum, r) => sum + r.users.length, 0)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const topLevelComments = comments.filter(c => !c.parentCommentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-[95vw] md:w-[80vw] max-w-5xl h-[85vh] bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <h3 className="font-mono font-bold text-lg text-[var(--text-primary)]">Bình luận bài viết</h3>
          <button type="button" onClick={onClose} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-full transition"><X size={20} /></button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[var(--bg-primary)]">
          
          <div className="mb-8 pb-8 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-white shadow-md text-lg">{postInitial}</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[16px] text-[var(--text-primary)] font-medium">{postAuthorName}</p>
                  <span className="text-[var(--text-secondary)] text-xs hidden sm:inline">•</span>
                  <p className="font-mono text-[13px] text-[var(--text-secondary)] hidden sm:inline">{postFormattedDate}</p>
                </div>
              </div>
            </div>
            <div className="pl-5 ml-[19px] border-l-[2px] border-[var(--accent)] space-y-5 pb-2">
              {post.title && <h2 className="font-mono font-bold text-[20px] text-[var(--text-primary)] leading-snug">{post.title}</h2>}
              <MarkdownRenderer content={post.content} />
            </div>
          </div>

          <h4 className="font-mono font-bold text-[var(--text-primary)] mb-4">Các bình luận mới nhất</h4>
          <div className="space-y-6">
            {loading ? (
              <div className="text-center text-[var(--text-secondary)] text-sm font-mono py-10">Đang tải bình luận...</div>
            ) : topLevelComments.length === 0 ? (
              <div className="text-center text-[var(--text-secondary)] text-sm font-mono italic py-10">Chưa có bình luận nào. Hãy là người đầu tiên!</div>
            ) : (
              topLevelComments.map(comment => {
                const replies = comments.filter(c => c.parentCommentId === comment._id).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort replies oldest to newest

                return (
                  <div key={comment._id}>
                    <CommentItem comment={comment} />
                    
                    {/* Render Replies */}
                    {replies.length > 0 && (
                      <div className="pl-6 sm:pl-10 ml-4 border-l-2 border-[var(--border)] mt-2 mb-4 space-y-4">
                        {replies.map(reply => (
                          <CommentItem key={reply._id} comment={reply} isReply />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main Input Form Area */}
        <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] text-[var(--accent)] flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 relative flex flex-col border border-[var(--border)] focus-within:border-[var(--accent)] rounded-xl overflow-visible transition-colors bg-[var(--bg-primary)]">
              {replyingToId && (
                <div className="text-[12px] font-mono text-[var(--accent)] flex items-center justify-between bg-[var(--bg-secondary)] px-4 py-2 rounded-t-xl border-b border-[var(--border)]">
                  <span>Đang trả lời bình luận</span>
                  <button onClick={() => { setReplyingToId(null); setNewComment(""); }} className="hover:text-[var(--text-primary)] transition underline">Hủy</button>
                </div>
              )}
              <Toolbar target="new" />
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận (hỗ trợ Markdown)..."
                  className="w-full bg-transparent border-none px-4 py-3 pb-12 text-[14px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none min-h-[80px] resize-none overflow-hidden custom-scrollbar"
                  onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 250) + 'px'; }}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-2">
                  <div className="relative" ref={emojiPickerRef}>
                    <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-elevated)] transition"><Smile size={18} /></button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 z-50 shadow-2xl">
                        <EmojiPicker theme="dark" onEmojiClick={(emojiObj) => { insertMarkdown(emojiObj.emoji, "", "new"); setShowEmojiPicker(false); }} />
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleSubmit()} disabled={!newComment.trim() || submitting} className="p-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition disabled:opacity-50 disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-secondary)]"><Send size={18} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Confirm Modal for Comment Deletion */}
      <ConfirmModal
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={() => {
          if (commentToDelete) {
            handleDelete(commentToDelete);
          }
        }}
        title="Xóa bình luận"
        message="Bạn có chắc muốn xóa bình luận này? Thao tác này sẽ xóa vĩnh viễn nội dung và các câu trả lời bên trong."
      />
    </div>
  );
}
