import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Xóa", cancelText = "Hủy" }) {
  // Ngăn chặn cuộn trang khi modal mở
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalStyle; };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1C1C1E] border border-white/[0.08] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04] bg-[#252527]/50">
          <h3 className="font-mono font-bold text-lg text-white/90 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            {title}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 text-white/40 hover:text-white/90 hover:bg-white/5 rounded-full transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 text-center">
          <p className="font-mono text-[14px] text-white/70 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="p-4 border-t border-white/[0.04] bg-[#121213] flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-mono font-medium text-white/70 hover:text-white hover:bg-white/5 transition">
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-5 py-2 rounded-xl text-sm font-mono font-bold bg-red-500 hover:bg-red-600 text-white transition shadow-lg shadow-red-500/20">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
