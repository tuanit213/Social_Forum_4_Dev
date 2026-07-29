import { useState } from "react";
import { Shield } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import CreatePostWidget from "@/components/post/CreatePostWidget";
import CreatePostModal from "@/components/post/CreatePostModal";
// Import authService or axios to make the API call. Assuming we have an api instance or we use fetch.
import axios from "axios";

export default function Home() {
  const { user } = useOutletContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState([]); // Temporary local state to show new posts

  const handleCreatePost = async (postData) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post("http://localhost:5000/api/posts", postData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.data.success) {
        // Add to local state to reflect UI update immediately
        setPosts([res.data.post, ...posts]);
      }
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      alert("Có lỗi xảy ra khi đăng bài. Vui lòng kiểm tra console.");
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
        
        {/* Hiển thị bài viết vừa đăng (Tạm thời) */}
        {posts.map(post => (
           <div key={post._id} className="bg-[#1C1C1E] border border-white/[0.04] rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a2ff] to-[#0088cc] flex items-center justify-center font-bold text-white">
                {user?.displayName?.[0] || 'U'}
              </div>
              <div>
                <p className="font-mono font-bold text-[15px] text-white/90">{user?.displayName}</p>
                <p className="font-mono text-[11px] text-white/40">Vừa xong</p>
              </div>
            </div>
            {post.title && <h3 className="font-mono font-bold text-lg text-white/90">{post.title}</h3>}
            {/* Tạm hiển thị text thô, phần hiển thị Markdown chi tiết sẽ làm ở task sau */}
            <p className="text-white/80 font-mono text-[14px] leading-relaxed line-clamp-3">
              {post.content}
            </p>
            {post.tags?.length > 0 && (
              <div className="flex gap-2 pt-2">
                {post.tags.map(tag => (
                  <span key={tag} className="text-[#00a2ff] text-[12px] font-mono">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Mockup Post Cũ */}
        <div className="bg-[#1C1C1E] border border-white/[0.04] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div>
              <p className="font-mono font-bold text-[15px] text-white/90">System Admin</p>
              <p className="font-mono text-[11px] text-white/40">1 giờ trước</p>
            </div>
          </div>
          <p className="text-white/80 font-mono text-[14px] leading-relaxed">
            Layout mới tuyệt vời quá! Nó giúp việc hiển thị luồng thông tin tốt hơn và hỗ trợ tương lai cho việc mở rộng tính năng.
          </p>
        </div>

      </div>
    </div>
  );
}
