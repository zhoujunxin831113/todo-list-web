import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const baseTextareaClasses =
  'min-h-[96px] w-full resize-y rounded-control border-2 bg-card px-3 py-2 text-sm text-ink ' +
  'placeholder:text-ink-muted/60 transition-shadow duration-fast ' +
  'focus:outline-none focus:ring-3 focus:ring-ink/30';

const stateClasses = {
  default: 'border-ink',
  error: 'border-danger ring-3 ring-danger/30',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;
  const stateClass = error ? stateClasses.error : stateClasses.default;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label !== undefined && (
        <label htmlFor={textareaId} className="text-sm font-bold text-ink">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={error !== undefined}
        aria-describedby={error !== undefined ? errorId : undefined}
        className={[baseTextareaClasses, stateClass, className].filter(Boolean).join(' ')}
        {...props}
      />
      {error !== undefined && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
