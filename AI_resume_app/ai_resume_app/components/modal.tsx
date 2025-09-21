import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        aria-label="关闭弹窗"
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={handleKeyDown}
      />
      {/* 弹窗内容 */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6">
        {title && (
          <div className="font-semibold text-lg mb-4 text-zinc-800 dark:text-zinc-100 flex justify-between items-center">
            <span>{title}</span>
            <button
              aria-label="关闭弹窗"
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xl"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}
