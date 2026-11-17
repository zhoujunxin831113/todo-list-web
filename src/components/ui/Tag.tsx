import type { ReactNode } from 'react';

export type TagTone = 'high' | 'medium' | 'low' | 'category';

export interface TagProps {
  tone: TagTone;
  children: ReactNode;
}

const TONE_CLASSES: Record<TagTone, string> = {
  // 优先级标签：浅彩底 + 同色粗描边 + 同色文字（参考图：高=琥珀、中=蓝、低=绿）
  high: 'border-warning bg-warning/10 text-warning',
  medium: 'border-accent bg-accent/10 text-accent',
  low: 'border-success bg-success/10 text-success',
  // 分类标签：白底黑框黑字（参考图「工作 / 学习」）
  category: 'border-ink bg-card text-ink',
};

export function Tag({ tone, children }: TagProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-control border-2 px-2.5 py-0.5 text-xs font-bold',
        TONE_CLASSES[tone],
      ].join(' ')}
    >
      {children}
    </span>
  );
}
