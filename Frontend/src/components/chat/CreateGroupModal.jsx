import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import api from "@/services/authService";

export default function CreateGroupModal({ isOpen, onClose, onSuccess }) {
  const [groupName, setGroupName] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleToggleUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      alert("Vui lòng nhập tên nhóm!");
      return;
    }
    if (selectedUsers.length === 0) {
      alert("Vui lòng chọn ít nhất 1 thành viên!");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/chat/groups", {
        groupName: groupName.trim(),
        memberIds: selectedUsers
      });
      if (res.data.success) {
        onSuccess(res.data.group);
        onClose();
        setGroupName("");
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error("Lỗi tạo nhóm:", error);
      alert("Lỗi tạo nhóm");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] w-full max-w-md rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Tạo nhóm mới</h2>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-hidden flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tên nhóm</label>
            <input 
              type="text" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nhập tên nhóm..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[#00a2ff]/50"
            />
          </div>

          <div className="flex flex-col flex-1 overflow-hidden">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Thêm thành viên</label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bạn bè..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-4 text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#00a2ff]/50"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {filteredUsers.map(u => {
                const isSelected = selectedUsers.includes(u._id);
                return (
                  <div 
                    key={u._id} 
                    onClick={() => handleToggleUser(u._id)}
                    className="flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-[var(--bg-secondary)] transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#00a2ff] text-white rounded-full flex items-center justify-center font-bold">
                        {u.displayName?.charAt(0) || u.username?.charAt(0) || "?"}
                      </div>
                      <span className="text-[var(--text-primary)] font-medium">{u.displayName || u.username}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-[#00a2ff] border-[#00a2ff]' : 'border-[var(--text-secondary)]'}`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--bg-secondary)]/50 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 rounded-xl font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition">
            Hủy
          </button>
          <button 
            onClick={handleCreate}
            disabled={loading}
            className={`px-5 py-2 text-white rounded-xl font-medium transition ${(!groupName.trim() || selectedUsers.length === 0) ? 'bg-[#00a2ff]/50' : 'bg-[#00a2ff] hover:bg-[#0088cc]'}`}
          >
            {loading ? "Đang tạo..." : "Tạo nhóm"}
          </button>
        </div>
      </div>
    </div>
  );
}
