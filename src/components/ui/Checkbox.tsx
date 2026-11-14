import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** 可见文案；列表行可省略，但此时必须传 aria-label 说明用途 */
  label?: ReactNode;
  labelClassName?: string;
}

// 原生 checkbox + label（TECH_DESIGN 4-6）：整块命中区 ≥ 44×44px，可点击 label 触发切换
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, labelClassName, className, ...props },
  ref,
) {
  return (
    <label
      className={[
        'inline-flex min-h-touch min-w-touch cursor-pointer items-center gap-2',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <input
        ref={ref}
        type="checkbox"
        className="h-5 w-5 shrink-0 cursor-pointer rounded-checkbox border border-line accent-primary"
        {...props}
      />
      {label !== undefined && (
        <span className={['text-sm text-ink', labelClassName].filter(Boolean).join(' ')}>
          {label}
        </span>
      )}
    </label>
  );
});
