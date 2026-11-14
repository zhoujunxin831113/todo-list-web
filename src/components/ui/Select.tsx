import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import type { SelectOption } from '../../constants/options';

export interface SelectProps<T extends string> {
  label?: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  containerClassName?: string;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
  containerClassName,
}: SelectProps<T>) {
  const id = useId();

  return (
    <div className={containerClassName}>
      {label !== undefined && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className={[
            'h-11 w-full appearance-none rounded-control border border-line bg-card pl-3 pr-8 text-sm text-ink',
            'focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted"
        />
      </div>
    </div>
  );
}
