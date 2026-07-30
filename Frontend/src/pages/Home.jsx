import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import CreatePostWidget from "@/components/post/CreatePostWidget";
import CreatePostModal from "@/components/post/CreatePostModal";
import PostCard from "@/components/post/PostCard";
import api from "@/services/authService";

export default function Home() {
  const { user } = useOutletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get("/posts");
        if (res.data.success) {
          setPosts(res.data.posts);
        }
      } catch (error) {
        console.error("Lỗi khi tải bài viết:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleCreatePost = async (postData) => {
    try {
      const res = await api.post("/posts", postData);
      if (res.data.success) {
        setPosts((currentPosts) => [res.data.post, ...currentPosts]);
      }

      return true;
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      alert(error.message || "Có lỗi xảy ra khi đăng bài. Vui lòng kiểm tra console.");
      return false;
    }
  };

  return (
    <div className="w-full">
      {/* Header cho cột giữa */}
      <div className="sticky top-16 z-30 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 py-3">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Trang chủ</h2>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Widget Đăng Bài */}
        <CreatePostWidget onClick={() => setIsModalOpen(true)} />
        
        {/* Modal Đăng Bài */}
        <CreatePostModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleCreatePost}
        />

        {/* Welcome Card */}
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--success)] text-xs font-semibold uppercase tracking-wider mb-6">
            <Shield size={14} />
            Phiên bản an toàn
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-[var(--text-primary)]">
            Chào mừng trở lại, <br/>
            <span className="text-[var(--accent)]">
              {user?.displayName || user?.username}
            </span>
          </h2>
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
            Chia sẻ câu hỏi, ghi chú kỹ thuật và kinh nghiệm lập trình với cộng đồng.
          </p>
        </div>
        <div className="space-y-4">
          {loading && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center">
              <p className="font-mono text-sm text-[var(--text-secondary)]">Đang tải bài viết...</p>
            </div>
          )}

          {!loading && posts.map(post => (
            <PostCard 
              key={post._id} 
              post={post} 
              currentUser={user} 
              onPostDeleted={(deletedId) => setPosts(posts.filter(p => p._id !== deletedId))}
              onPostUpdated={(updatedPost) => setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p))}
            />
          ))}

          {!loading && posts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center">
              <p className="font-mono text-sm text-[var(--text-primary)]">Chưa có bài viết nào.</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Hãy tạo bài viết đầu tiên để bắt đầu cuộc thảo luận.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
