import { forwardRef, useId, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** 有值时输入框转红边框，并渲染行内错误提示（PRD 4.4） */
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className, containerClassName, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className={containerClassName}>
      {label !== undefined && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[
          'h-11 w-full rounded-control border bg-card px-3 text-base text-ink',
          'placeholder:text-ink-muted/70 transition-colors duration-fast',
          // 聚焦：主色边框 + 3px 浅蓝外环（PRD 4.4）
          'focus:outline-none focus:ring-[3px]',
          error
            ? 'border-danger focus:border-danger focus:ring-danger/20'
            : 'border-line focus:border-primary focus:ring-primary/20',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error !== undefined && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
