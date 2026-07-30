import { Bell, MessageSquare, Search, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export default function Navbar({ user }) {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full h-16 z-50 flex items-center justify-between px-6 border-b border-white/[0.04] bg-[#171718]">
      <div className="flex items-center gap-2 w-64 flex-shrink-0">
        <h1
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400 cursor-pointer"
          onClick={() => navigate("/")}
        >
          SocialForum
        </h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-xl mx-4">
        <div className="relative w-full group">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-indigo-400 transition-colors"
          />
          <Input
            placeholder="Tim kiem bai viet, nguoi dung, chu de..."
            className="w-full bg-white/[0.03] border-white/[0.05] h-10 pl-10 pr-4 rounded-full text-sm text-white focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 transition-all placeholder:text-white/20 hover:bg-white/[0.05]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 w-64 justify-end">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors relative">
          <MessageSquare size={20} />
        </button>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
        </button>

        <div className="h-6 w-px bg-white/[0.1] mx-1" />

        <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/[0.08] pl-1.5 pr-3 py-1.5 rounded-full cursor-pointer hover:bg-white/[0.08] transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-inner">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <UserIcon size={14} className="text-white" />
            )}
          </div>
          <span className="text-sm font-medium text-white/90 hidden lg:block">
            {user?.displayName || user?.username}
          </span>
        </div>
      </div>
    </nav>
  );
}
