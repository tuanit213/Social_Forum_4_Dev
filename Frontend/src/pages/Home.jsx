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

  // Fetch bài viết từ API
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
      <div className="sticky top-16 z-30 bg-[#171718]/80 backdrop-blur-md border-b border-white/[0.04] px-4 py-3">
        <h2 className="text-xl font-bold text-white/90">Trang chủ</h2>
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Shield size={14} />
            Phiên bản an toàn
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-white">
            Chào mừng trở lại, <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
              {user?.displayName || user?.username}
            </span>
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Giao diện 3 cột đã được thiết lập thành công. Feed bài viết sẽ hiển thị ở khu vực này.
          </p>
        </div>
        
        {/* Hiển thị bài viết */}
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard 
              key={post._id} 
              post={post} 
              currentUser={user} 
              onPostDeleted={(deletedId) => setPosts(posts.filter(p => p._id !== deletedId))}
              onPostUpdated={(updatedPost) => setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p))}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
