import { ChevronRight, Image as ImageIcon, Video } from "lucide-react";

export default function CreatePostWidget({ onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-3 flex items-center gap-3 cursor-text hover:border-[var(--accent)] transition-all group"
    >
      {/* Terminal Icon */}
      <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0 group-hover:text-[var(--text-primary)] transition-colors">
        <span className="font-mono text-sm font-bold opacity-80 flex items-center">
          <ChevronRight size={14} className="-mr-1" />_
        </span>
      </div>

      {/* Input Placeholder */}
      <div className="flex-1 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)] h-10 flex items-center px-4">
        <span className="font-mono text-[13px] text-[var(--text-secondary)]">
          $ git commit -m "write a new post..."
        </span>
      </div>

      {/* Media Icons */}
      <div className="flex items-center gap-2 pr-2 text-[var(--text-secondary)]">
        <button className="p-1.5 hover:bg-[var(--bg-elevated)] rounded-md hover:text-[var(--text-primary)] transition-colors" title="Thêm ảnh">
          <ImageIcon size={18} />
        </button>
        <button className="p-1.5 hover:bg-[var(--bg-elevated)] rounded-md hover:text-[var(--text-primary)] transition-colors" title="Thêm video">
          <Video size={18} />
        </button>
      </div>
    </div>
  );
}
