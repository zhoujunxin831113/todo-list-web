import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'sm' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // 主按钮：主色白字 + 光晕（PRD 4.4）
  primary: 'bg-primary text-white shadow-primary-glow hover:bg-primary-hover',
  secondary: 'border border-line bg-card text-ink hover:bg-page',
  danger: 'bg-danger text-white hover:bg-danger/90',
  ghost: 'text-ink-muted hover:bg-line/60',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  // 视觉高 40px（PRD 4.4）；before 伪元素把命中区上下各扩 2px，合计 44px 触控目标
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
        'relative inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-medium',
        'transition-colors duration-fast disabled:cursor-not-allowed disabled:opacity-50',
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
