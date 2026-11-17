import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  label?: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  id,
  className,
  ...rest
}: SelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label !== undefined && (
        <label htmlFor={selectId} className="text-sm font-bold text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(event) => onChange(event.target.value as T)}
          className={[
            'h-11 w-full appearance-none rounded-control border-2 border-ink bg-card pl-3 pr-9 text-sm font-medium text-ink',
            'cursor-pointer transition-shadow duration-fast focus:outline-none focus:ring-3 focus:ring-ink/30',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink"
        />
      </div>
    </div>
  );
}

export type { ReactNode };
