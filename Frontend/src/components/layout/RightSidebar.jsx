import { useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearAuthState, signOut } from "@/services/authService";

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
      console.error("Logout error", error);
      clearAuthState();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="w-[340px] h-[calc(100vh-64px)] sticky top-16 hidden xl:flex flex-col py-6 px-4 border-l border-[var(--border)] overflow-y-auto custom-scrollbar gap-6">
      <UserProfileWidget user={user} />

      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="flex items-center gap-3 px-2 text-[var(--danger)] hover:brightness-110 transition-colors w-full disabled:opacity-50"
      >
        <LogOut size={20} />
        <span className="font-mono text-[14px]">
          {isLoggingOut ? "Signing Out..." : "Sign Out"}
        </span>
      </button>

      <SuggestedConnectionsWidget />
      <DailyQuestsWidget />
    </aside>
  );
}
