import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface ToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ open, message, onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [open, onClose, duration]);

  if (!open) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-control border-2 border-ink bg-card px-4 py-3 text-sm font-medium text-ink shadow-elevated">
        <CheckCircle2 size={18} className="shrink-0 text-success" aria-hidden="true" />
        <span>{message}</span>
      </div>
    </div>
  );
}
