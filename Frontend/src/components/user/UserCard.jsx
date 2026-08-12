import React from "react";
import { User, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserCard({ user }) {
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (user?.Username || user?.username) {
      navigate(`/profile/${user.Username || user.username}`);
    }
  };

  const followerCount = user?.stats?.followerCount || user?.followers?.length || 0;

  return (
    <div 
      className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-4 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
      onClick={handleNavigate}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0 overflow-hidden">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <User size={24} className="text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-[var(--text-primary)] truncate text-base hover:text-[var(--accent)] transition-colors">
            {user?.displayName || "Người dùng"}
          </h3>
        </div>
        <span className="text-[var(--text-secondary)] text-sm mb-2">
          @{user?.Username || user?.username || "unknown"}
        </span>

        {user?.bio && (
          <p className="text-[var(--text-primary)] text-sm line-clamp-2 mb-3">
            {user.bio}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mt-auto">
          <div className="flex items-center gap-1.5">
            <Users size={14} />
            <span>{followerCount} người theo dõi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
