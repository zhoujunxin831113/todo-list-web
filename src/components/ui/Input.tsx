import { forwardRef, useId, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const baseInputClasses =
  'h-11 w-full rounded-control border-2 bg-card px-3 text-sm text-ink ' +
  'placeholder:text-ink-muted/60 transition-shadow duration-fast ' +
  'focus:outline-none focus:ring-3 focus:ring-ink/30';

const stateClasses = {
  default: 'border-ink',
  error: 'border-danger ring-3 ring-danger/30',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, containerClassName, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const stateClass = error ? stateClasses.error : stateClasses.default;

  return (
    <div className={['flex w-full flex-col gap-1.5', containerClassName].filter(Boolean).join(' ')}>
      {label !== undefined && (
        <label htmlFor={inputId} className="text-sm font-bold text-ink">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error !== undefined ? 'true' : undefined}
        aria-describedby={error !== undefined ? errorId : undefined}
        className={[baseInputClasses, stateClass, className].filter(Boolean).join(' ')}
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
