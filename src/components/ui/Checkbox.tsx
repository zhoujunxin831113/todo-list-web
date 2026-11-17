import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, className, ...props },
  ref,
) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={[
            'peer h-6 w-6 cursor-pointer appearance-none rounded-checkbox border-2 border-ink bg-card',
            'transition-colors duration-fast checked:border-accent checked:bg-accent',
            'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/40',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        <Check
          size={16}
          strokeWidth={3}
          aria-hidden="true"
          className="pointer-events-none absolute text-white opacity-0 transition-opacity peer-checked:opacity-100"
        />
      </span>
      {label !== undefined && (
        <label htmlFor={checkboxId} className="cursor-pointer select-none text-sm text-ink">
          {label}
        </label>
      )}
    </span>
  );
});
