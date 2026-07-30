import React, { useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import EmojiPicker from 'emoji-picker-react';
import { MoreHorizontal, Edit, Trash2, MessageSquare, Heart, Share2, Bookmark, Plus } from 'lucide-react';
import api from '@/services/authService';
import CommentSection from './CommentSection';
import ConfirmModal from '@/components/ui/ConfirmModal';

const DEFAULT_EMOJIS = ['👍', '❤️', '😂', '😮'];

export default function PostCard({ post, currentUser, onPostDeleted, onPostUpdated }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isHoveringReact, setIsHoveringReact] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const hoverTimeoutRef = useRef(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentUserId = currentUser?._id || currentUser?.id;
  const isAuthor = currentUserId === post.userId?._id || currentUserId === post.userId;

  const handleDelete = async () => {
    try {
      await api.delete(`/posts/${post._id}`);
      if (onPostDeleted) onPostDeleted(post._id);
    } catch {
      alert("Lỗi khi xóa bài viết");
    }
  };

  const handleUpdate = async () => {
    try {
      const res = await api.put(`/posts/${post._id}`, { content: editContent });
      if (res.data.success) {
        setLocalPost(res.data.post);
        setIsEditing(false);
        if (onPostUpdated) onPostUpdated(res.data.post);
      }
    } catch {
      alert("Lỗi khi cập nhật bài viết");
    }
  };

  const handleReaction = async (emojiObject) => {
    setShowEmojiPicker(false);
    setIsHoveringReact(false);
    try {
      const res = await api.post(`/posts/${post._id}/react`, { emoji: emojiObject.emoji || emojiObject });
      if (res.data.success) {
        setLocalPost({ ...localPost, reactions: res.data.reactions });
      }
    } catch (error) {
      console.error("Lỗi thả cảm xúc:", error);
    }
  };

  const handleMouseEnterReact = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHoveringReact(true);
  };

  const handleMouseLeaveReact = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (!showEmojiPicker) {
        setIsHoveringReact(false);
      }
    }, 300);
  };

  const formattedDate = post.createdAt
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })
    : 'Vừa xong';

  const authorName = post.userId?.displayName || post.userId?.username || 'Người dùng ẩn danh';
  const initial = authorName.charAt(0).toUpperCase();

  // Đếm tổng số reaction
  const totalReactions = localPost.reactions?.reduce((acc, curr) => acc + curr.users.length, 0) || 0;
  // Lấy ra 3 emoji phổ biến nhất để hiển thị
  const topEmojis = [...(localPost.reactions || [])]
    .sort((a, b) => b.users.length - a.users.length)
    .slice(0, 3)
    .map(r => r.emoji);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-[var(--text-primary)] shadow-sm">
      {/* Header: User Info & Options */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-white shadow-md text-lg">
            {initial}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <p className="font-mono text-[16px] text-[var(--text-primary)] font-medium">{authorName}</p>
              <span className="text-[var(--text-secondary)] text-xs hidden sm:inline">•</span>
              <p className="font-mono text-[13px] text-[var(--text-secondary)] hidden sm:inline">{formattedDate}</p>
            </div>
            {/* Tag (Tutorial) */}
            <span className="px-2 py-0.5 rounded-md bg-[var(--bg-primary)] text-[var(--accent)] text-[12px] font-mono flex items-center gap-1 w-fit mt-1 sm:mt-0">
              {'</> Tutorial'}
            </span>
          </div>
        </div>

        {/* Dropdown Options */}
        {isAuthor && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-full transition"
            >
              <MoreHorizontal size={18} />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-40 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden z-10">
                <button
                  onClick={() => { setIsEditing(true); setShowDropdown(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition"
                >
                  <Edit size={14} /> Chỉnh sửa
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(true); setShowDropdown(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--danger)] hover:bg-[var(--bg-elevated)] transition"
                >
                  <Trash2 size={14} /> Xóa bài
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area with Left Border */}
      <div className="pl-5 ml-[19px] border-l-[2px] border-[var(--accent)] space-y-5 pb-2">
        {/* Title */}
        {post.title && <h2 className="font-mono font-bold text-[20px] text-[var(--text-primary)] leading-snug">{post.title}</h2>}

        {/* Content & Code */}
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              className="w-full min-h-[120px] bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-[var(--accent)]"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
                Hủy
              </button>
              <button onClick={handleUpdate} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]">
                Lưu
              </button>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none prose-p:font-mono prose-p:text-[15px] prose-p:text-[var(--text-primary)] prose-p:leading-relaxed">
            <ReactMarkdown
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <div className="my-5 rounded-lg overflow-hidden bg-[var(--bg-primary)] border border-[var(--border)]">
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match ? match[1] : 'text'}
                        PreTag="div"
                        showLineNumbers={true}
                        lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: '#6e7681', textAlign: 'right' }}
                        customStyle={{
                          margin: 0,
                          padding: '12px 8px',
                          background: 'var(--bg-primary)',
                          fontSize: '14px',
                          lineHeight: '1.6',
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="bg-[var(--bg-elevated)] text-[var(--accent)] rounded px-1.5 py-0.5 text-[14px] font-mono" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {localPost.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Tags */}
        {localPost.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap pt-2">
            {localPost.tags.map(tag => (
              <span key={tag} className="text-[var(--text-secondary)] text-[13px] font-mono hover:text-[var(--accent)] cursor-pointer transition">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Interactions Footer */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[var(--border)] px-1 relative">
        <div className="flex items-center gap-6">
          {/* Reaction Area with Hover Menu */}
          <div 
            className="relative flex items-center gap-2 group"
            onMouseEnter={handleMouseEnterReact}
            onMouseLeave={handleMouseLeaveReact}
          >
            <button 
              onClick={() => {
                const userReaction = localPost.reactions?.find(r => r.users.includes(currentUserId));
                if (userReaction) {
                  handleReaction(userReaction.emoji); // Clicking again will toggle off (or we can use toggle logic)
                } else {
                  handleReaction('❤️'); // Default reaction if clicking empty heart
                }
              }}
              className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition font-mono text-[14px]"
            >
              {(() => {
                const userReaction = localPost.reactions?.find(r => r.users.includes(currentUserId));
                if (userReaction) {
                  return <span className="text-[18px] leading-none">{userReaction.emoji}</span>;
                }
                return <Heart size={18} className={totalReactions > 0 ? "fill-red-500/10 text-red-400" : ""} />;
              })()}
              
              {totalReactions > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="flex gap-0.5 items-center">
                    {topEmojis.map((e, i) => <span key={i} className="text-xs">{e}</span>)}
                  </span>
                  <span>{totalReactions}</span>
                </span>
              )}
            </button>

            {/* Hover Menu */}
            {isHoveringReact && (
              <div className="absolute -top-12 left-0 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full shadow-2xl px-2 py-1.5 flex items-center gap-1 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {DEFAULT_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-xl hover:scale-125 hover:-translate-y-1 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
                <div className="w-[1px] h-5 bg-[var(--border)] mx-1"></div>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-full transition relative"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute top-8 left-0 z-30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <EmojiPicker 
                  onEmojiClick={handleReaction} 
                  theme="dark" 
                  skinTonesDisabled 
                />
              </div>
            )}
          </div>

          {/* Comment Toggle */}
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 transition font-mono text-[14px] ${showComments ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            <MessageSquare size={18} />
            <span>{localPost.commentsCount || 0}</span>
          </button>

          <button className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition font-mono text-[14px]">
            <Share2 size={18} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>

        <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
          <Bookmark size={18} />
        </button>
      </div>

      {/* Comment Section (now a Modal) */}
      {showComments && (
        <CommentSection 
          post={localPost}
          currentUser={currentUser} 
          onClose={() => setShowComments(false)}
          onCommentCountChange={(change) => {
            setLocalPost(prev => ({
              ...prev,
              commentsCount: Math.max(0, (prev.commentsCount || 0) + change)
            }));
          }}
        />
      )}
      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa bài viết này không? Hành động này sẽ xóa toàn bộ nội dung và các bình luận liên quan."
      />
    </div>
  );
}
