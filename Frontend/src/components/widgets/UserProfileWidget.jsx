import { User, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserProfileWidget({ user }) {
  const navigate = useNavigate();
  const postCount = Number(user?.postCount ?? user?.postsCount ?? user?.posts ?? 0) || 0;
  const followerCount = Number(user?.followerCount ?? user?.followersCount ?? user?.followers ?? 0) || 0;
  const displayName = user?.displayName || user?.username || "Chưa cập nhật";
  const username = user?.username ? `@${user.username}` : "@chua-cap-nhat";

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)]">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={24} className="text-white" />
          )}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-[var(--text-primary)] font-mono text-[16px] truncate">
            {displayName}
          </span>
          <span className="text-[var(--text-secondary)] font-mono text-[13px] truncate">
            {username}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-center gap-10 mb-6">
        <div className="flex flex-col items-center">
          <span className="text-[var(--accent)] font-mono font-bold text-[15px]">{postCount}</span>
          <span className="text-[var(--text-secondary)] font-mono text-[10px] tracking-widest uppercase mt-1">Posts</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[var(--accent)] font-mono font-bold text-[15px]">{followerCount}</span>
          <span className="text-[var(--text-secondary)] font-mono text-[10px] tracking-widest uppercase mt-1">Followers</span>
        </div>
      </div>

      {/* Dashboard Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="w-full py-2.5 bg-[var(--bg-elevated)] hover:brightness-110 transition-colors rounded-lg flex items-center justify-center gap-2 border border-[var(--border)]"
      >
        <LayoutDashboard size={16} className="text-[var(--text-secondary)]" />
        <span className="text-[var(--text-primary)] font-mono text-[14px]">Open Dashboard</span>
      </button>
    </div>
  );
}
