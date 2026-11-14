import type { ReactNode } from 'react';
import { Button, type ButtonVariant } from './ui/Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'secondary',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-card px-6 py-12 text-center">
      {icon !== undefined && (
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-pill bg-primary-light text-primary"
        >
          {icon}
        </span>
      )}
      <p className="text-base font-medium text-ink">{title}</p>
      {description !== undefined && (
        <p className="max-w-[320px] text-sm text-ink-muted">{description}</p>
      )}
      {actionLabel !== undefined && onAction !== undefined && (
        <Button variant={actionVariant} className="mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
