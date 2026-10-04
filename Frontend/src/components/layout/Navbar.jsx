import { Bell, Menu, MessageSquare, Search, User as UserIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { primaryNavigation } from "@/components/layout/navigation";

export default function Navbar({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(""); // Optional: clear after search or keep it
    }
  };

  return (
    <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)] px-3 transition-colors duration-200 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 md:w-64 md:flex-shrink-0">
        <button
          type="button"
          aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] md:hidden"
        >
          {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <h1
          className="truncate text-lg font-bold cursor-pointer text-[var(--accent)] sm:text-xl"
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Tim kiem bai viet, nguoi dung, chu de..."
            className="w-full bg-[var(--bg-secondary)] border-[var(--border)] h-10 pl-10 pr-4 rounded-full text-sm text-[var(--text-primary)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:border-[var(--accent)] transition-all placeholder:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 sm:gap-3 md:w-64">
        <button aria-label="Tin nhắn" className="hidden h-10 w-10 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] sm:flex">
          <MessageSquare size={20} />
        </button>
        <button aria-label="Thông báo" className="relative hidden h-10 w-10 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] sm:flex">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--danger)]" />
        </button>

        <div className="mx-1 hidden h-6 w-px bg-[var(--border)] sm:block" />

        <button
          type="button"
          aria-label="Mở hồ sơ cá nhân"
          onClick={() => navigate(`/profile/${user?.username}`)}
          className="flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] p-1.5 transition-colors hover:bg-[var(--bg-elevated)] sm:pl-1.5 sm:pr-3"
        >
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
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute left-0 right-0 top-16 border-b border-[var(--border)] bg-[var(--bg-primary)] p-3 shadow-xl md:hidden">
          <nav aria-label="Điều hướng mobile" className="space-y-1">
            {primaryNavigation.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium ${active ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"}`}
                >
                  <Icon size={19} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </nav>
  );
}
