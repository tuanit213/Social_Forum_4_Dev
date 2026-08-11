import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import { getAccessToken, getStoredUser, refreshAuthToken } from "@/services/authService";
import { SocketProvider } from "@/contexts/SocketContext";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  const isChatPage = location.pathname.startsWith("/group-chat");

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      const storedUser = getStoredUser();

      if (getAccessToken() && storedUser) {
        setUser(storedUser);
        return;
      }

      try {
        const data = await refreshAuthToken();
        if (!cancelled) {
          setUser(data.user || getStoredUser());
        }
      } catch {
        if (!cancelled) {
          navigate("/login", { replace: true });
        }
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!user) return null;

  return (
    <SocketProvider user={user}>
      <div className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-200">
        <Navbar user={user} />

        <div className="relative z-10 max-w-[1400px] mx-auto w-full pt-16 flex justify-center">
          <LeftSidebar />

          <main className={`flex-1 w-full min-w-0 border-x border-[var(--border)] min-h-[calc(100vh-64px)] ${isChatPage ? '' : 'max-w-2xl'}`}>
            <Outlet context={{ user }} />
          </main>

          {!isChatPage && <RightSidebar user={user} />}
        </div>
      </div>
    </SocketProvider>
  );
}
