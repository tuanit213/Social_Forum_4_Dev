import { Link, useLocation } from "react-router-dom";
import {
  CircleHelp,
  Home,
  MessageSquare,
  Settings,
  TrendingUp,
} from "lucide-react";

export default function LeftSidebar() {
  const location = useLocation();
  const trendingLanguages = ["JavaScript", "TypeScript", "Python", "Go", "Rust"];
  const activeLanguage = new URLSearchParams(location.search).get("language") || "";

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: MessageSquare, label: "Group Chat", path: "/group-chat" },
    { icon: CircleHelp, label: "Dev Help", path: "/help" },
    { icon: TrendingUp, label: "Trending GitHub", path: "/trending" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <aside className="w-64 h-[calc(100vh-64px)] sticky top-16 hidden md:flex flex-col py-4 px-3 overflow-y-auto custom-scrollbar border-r border-[var(--border)]">
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]" 
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-opacity ${isActive ? "opacity-100" : "opacity-75 group-hover:opacity-100"}`} />
              <span className="text-[14px] font-mono tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {location.pathname === "/trending" && (
        <div className="border-t border-[var(--border)] pt-4">
          <p className="mb-3 px-3 font-mono text-[11px] text-[var(--text-secondary)]">Popular Tags</p>
          <div className="flex flex-wrap gap-2 px-3">
            <Link
              to="/trending"
              className={`rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
                activeLanguage === ""
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All
            </Link>
            {trendingLanguages.map((language) => (
              <Link
                key={language}
                to={`/trending?language=${encodeURIComponent(language)}`}
                className={`rounded-md border px-2 py-1 font-mono text-[11px] transition-colors ${
                  activeLanguage === language
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {language}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
