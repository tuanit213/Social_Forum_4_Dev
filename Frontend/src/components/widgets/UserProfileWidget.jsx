import { User, LayoutDashboard } from "lucide-react";

export default function UserProfileWidget({ user }) {
  return (
    <div className="bg-[#1C1C1E] rounded-xl p-5 border border-white/[0.04]">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center flex-shrink-0">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={24} className="text-white" />
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-white font-mono text-[16px] truncate">
            {user?.displayName || "John Doe"}
          </span>
          <span className="text-white/40 font-mono text-[13px] truncate">
            @{user?.username || "johndoe"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-10 mb-6">
        <div className="flex flex-col items-center">
          <span className="text-[#00A2FF] font-mono font-bold text-[15px]">128</span>
          <span className="text-white/40 font-mono text-[10px] tracking-widest uppercase mt-1">Posts</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[#00A2FF] font-mono font-bold text-[15px]">2.4k</span>
          <span className="text-white/40 font-mono text-[10px] tracking-widest uppercase mt-1">Followers</span>
        </div>
      </div>

      {/* Dashboard Button */}
      <button className="w-full py-2.5 bg-white/[0.05] hover:bg-white/[0.08] transition-colors rounded-lg flex items-center justify-center gap-2 border border-white/[0.02]">
        <LayoutDashboard size={16} className="text-white/60" />
        <span className="text-white/80 font-mono text-[14px]">Open Dashboard</span>
      </button>
    </div>
  );
}
