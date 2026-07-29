import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import LeftSidebar from "@/components/layout/LeftSidebar";
import RightSidebar from "@/components/layout/RightSidebar";

export default function MainLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Lỗi parse thông tin user:", e);
      }
    }
  }, [navigate]);

  if (!user) return null; // Loading state

  return (
    <div className="min-h-screen w-full bg-[#171718] text-white font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <Navbar user={user} />

      {/* 3-Column Layout */}
      <div className="relative z-10 max-w-[1400px] mx-auto w-full pt-16 flex justify-center">
        
        {/* Left Sidebar (Navigation) */}
        <LeftSidebar />

        {/* Center Content (Main Feed) */}
        <main className="flex-1 w-full max-w-2xl min-w-0 border-x border-white/[0.06] min-h-[calc(100vh-64px)]">
          <Outlet context={{ user }} />
        </main>

        {/* Right Sidebar (Widgets) */}
        <RightSidebar user={user} />

      </div>

    </div>
  );
}
