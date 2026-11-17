import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'sm' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // 主按钮：墨黑底白字 + 硬偏移投影（参考图「+ 添加」）
  primary: 'border-2 border-ink bg-ink text-white shadow-primary-glow hover:bg-primary-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
  // 次按钮：白底黑框硬阴影（参考图「清除」）
  secondary:
    'border-2 border-ink bg-card text-ink shadow-primary-glow hover:bg-page active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
  danger:
    'border-2 border-ink bg-danger text-white shadow-primary-glow hover:brightness-95 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
  ghost: 'text-ink-muted hover:bg-ink/10',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  // 视觉高 40px；before 伪元素把命中区上下各扩 2px，合计 44px 触控目标
  md: 'h-10 px-4 text-sm before:-inset-y-0.5',
  // 视觉高 36px；上下各扩 4px，同样满足 ≥44px
  sm: 'h-9 px-3 text-sm before:-inset-y-1',
  // 图标按钮直接 44×44，调用方须提供 aria-label 带名称
  icon: 'h-11 w-11 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[
        'relative inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-bold',
        'transition-all duration-fast disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0',
        'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ink/40',
        'before:absolute before:inset-x-0 before:content-[""]',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
});
