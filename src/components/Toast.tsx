import { useEffect } from 'react';

export type ToastTone = 'info' | 'success' | 'danger';

export interface ToastProps {
  open: boolean;
  message: string;
  tone?: ToastTone;
  /** 2–3s 自动消失（PRD 4.4），默认 2500ms */
  duration?: number;
  onClose: () => void;
}

const DOT_CLASSES: Record<ToastTone, string> = {
  info: 'bg-primary',
  success: 'bg-success',
  danger: 'bg-danger',
};

export function Toast({ open, message, tone = 'info', duration = 2500, onClose }: ToastProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 rounded-card bg-ink px-4 py-2 text-sm text-white shadow-modal mb-[var(--safe-area-bottom)]"
    >
      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-pill ${DOT_CLASSES[tone]}`} />
      <span>{message}</span>
    </div>
  );
}
