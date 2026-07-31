import React, { useState, useEffect } from "react";
import { X, Search, UserMinus, UserPlus } from "lucide-react";
import api from "@/services/authService";

export default function ManageGroupModal({ isOpen, onClose, activeChat, onUpdate }) {
  const [activeTab, setActiveTab] = useState("members"); // 'members' | 'invite'
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    if (isOpen && activeTab === "invite") {
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
  }, [isOpen, activeTab]);

  if (!isOpen || !activeChat) return null;

  const handleKick = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn kick thành viên này?")) return;
    setLoadingAction(userId);
    try {
      const res = await api.delete(`/chat/groups/${activeChat._id}/kick/${userId}`);
      if (res.data.success) {
        onUpdate({
          ...activeChat,
          participants: activeChat.participants.filter(p => p._id !== userId)
        });
      }
    } catch (error) {
      console.error("Lỗi kick thành viên:", error);
      alert(error.response?.data?.message || "Lỗi kick thành viên");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleInvite = async (userId) => {
    setLoadingAction(userId);
    try {
      const res = await api.put(`/chat/groups/${activeChat._id}/invite`, { memberIds: [userId] });
      if (res.data.success) {
        onUpdate(res.data.group);
      }
    } catch (error) {
      console.error("Lỗi mời thành viên:", error);
      alert(error.response?.data?.message || "Lỗi mời thành viên");
    } finally {
      setLoadingAction(null);
    }
  };

  const renderMembers = () => {
    const allGroupUsers = [
      ...activeChat.participants.map(p => ({ ...p, status: 'joined' })),
      ...activeChat.pendingMembers.map(p => ({ ...p, status: 'pending' }))
    ];

    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mt-2">
        {allGroupUsers.map(p => {
          const isAdmin = p._id === activeChat.groupAdmin;
          return (
            <div key={p._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00a2ff] text-white rounded-full flex items-center justify-center font-bold">
                  {p.displayName?.charAt(0) || p.username?.charAt(0) || "?"}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-primary)] font-medium">
                      {p.displayName || p.username}
                    </span>
                    {p.status === 'pending' && (
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">Đang chờ</span>
                    )}
                  </div>
                  {isAdmin && <span className="text-xs text-[#00a2ff]">Admin</span>}
                </div>
              </div>
              {!isAdmin && p.status !== 'pending' && (
                <button 
                  onClick={() => handleKick(p._id)}
                  disabled={loadingAction === p._id}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition disabled:opacity-50"
                  title="Kick"
                >
                  <UserMinus size={18} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderInvite = () => {
    const existingIds = [
      ...activeChat.participants.map(p => p._id || p),
      ...activeChat.pendingMembers.map(m => m._id || m)
    ];

    const availableUsers = allUsers.filter(u => !existingIds.includes(u._id));
    const filteredUsers = availableUsers.filter(u => 
      u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="flex-1 overflow-hidden flex flex-col mt-2">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-4 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#00a2ff]/50"
          />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {filteredUsers.length === 0 ? (
             <div className="text-center text-[var(--text-secondary)] py-4 text-sm">Không có ai để mời</div>
          ) : filteredUsers.map(u => (
            <div key={u._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00a2ff] text-white rounded-full flex items-center justify-center font-bold">
                  {u.displayName?.charAt(0) || u.username?.charAt(0) || "?"}
                </div>
                <span className="text-[var(--text-primary)] font-medium">
                  {u.displayName || u.username}
                </span>
              </div>
              <button 
                onClick={() => handleInvite(u._id)}
                disabled={loadingAction === u._id}
                className="p-2 text-[#00a2ff] hover:bg-[#00a2ff]/10 rounded-full transition disabled:opacity-50"
                title="Mời"
              >
                <UserPlus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] w-full max-w-md rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Quản lý nhóm</h2>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)]">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'members' ? 'text-[#00a2ff] border-b-2 border-[#00a2ff]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            onClick={() => setActiveTab('members')}
          >
            Thành viên ({activeChat.participants.length})
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition ${activeTab === 'invite' ? 'text-[#00a2ff] border-b-2 border-[#00a2ff]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            onClick={() => setActiveTab('invite')}
          >
            Mời thêm
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          {activeTab === 'members' ? renderMembers() : renderInvite()}
        </div>
      </div>
    </div>
  );
}
