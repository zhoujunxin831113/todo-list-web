import { ChevronDown, X } from 'lucide-react';
import {
  CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_FILTER_OPTIONS,
  type SelectOption,
} from '../constants/options';
import type { Filters } from '../types/todo';
import { Button } from './ui/Button';

// 三个维度均为单选，value='all' 表示不限；维度间 AND 由 lib/filter 保证。
const CATEGORY_FILTER_OPTIONS: readonly SelectOption<Filters['category']>[] = [
  { value: 'all', label: '全部分类' },
  ...CATEGORY_OPTIONS,
];

const PRIORITY_FILTER_OPTIONS: readonly SelectOption<Filters['priority']>[] = [
  { value: 'all', label: '全部优先级' },
  ...PRIORITY_OPTIONS,
];

const STATUS_FILTER_OPTIONS_ALL: readonly SelectOption<Filters['status']>[] = [
  { value: 'all', label: '全部状态' },
  ...STATUS_FILTER_OPTIONS.filter((option) => option.value !== 'all'),
];

interface FilterSelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
}

function FilterSelect<T extends string>({ label, value, options, onChange }: FilterSelectProps<T>) {
  return (
    <div className="relative shrink-0">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-11 w-full appearance-none rounded-control border border-line bg-card pl-3 pr-8 text-sm text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20"
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
  );
}

export interface FilterBarProps {
  filters: Filters;
  /** 存在任一筛选条件或关键词时展示「清除筛选」 */
  canClear: boolean;
  onFilterChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
}

export function FilterBar({ filters, canClear, onFilterChange, onClear }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto lg:overflow-visible">
      <FilterSelect
        label="按分类筛选"
        value={filters.category}
        options={CATEGORY_FILTER_OPTIONS}
        onChange={(category) => onFilterChange({ category })}
      />
      <FilterSelect
        label="按优先级筛选"
        value={filters.priority}
        options={PRIORITY_FILTER_OPTIONS}
        onChange={(priority) => onFilterChange({ priority })}
      />
      <FilterSelect
        label="按状态筛选"
        value={filters.status}
        options={STATUS_FILTER_OPTIONS_ALL}
        onChange={(status) => onFilterChange({ status })}
      />
      {canClear && (
        <Button variant="ghost" size="sm" className="shrink-0" onClick={onClear}>
          <X size={14} aria-hidden="true" />
          清除筛选
        </Button>
      )}
    </div>
  );
}
