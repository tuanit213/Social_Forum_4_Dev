import { useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut } from "@/services/authService";

import UserProfileWidget from "@/components/widgets/UserProfileWidget";
import SuggestedConnectionsWidget from "@/components/widgets/SuggestedConnectionsWidget";
import DailyQuestsWidget from "@/components/widgets/DailyQuestsWidget";

export default function RightSidebar({ user }) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-[340px] h-[calc(100vh-64px)] sticky top-16 hidden xl:flex flex-col py-6 px-4 border-l border-white/[0.04] overflow-y-auto custom-scrollbar gap-6">
      
      {/* 1. User Profile Widget */}
      <UserProfileWidget user={user} />

      {/* Sign Out Button */}
      <button 
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex items-center gap-3 px-2 text-[#FF7E5F] hover:text-[#FF6B6B] hover:brightness-110 transition-colors w-full disabled:opacity-50"
      >
        <LogOut size={20} />
        <span className="font-mono text-[14px]">
          {isLoggingOut ? "Signing Out..." : "Sign Out"}
        </span>
      </button>

      {/* 2. Suggested Connections Widget */}
      <SuggestedConnectionsWidget />

      {/* 3. Daily Quests Widget */}
      <DailyQuestsWidget />

    </aside>
  );
}
