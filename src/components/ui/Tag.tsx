import type { ReactNode } from 'react';

export type TagTone = 'high' | 'medium' | 'low' | 'category';

export interface TagProps {
  tone: TagTone;
  children: ReactNode;
  className?: string;
}

// 胶囊标签：浅底深字（PRD 4.2 语义色），圆角 9999
const TONE_CLASSES: Record<TagTone, string> = {
  high: 'bg-danger/10 text-danger',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-success/10 text-success',
  category: 'bg-primary-light text-primary',
};

export function Tag({ tone, children, className }: TagProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-pill px-2 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  );
}
