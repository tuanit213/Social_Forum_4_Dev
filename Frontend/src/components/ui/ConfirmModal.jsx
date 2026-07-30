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
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-primary)]">
          <h3 className="font-mono font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="text-[var(--danger)]" size={20} />
            {title}
          </h3>
          <button type="button" onClick={onClose} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-full transition">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 text-center">
          <p className="font-mono text-[14px] text-[var(--text-secondary)] leading-relaxed">
            {message}
          </p>
        </div>
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-primary)] flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-mono font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition">
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-5 py-2 rounded-xl text-sm font-mono font-bold bg-[var(--danger)] text-white transition hover:brightness-110">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
