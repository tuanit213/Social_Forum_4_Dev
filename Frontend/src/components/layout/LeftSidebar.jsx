import { Link, useLocation } from "react-router-dom";

// Import SVGs
import HomeIcon from "@/assets/icon/Home.svg";
import GroupChatIcon from "@/assets/icon/Message.svg";
import BattleCodeIcon from "@/assets/icon/Battle.svg";
import DevCompaniesIcon from "@/assets/icon/Companies.svg";
import LearnIcon from "@/assets/icon/Learn.svg";
import DevChallengesIcon from "@/assets/icon/Cup.svg";
import DevHelpIcon from "@/assets/icon/Question.svg";
import TrendingGithubIcon from "@/assets/icon/Trending.svg";
import SettingsIcon from "@/assets/icon/Setting.svg";

export default function LeftSidebar() {
  const location = useLocation();

  const navItems = [
    { icon: HomeIcon, label: "Home", path: "/" },
    { icon: GroupChatIcon, label: "Group Chat", path: "/group-chat" },
    { icon: BattleCodeIcon, label: "Battle Code", path: "/battle-code" },
    { icon: DevCompaniesIcon, label: "Dev Companies", path: "/companies" },
    { icon: LearnIcon, label: "Learn", path: "/learn" },
    { icon: DevChallengesIcon, label: "Dev Challenges", path: "/challenges" },
    { icon: DevHelpIcon, label: "Dev Help", path: "/help" },
    { icon: TrendingGithubIcon, label: "Trending GitHub", path: "/trending" },
    { icon: SettingsIcon, label: "Settings", path: "/settings" },
  ];

  return (
    <aside className="w-64 h-[calc(100vh-64px)] sticky top-16 hidden md:flex flex-col py-4 px-3 overflow-y-auto custom-scrollbar border-r border-white/[0.04]">
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? "bg-[#2C2C2E] text-white" 
                  : "text-[#CCCCCC] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <img 
                src={item.icon} 
                alt={item.label} 
                className={`w-5 h-5 transition-opacity ${isActive ? "opacity-100 brightness-150" : "opacity-80 group-hover:opacity-100"}`} 
              />
              <span className="text-[14px] font-mono tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
