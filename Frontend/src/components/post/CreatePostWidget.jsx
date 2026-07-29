import { ChevronRight, Image as ImageIcon, Video } from "lucide-react";

export default function CreatePostWidget({ onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#1C1C1E] border border-white/[0.04] rounded-xl p-3 flex items-center gap-3 cursor-text hover:border-white/[0.1] transition-all group"
    >
      {/* Terminal Icon */}
      <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center text-white/50 flex-shrink-0 group-hover:text-white/80 transition-colors">
        <span className="font-mono text-sm font-bold opacity-80 flex items-center">
          <ChevronRight size={14} className="-mr-1" />_
        </span>
      </div>

      {/* Input Placeholder */}
      <div className="flex-1 bg-black/40 rounded-lg border border-white/[0.02] h-10 flex items-center px-4">
        <span className="font-mono text-[13px] text-white/40">
          $ git commit -m "write a new post..."
        </span>
      </div>

      {/* Media Icons */}
      <div className="flex items-center gap-2 pr-2 text-white/40">
        <button className="p-1.5 hover:bg-white/10 rounded-md hover:text-white transition-colors" title="Thêm ảnh">
          <ImageIcon size={18} />
        </button>
        <button className="p-1.5 hover:bg-white/10 rounded-md hover:text-white transition-colors" title="Thêm video">
          <Video size={18} />
        </button>
      </div>
    </div>
  );
}
