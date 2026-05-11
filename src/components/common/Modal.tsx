import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/70 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-sm bg-[#1a1f35] rounded-2xl p-6 flex flex-col gap-4 border border-white/10 animate-slide-up">
        {children}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
}

export function ConfirmModal({
  open, title, message, confirmText = 'Да', cancelText = 'Отмена',
  confirmColor = '#dc2626', onConfirm, onCancel, icon,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="flex flex-col items-center gap-3 text-center">
        {icon}
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 h-11 rounded-xl border border-white/15 text-gray-400 font-medium text-sm hover:bg-white/5 transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 h-11 rounded-xl text-white font-semibold text-sm transition-colors"
          style={{ background: confirmColor }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
