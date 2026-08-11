import React, { useState, useEffect, useRef, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Search, Send, Image as ImageIcon, Smile, MoreVertical, MessageCircle, Plus, Users, Settings, Check, X, Edit, Trash2 } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import api from "@/services/authService";
import { useSocket } from "@/contexts/SocketContext";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import ManageGroupModal from "@/components/chat/ManageGroupModal";
import NewChatModal from "@/components/chat/NewChatModal";
import ChatSearchModal from "@/components/chat/ChatSearchModal";
import EmojiPicker from "emoji-picker-react";

export default function GroupChat() {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const socket = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [blockedUsers, setBlockedUsers] = useState(user.blockedUsers || []);

  useEffect(() => {
    if (user?.blockedUsers) {
      setBlockedUsers(user.blockedUsers);
    }
  }, [user?.blockedUsers]);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // 1. Lấy danh sách hội thoại
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/chat/conversations");
        if (res.data.success) {
          setConversations(res.data.conversations);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách chat:", error);
      }
    };
    fetchConversations();
  }, []);

  // 2. Lấy tin nhắn khi chọn hội thoại
  const fetchMessages = useCallback(async (conversationId, pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const res = await api.get(`/chat/conversations/${conversationId}/messages?page=${pageNum}&limit=20`);
      if (res.data.success) {
        const fetchedMsgs = res.data.messages.reverse();
        setMessages(prev => append ? [...fetchedMsgs, ...prev] : fetchedMsgs);
        setHasMore(res.data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Lỗi lấy tin nhắn:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat._id, 1, false);
      // Khi vừa click vào chat mới, scroll xuống cuối
      setTimeout(() => scrollToBottom(), 100);
      
      // Đánh dấu đã đọc
      socket?.emit("read_conversation", activeChat._id);
      
      // Xóa số lượng unread locally
      setConversations(prev => prev.map(c => {
        if (c._id === activeChat._id && c.unreadCounts) {
          const newC = { ...c };
          newC.unreadCounts = { ...newC.unreadCounts, [user._id || user.id]: 0 };
          return newC;
        }
        return c;
      }));
    }
  }, [activeChat, fetchMessages, socket, user._id, user.id]);

  // 3. Nhận tin nhắn từ Socket
  useEffect(() => {
    if (!socket) return;
    
    const handleReceiveMessage = (msg) => {
      if (activeChat && msg.conversationId === activeChat._id) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => scrollToBottom(), 50);
      }
      
      // Update sidebar lastMessage
      setConversations(prevConvos => {
        const newConvos = [...prevConvos];
        const index = newConvos.findIndex(c => c._id === msg.conversationId);
        if (index !== -1) {
          newConvos[index].lastMessage = msg;
          newConvos[index].updatedAt = new Date().toISOString();
          
          if (!activeChat || activeChat._id !== msg.conversationId) {
            newConvos[index].unreadCounts = {
              ...newConvos[index].unreadCounts,
              [user._id || user.id]: (newConvos[index].unreadCounts?.[user._id || user.id] || 0) + 1
            };
          } else {
             socket?.emit("read_conversation", activeChat._id);
          }
          
          // Mang lên đầu
          const [movedItem] = newConvos.splice(index, 1);
          newConvos.unshift(movedItem);
        }
        return newConvos;
      });
    };

    socket.on("receive_message", handleReceiveMessage);

    const handleEditMessage = (updatedMsg) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
      // Update sidebar if it's the last message
      setConversations(prev => prev.map(c => {
        if (c.lastMessage?._id === updatedMsg._id) {
          return { ...c, lastMessage: updatedMsg };
        }
        return c;
      }));
    };
    socket.on("edit_message", handleEditMessage);

    const handleDeleteMessage = (deletedMsg) => {
      setMessages(prev => prev.map(m => m._id === deletedMsg._id ? deletedMsg : m));
      setConversations(prev => prev.map(c => {
        if (c.lastMessage?._id === deletedMsg._id) {
          return { ...c, lastMessage: deletedMsg };
        }
        return c;
      }));
    };
    socket.on("delete_message", handleDeleteMessage);
    
    const handleReceiveError = (err) => {
      alert(err.message || "Không thể gửi tin nhắn.");
    };
    socket.on("receive_error", handleReceiveError);
    
    const handleNewGroup = (group) => {
      setConversations(prev => {
        const exists = prev.find(c => c._id === group._id);
        if (exists) return prev;
        return [group, ...prev];
      });
    };
    socket.on("new_group", handleNewGroup);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("new_group", handleNewGroup);
      socket.off("edit_message", handleEditMessage);
      socket.off("delete_message", handleDeleteMessage);
      socket.off("receive_error", handleReceiveError);
    };
  }, [socket, activeChat, user._id, user.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 4. Xử lý cuộn để tải thêm tin nhắn
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMore && !loading && activeChat) {
      // Lưu lại chiều cao hiện tại để giữ vị trí cuộn
      const oldScrollHeight = e.target.scrollHeight;
      
      fetchMessages(activeChat._id, page + 1, true).then(() => {
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - oldScrollHeight;
          }
        }, 0);
      });
    }
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChat || !socket) return;

    const receiver = activeChat.participants.find(p => p._id !== (user._id || user.id));
    
    const msgData = {
      conversationId: activeChat._id,
      senderId: (user._id || user.id),
      receiverId: receiver?._id,
      content: newMessage,
    };

    socket.emit("send_message", msgData);
    
    setNewMessage("");
    setShowEmojiPicker(false);
  };

  const handleEditSubmit = async (msgId) => {
    if (!editContent.trim()) return;
    try {
      const res = await api.put(`/chat/messages/${msgId}`, { content: editContent });
      if (res.data.success) {
        setEditingMessageId(null);
        setEditContent("");
      }
    } catch (err) {
      console.error("Lỗi sửa tin nhắn", err);
    }
  };

  const handleDeleteMsg = async (msgId) => {
    if (!window.confirm("Bạn có chắc chắn muốn thu hồi tin nhắn này?")) return;
    try {
      await api.delete(`/chat/messages/${msgId}`);
    } catch (err) {
      console.error("Lỗi thu hồi tin nhắn", err);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn rời khỏi nhóm chat này?")) return;
    try {
      const res = await api.put(`/chat/groups/${activeChat._id}/leave`);
      if (res.data.success) {
        setConversations(prev => prev.filter(c => c._id !== activeChat._id));
        setActiveChat(null);
      }
    } catch (error) {
      console.error("Lỗi rời nhóm:", error);
      alert(error.response?.data?.message || "Lỗi rời nhóm");
    }
  };

  const handleHideConversation = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa/ẩn cuộc trò chuyện này? (Sẽ hiện lại nếu có tin nhắn mới)")) return;
    try {
      const res = await api.delete(`/chat/conversations/${activeChat._id}/hide`);
      if (res.data.success) {
        setConversations(prev => prev.filter(c => c._id !== activeChat._id));
        setActiveChat(null);
      }
    } catch (error) {
      console.error("Lỗi ẩn cuộc trò chuyện:", error);
      alert(error.response?.data?.message || "Lỗi ẩn cuộc trò chuyện");
    }
  };

  const handleToggleBlock = async () => {
    if (!activeChat || activeChat.isGroup) return;
    const partner = activeChat.participants.find(p => String(p._id || p.id) !== String(user._id || user.id));
    if (!partner) return;
    
    const partnerId = partner._id || partner.id;
    const isCurrentlyBlocked = blockedUsers.includes(partnerId);

    const action = isCurrentlyBlocked ? "Bỏ chặn" : "Chặn";
    if (!window.confirm(`Bạn có chắc chắn muốn ${action.toLowerCase()} người dùng này?`)) return;

    try {
      // api route corresponds to Backend/routes/userRoute.js which is mapped at /api/users
      const res = await api.put(`/users/${partnerId}/block`);
      if (res.data.success) {
        if (res.data.isBlocked) {
          setBlockedUsers(prev => [...prev, partnerId]);
        } else {
          setBlockedUsers(prev => prev.filter(id => id !== partnerId));
        }
      }
    } catch (error) {
      console.error(`Lỗi ${action.toLowerCase()} người dùng:`, error);
      alert(error.response?.data?.message || `Lỗi ${action.toLowerCase()} người dùng`);
    }
  };

  const handleViewProfile = () => {
    if (!activeChat || activeChat.isGroup) return;
    
    const currentUserId = String(user?._id || user?.id);
    const partner = activeChat.participants.find(p => {
      const pId = String(p?._id || p?.id);
      return pId !== currentUserId;
    });

    if (partner && (partner.username || partner.Username)) {
      const uName = partner.username || partner.Username;
      navigate(`/profile/${uName}`);
    } else {
      alert("Lỗi: Không tìm thấy thông tin username của người này.");
    }
  };

  return (
    <div className="w-full flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar: Danh sách chat */}
      <div className="w-[30%] min-w-[280px] border-r border-[var(--border)] bg-[#171718] flex flex-col">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Messages</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowNewChatModal(true)}
                className="p-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full hover:bg-[var(--bg-secondary)]/80 hover:text-[var(--text-primary)] transition"
                title="Nhắn tin mới"
              >
                <MessageCircle size={20} />
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="p-2 bg-[#00a2ff]/10 text-[#00a2ff] rounded-full hover:bg-[#00a2ff]/20 transition"
                title="Tạo nhóm"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <input 
              type="text"
              placeholder="Tìm kiếm người nhắn..."
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-[#00a2ff]/50 text-[var(--text-primary)] text-sm"
            />
          </div>
        </div>
        
        <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
          {conversations.map((convo) => {
            const isSelected = activeChat?._id === convo._id;
            const isGroup = convo.isGroup;
            
            // Nếu là nhóm và mình chưa join (tức là nằm trong pendingMembers)
            const isPending = isGroup && convo.pendingMembers?.some(m => m._id === (user._id || user.id) || m === (user._id || user.id));
            
            let displayName = "Nhóm chat";
            let displayInitial = "?";
            
            if (isGroup) {
              displayName = convo.groupName || "Nhóm";
              displayInitial = displayName.charAt(0);
            } else {
              const partner = convo.participants.find(p => p._id !== (user._id || user.id)) || convo.participants[0];
              displayName = partner?.displayName || partner?.username || "Người dùng";
              displayInitial = displayName.charAt(0);
            }

            const unreadCount = convo.unreadCounts?.[user._id || user.id] || 0;
            const hasUnread = unreadCount > 0 && !isSelected;

            return (
              <div 
                key={convo._id}
                onClick={() => !isPending && setActiveChat(convo)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mb-1 border-2
                  ${isSelected ? "bg-[#00a2ff]/10 border-transparent" : "hover:bg-[var(--bg-secondary)]"}
                  ${hasUnread ? "border-[#00a2ff] shadow-sm shadow-[#00a2ff]/20" : "border-transparent"}
                  ${isPending ? "opacity-80" : ""}
                `}
              >
                <div className="w-12 h-12 rounded-full bg-[#00a2ff] flex items-center justify-center font-bold text-white text-lg shrink-0">
                  {isGroup ? <Users size={20} /> : displayInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[var(--text-primary)] truncate">{displayName}</h4>
                    {isPending && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">Lời mời</span>}
                  </div>
                  
                  {isPending ? (
                    <div className="flex items-center gap-2 mt-1">
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const res = await api.put(`/chat/groups/${convo._id}/accept`);
                            if(res.data.success) {
                              setConversations(prev => prev.map(c => c._id === convo._id ? res.data.group : c));
                            }
                          } catch (e) { alert("Lỗi"); }
                        }}
                        className="text-xs bg-[#00a2ff] text-white px-3 py-1 rounded-md"
                      >
                        Tham gia
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await api.put(`/chat/groups/${convo._id}/reject`);
                            setConversations(prev => prev.filter(c => c._id !== convo._id));
                          } catch (e) { alert("Lỗi"); }
                        }}
                        className="text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-3 py-1 rounded-md"
                      >
                        Từ chối
                      </button>
                    </div>
                  ) : (
                    <p className={`text-sm truncate ${isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                      {convo.lastMessage ? convo.lastMessage.content : "Bắt đầu cuộc trò chuyện"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Panel: Khung Chat */}
      <div className="flex-1 flex flex-col bg-[#1E1E1E]">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-[var(--border)] flex items-center justify-between px-6 bg-[#1E1E1E]">
              <div 
                className={`flex items-center gap-3 ${!activeChat.isGroup ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={() => { if (!activeChat.isGroup) handleViewProfile(); }}
                title={!activeChat.isGroup ? "Xem hồ sơ" : ""}
              >
                <div className="w-10 h-10 rounded-full bg-[#00a2ff] flex items-center justify-center font-bold text-white text-lg">
                  {activeChat.isGroup ? <Users size={20} /> : (activeChat.participants.find(p => String(p._id || p.id) !== String(user._id || user.id))?.displayName?.charAt(0) || "?")}
                </div>
                <div>
                  <h3 className="font-bold text-[var(--text-primary)]">
                    {activeChat.isGroup ? activeChat.groupName : (activeChat.participants.find(p => String(p._id || p.id) !== String(user._id || user.id))?.displayName || "Người dùng")}
                  </h3>
                  <p className="text-xs text-green-500">
                    {activeChat.isGroup ? `${activeChat.participants.length} thành viên` : "Đang hoạt động"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSearchModal(true)}
                  className="p-2 text-[var(--text-secondary)] hover:text-[#00a2ff] hover:bg-[#00a2ff]/10 rounded-full transition"
                  title="Tìm kiếm tin nhắn"
                >
                  <Search size={20} />
                </button>

                {activeChat.isGroup && activeChat.groupAdmin === (user._id || user.id) && (
                  <button 
                    onClick={() => setShowManageModal(true)}
                    className="p-2 text-[var(--text-secondary)] hover:text-[#00a2ff] hover:bg-[#00a2ff]/10 rounded-full transition"
                    title="Quản lý nhóm"
                  >
                    <Settings size={20} />
                  </button>
                )}
                
                <div className="relative">
                  <button 
                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                    className="p-2 text-[var(--text-secondary)] hover:text-[#00a2ff] hover:bg-[#00a2ff]/10 rounded-full transition"
                    title="Tùy chọn"
                  >
                    <MoreVertical size={20} />
                  </button>

                  {showOptionsMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowOptionsMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] shadow-xl z-50 overflow-hidden">
                        {activeChat.isGroup ? (
                          <>
                            <button 
                              onClick={() => { setShowManageModal(true); setShowOptionsMenu(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[#00a2ff]/10 transition"
                            >
                              Xem thông tin nhóm
                            </button>
                            <button 
                              onClick={() => { handleLeaveGroup(); setShowOptionsMenu(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition border-t border-[var(--border)]"
                            >
                              Rời nhóm
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => { handleViewProfile(); setShowOptionsMenu(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[#00a2ff]/10 transition"
                            >
                              Xem hồ sơ
                            </button>
                            <button 
                              onClick={() => { handleHideConversation(); setShowOptionsMenu(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-primary)] transition border-t border-[var(--border)]"
                            >
                              Xóa cuộc trò chuyện
                            </button>
                            <button 
                              onClick={() => { handleToggleBlock(); setShowOptionsMenu(false); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition border-t border-[var(--border)]"
                            >
                              {activeChat.participants.find(p => String(p._id || p.id) !== String(user._id || user.id)) && blockedUsers.includes(activeChat.participants.find(p => String(p._id || p.id) !== String(user._id || user.id))._id || activeChat.participants.find(p => String(p._id || p.id) !== String(user._id || user.id)).id) 
                                ? "Bỏ chặn người dùng" 
                                : "Chặn người dùng"}
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              onScroll={handleScroll}
              className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar"
            >
              {loading && page === 1 && (
                <div className="text-center text-[var(--text-secondary)] py-4 text-sm">Đang tải tin nhắn...</div>
              )}
              
              {hasMore && !loading && (
                <div className="text-center text-[#00a2ff] py-2 text-xs">Cuộn lên để xem cũ hơn</div>
              )}

              {messages.map((msg, idx) => {
                const senderIdStr = typeof msg.senderId === 'object' && msg.senderId !== null 
                  ? String(msg.senderId._id || msg.senderId.id) 
                  : String(msg.senderId);
                const isMine = senderIdStr === String(user._id || user.id);
                let showTimestamp = false;
                
                if (idx === 0) {
                  showTimestamp = true;
                } else {
                  const prevMsg = messages[idx - 1];
                  const diff = differenceInMinutes(new Date(msg.createdAt), new Date(prevMsg.createdAt));
                  if (diff > 15) {
                    showTimestamp = true;
                  }
                }

                return (
                  <React.Fragment key={msg._id}>
                    {showTimestamp && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full">
                          {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                    )}
                    <div className={`flex flex-col group ${isMine ? "items-end" : "items-start"}`}>
                      {editingMessageId === msg._id ? (
                        <div className="flex flex-col gap-2 bg-[var(--bg-secondary)] p-3 rounded-xl w-full max-w-[70%] border border-[var(--border)]">
                          <input 
                            type="text" 
                            className="w-full bg-transparent border-b border-[#00a2ff]/50 outline-none text-[var(--text-primary)] text-sm py-1"
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleEditSubmit(msg._id);
                              if (e.key === 'Escape') setEditingMessageId(null);
                            }}
                          />
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <button onClick={() => setEditingMessageId(null)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Hủy</button>
                            <button onClick={() => handleEditSubmit(msg._id)} className="text-xs bg-[#00a2ff] text-white px-3 py-1 rounded-md">Lưu</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 max-w-[70%]">
                          {isMine && !msg.isDeleted && (
                            <div className="flex items-center gap-1 transition-opacity opacity-0 group-hover:opacity-100 shrink-0">
                              <button 
                                onClick={() => {
                                  setEditingMessageId(msg._id);
                                  setEditContent(msg.content);
                                }}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-[#00a2ff] hover:bg-[#00a2ff]/10 rounded-full transition"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteMsg(msg._id)}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                          <div 
                            style={{ fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace", wordBreak: "break-word" }}
                            className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                              isMine 
                              ? "bg-gradient-to-br from-[#c32fec] to-[#6366f1] text-white rounded-br-sm" 
                              : "bg-[#252527] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border)]"
                            } ${msg.isDeleted ? "italic opacity-60" : ""}`}
                          >
                            {msg.content}
                            {msg.isEdited && !msg.isDeleted && <span className="text-[10px] ml-2 opacity-70">(đã chỉnh sửa)</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-[#1E1E1E] border-t border-[var(--border)]">
              {activeChat && !activeChat.isGroup && activeChat.participants.find(p => String(p._id || p.id) !== String(user._id || user.id)) && blockedUsers.includes(activeChat.participants.find(p => String(p._id || p.id) !== String(user._id || user.id))._id || activeChat.participants.find(p => String(p._id || p.id) !== String(user._id || user.id)).id) ? (
                <div className="text-center p-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl text-[var(--text-secondary)] text-sm">
                  Bạn đã chặn người dùng này. Hãy bỏ chặn để tiếp tục gửi tin nhắn.
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <div className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-2 flex items-center gap-2 focus-within:border-[#00a2ff]/50 transition-colors relative">
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(prev => !prev)}
                      className="p-2 text-[var(--text-secondary)] hover:text-[#00a2ff] hover:bg-[#00a2ff]/10 rounded-full transition"
                    >
                      <Smile size={20} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute left-0 z-50 mb-2 bottom-full">
                        <EmojiPicker 
                          onEmojiClick={(emojiObject) => {
                            setNewMessage(prev => prev + emojiObject.emoji);
                          }}
                        />
                      </div>
                    )}
                    <button type="button" className="p-2 text-[var(--text-secondary)] hover:text-[#00a2ff] hover:bg-[#00a2ff]/10 rounded-full transition">
                      <ImageIcon size={20} />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] text-sm py-2 px-1"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3.5 bg-[#00a2ff] text-white rounded-2xl hover:bg-[#0088cc] transition-colors disabled:opacity-50 disabled:bg-white/10 shrink-0"
                  >
                    <Send size={20} />
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-secondary)] space-y-4">
            <div className="w-24 h-24 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border border-[var(--border)]">
              <MessageCircle size={40} className="text-[#00a2ff]/50" />
            </div>
            <p className="text-lg">Chọn một cuộc hội thoại để bắt đầu</p>
          </div>
        )}
      </div>

      <CreateGroupModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newGroup) => {
          setConversations(prev => [newGroup, ...prev]);
          setActiveChat(newGroup);
        }}
      />
      
      <ManageGroupModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        activeChat={activeChat}
        onUpdate={(updatedGroup) => {
          setActiveChat(updatedGroup);
          setConversations(prev => prev.map(c => c._id === updatedGroup._id ? updatedGroup : c));
        }}
      />
      
      <NewChatModal 
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onSuccess={(newChat) => {
          setConversations(prev => {
            const exists = prev.find(c => c._id === newChat._id);
            if (exists) return prev;
            return [newChat, ...prev];
          });
          setActiveChat(newChat);
        }}
      />
      
      <ChatSearchModal 
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        activeChat={activeChat}
      />
    </div>
  );
}
