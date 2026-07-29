import { Shield } from "lucide-react";
import { useOutletContext } from "react-router-dom";

export default function Home() {
  // Nhận thông tin user từ MainLayout truyền xuống qua Outlet context
  const { user } = useOutletContext();

  return (
    <div className="w-full">
      {/* Header cho cột giữa */}
      <div className="sticky top-16 z-30 bg-black/60 backdrop-blur-md border-b border-white/[0.06] px-4 py-3">
        <h2 className="text-xl font-bold text-white/90">Trang chủ</h2>
      </div>

      <div className="p-4 space-y-6">
        
        {/* Form tạo bài viết (Mockup) */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 flex gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
          <div className="flex-1">
            <textarea 
              placeholder="Bạn đang nghĩ gì?" 
              className="w-full bg-transparent border-none text-white resize-none focus:outline-none placeholder:text-white/40 h-12"
            />
            <div className="flex justify-between items-center mt-2 border-t border-white/[0.06] pt-3">
              <div className="flex gap-2">
                {/* Icons placeholder */}
                <div className="w-8 h-8 rounded-full hover:bg-white/10" />
                <div className="w-8 h-8 rounded-full hover:bg-white/10" />
              </div>
              <button className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-full transition-colors">
                Đăng bài
              </button>
            </div>
          </div>
        </div>

        {/* Welcome Card (Tạm thời giữ lại từ bản cũ để demo) */}
        <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Shield size={14} />
            Phiên bản an toàn
          </div>
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-white">
            Chào mừng trở lại, <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
              {user.displayName || user.username}
            </span>
          </h2>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Giao diện 3 cột đã được thiết lập thành công. Feed bài viết sẽ hiển thị ở khu vực này.
          </p>
        </div>
        
        {/* Mockup Post */}
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div>
              <p className="font-semibold text-[15px] text-white/90">System Admin</p>
              <p className="text-[12px] text-white/40">Vừa xong</p>
            </div>
          </div>
          <p className="text-white/80 text-[15px] leading-relaxed">
            Layout mới tuyệt vời quá! Nó giúp việc hiển thị luồng thông tin tốt hơn và hỗ trợ tương lai cho việc mở rộng tính năng.
          </p>
        </div>

      </div>
    </div>
  );
}
