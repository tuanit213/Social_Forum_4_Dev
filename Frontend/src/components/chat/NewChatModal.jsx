import React, { useState, useEffect } from "react";
import { X, Search, MessageCircle } from "lucide-react";
import api from "@/services/authService";

export default function NewChatModal({ isOpen, onClose, onSuccess }) {
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const res = await api.get("/users");
          if (res.data.success) {
            setAllUsers(res.data.users);
          }
        } catch (error) {
          console.error("Lỗi lấy danh sách user:", error);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartChat = async (userId) => {
    setLoadingAction(userId);
    try {
      const res = await api.post("/chat/conversations", { receiverId: userId });
      if (res.data.success) {
        onSuccess(res.data.conversation);
        onClose();
      }
    } catch (error) {
      console.error("Lỗi tạo đoạn chat:", error);
      alert("Lỗi kết nối");
    } finally {
      setLoadingAction(null);
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] w-full max-w-md rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Nhắn tin mới</h2>
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
              placeholder="Tìm kiếm người dùng..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-4 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#00a2ff]/50"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-[var(--text-secondary)] py-4 text-sm">Không tìm thấy người dùng</div>
            ) : filteredUsers.map(u => (
              <div 
                key={u._id} 
                onClick={() => handleStartChat(u._id)}
                className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-[var(--bg-secondary)] transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#00a2ff] text-white rounded-full flex items-center justify-center font-bold">
                    {u.displayName?.charAt(0) || u.username?.charAt(0) || "?"}
                  </div>
                  <span className="text-[var(--text-primary)] font-medium">{u.displayName || u.username}</span>
                </div>
                <button 
                  disabled={loadingAction === u._id}
                  className="p-2 text-[#00a2ff] hover:bg-[#00a2ff]/10 rounded-full transition disabled:opacity-50"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
