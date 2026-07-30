import { Bell, MessageSquare, Search, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export default function Navbar({ user }) {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full h-16 z-50 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--bg-primary)] transition-colors duration-200">
      <div className="flex items-center gap-2 w-64 flex-shrink-0">
        <h1
          className="text-xl font-bold cursor-pointer text-[var(--accent)]"
          onClick={() => navigate("/")}
        >
          SocialForum
        </h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-xl mx-4">
        <div className="relative w-full group">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors"
          />
          <Input
            placeholder="Tim kiem bai viet, nguoi dung, chu de..."
            className="w-full bg-[var(--bg-secondary)] border-[var(--border)] h-10 pl-10 pr-4 rounded-full text-sm text-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:border-[var(--accent)] transition-all placeholder:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 w-64 justify-end">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors relative">
          <MessageSquare size={20} />
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--danger)]" />
        </button>

        <div className="h-6 w-px bg-[var(--border)] mx-1" />

        <div className="flex items-center gap-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] pl-1.5 pr-3 py-1.5 rounded-full cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors">
          <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-inner">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserIcon size={14} className="text-white" />
            )}
          </div>
          <span className="text-sm font-medium text-[var(--text-primary)] hidden lg:block">
            {user?.displayName || user?.username}
          </span>
        </div>
      </div>
    </nav>
  );
}
