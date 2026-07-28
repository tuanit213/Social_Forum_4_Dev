import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User as UserIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/services/authService";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Kiểm tra accessToken, nếu không có thì đẩy về trang login
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    // Lấy thông tin user từ localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Lỗi parse thông tin user:", e);
      }
    }
  }, [navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      // Dù lỗi mạng thì cũng cứ cho về login và xóa local
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null; // Tránh flash content khi đang check token

  return (
    <div className="min-h-screen w-full relative bg-black text-white font-sans overflow-hidden">
      
      {/* ===== BACKGROUND ===== */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Radial Gradient Pattern từ đỉnh (giống Login/Register) */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(125% 125% at 50% 10%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.65) 65%, #000 100%)",
          }}
        />
        {/* Hào quang tím xanh nhẹ từ đỉnh */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(125% 125% at 50% 10%, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.06) 35%, transparent 65%)",
          }}
        />
        {/* Một vài chấm sáng trang trí mờ ảo */}
        <div className="absolute top-[20%] left-[15%] w-[300px] h-[300px] bg-violet-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-indigo-900/15 rounded-full blur-[150px]" />
      </div>

      {/* ===== NAVBAR ===== */}
      <nav className="relative z-20 w-full h-16 flex items-center justify-between px-8 border-b border-white/[0.06] bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-indigo-300">
            SocialForum
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-full">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-inner">
              <UserIcon size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium text-white/80 pr-1">{user.displayName || user.username}</span>
          </div>

          <Button 
            onClick={handleLogout} 
            disabled={isLoggingOut}
            variant="ghost" 
            className="text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors h-10 px-4"
          >
            <LogOut size={18} className="mr-2" />
            {isLoggingOut ? "Đang xuất..." : "Đăng xuất"}
          </Button>
        </div>
      </nav>

      {/* ===== MAIN CONTENT ===== */}
      <main className="relative z-10 w-full max-w-5xl mx-auto mt-20 px-6">
        
        {/* Header Section */}
        <div className="mb-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Shield size={14} />
            Phiên bản an toàn
          </div>
          <h2 className="text-5xl font-bold tracking-tight mb-4 text-white">
            Chào mừng trở lại, <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">
              {user.displayName || user.username}
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Bạn đã đăng nhập thành công vào SocialForum. Trải nghiệm không gian kết nối và chia sẻ dành riêng cho cộng đồng nhà phát triển.
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          
          {/* Card 1: Thông tin Profile */}
          <div className="col-span-1 md:col-span-2 p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-xl font-semibold mb-6 text-white/90">Hồ sơ cá nhân</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-white/30 font-medium mb-1">Tên hiển thị</span>
                <span className="text-white/80 font-medium">{user.displayName || "Chưa cập nhật"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-white/30 font-medium mb-1">Email</span>
                <span className="text-white/80 font-medium">{user.email || "Chưa cập nhật"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-white/30 font-medium mb-1">Tên đăng nhập</span>
                <span className="text-white/80 font-medium">@{user.username}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Hoạt động */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-xl font-semibold mb-6 text-white/90">Hoạt động</h3>
            
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="w-12 h-12 rounded-full bg-white/[0.05] flex items-center justify-center mb-4">
                <span className="text-white/20">∅</span>
              </div>
              <p className="text-white/40 text-sm">Chưa có hoạt động nào gần đây.</p>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
