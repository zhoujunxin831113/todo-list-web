import { useId, useRef, type ReactNode } from 'react';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';
import { Button } from './ui/Button';

export type ConfirmTone = 'danger' | 'primary';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确定',
  cancelLabel = '取消',
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useModalFocusTrap({
    open,
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
    onEscape: onCancel,
  });

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="w-full max-w-[420px] rounded-card bg-card p-6 shadow-modal"
      >
        <h2 id={titleId} className="text-lg font-semibold text-ink">
          {title}
        </h2>
        {description !== undefined && (
          <p id={descriptionId} className="mt-2 text-sm text-ink-muted">
            {description}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
