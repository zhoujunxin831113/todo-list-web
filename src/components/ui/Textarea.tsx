import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  /** 有值时转红边框并渲染行内错误提示（PRD 4.4） */
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className, containerClassName, ...props },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className={containerClassName}>
      {label !== undefined && (
        <label htmlFor={fieldId} className="mb-1 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[
          'min-h-[96px] w-full rounded-control border bg-card px-3 py-2 text-sm text-ink',
          'placeholder:text-ink-muted/70 focus:outline-none focus:ring-[3px]',
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
