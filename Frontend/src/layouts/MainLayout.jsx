import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import { getAccessToken, getStoredUser, refreshAuthToken } from "@/services/authService";
import { SocketProvider } from "@/contexts/SocketContext";

export default function MainLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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

          <main className="flex-1 w-full max-w-2xl min-w-0 border-x border-[var(--border)] min-h-[calc(100vh-64px)]">
            <Outlet context={{ user }} />
          </main>

          <RightSidebar user={user} />
        </div>
      </div>
    </SocketProvider>
  );
}
