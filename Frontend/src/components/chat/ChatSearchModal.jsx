import React, { useState, useEffect } from "react";
import { X, Search, Clock } from "lucide-react";
import { format } from "date-fns";
import api from "@/services/authService";

export default function ChatSearchModal({ isOpen, onClose, activeChat }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen || !activeChat || !searchQuery.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/chat/conversations/${activeChat._id}/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.data.success) {
          setResults(res.data.messages);
        }
      } catch (error) {
        console.error("Lỗi tìm kiếm tin nhắn:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeChat, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] w-full max-w-xl rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Tìm kiếm tin nhắn</h2>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-hidden flex flex-col gap-4">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-4 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#00a2ff]/50"
              autoFocus
            />
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {loading ? (
              <div className="text-center text-[var(--text-secondary)] py-4 text-sm">Đang tìm kiếm...</div>
            ) : searchQuery.trim() === "" ? (
              <div className="text-center text-[var(--text-secondary)] py-8 text-sm">
                <Search size={40} className="mx-auto mb-3 opacity-20" />
                Gõ gì đó để bắt đầu tìm kiếm
              </div>
            ) : results.length === 0 ? (
              <div className="text-center text-[var(--text-secondary)] py-8 text-sm">
                Không tìm thấy kết quả nào phù hợp
              </div>
            ) : (
              results.map(msg => {
                // Lấy thông tin người gửi nếu có participants
                const sender = activeChat?.participants?.find(p => (p._id || p.id) === msg.senderId);
                const senderName = sender?.displayName || sender?.username || "Người dùng";
                
                return (
                  <div 
                    key={msg._id} 
                    className="flex flex-col gap-1 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]"
                  >
                    <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span className="font-semibold text-[#00a2ff]">
                        {senderName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <div className="text-[var(--text-primary)] text-sm">
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
