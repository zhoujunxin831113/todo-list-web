import { Button } from './ui/Button';
import { Select, type SelectOption } from './ui/Select';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  STATUS_FILTER_OPTIONS,
} from '../constants/options';
import type { Filters } from '../types/todo';

export interface FilterBarProps {
  filters: Filters;
  canClear: boolean;
  onFilterChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
}

// 分类列表：全部 + 四个业务分类（参考图为纵向全宽按钮）
const CATEGORY_CHOICES: readonly { value: Filters['category']; label: string }[] = [
  { value: 'all', label: '全部任务' },
  ...CATEGORY_ORDER.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
];

const PRIORITY_SELECT_OPTIONS: readonly SelectOption<Filters['priority']>[] = [
  { value: 'all', label: '全部优先级' },
  ...PRIORITY_ORDER.map((value) => ({ value, label: PRIORITY_LABELS[value] })),
];

const STATUS_SELECT_OPTIONS: readonly SelectOption<Filters['status']>[] = STATUS_FILTER_OPTIONS;

export function FilterBar({ filters, canClear, onFilterChange, onClear }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="按分类筛选" className="flex flex-col gap-2">
        {CATEGORY_CHOICES.map((choice) => {
          const active = filters.category === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              aria-pressed={active}
              onClick={() => onFilterChange({ category: choice.value })}
              className={[
                'h-11 rounded-control border-2 px-3.5 text-left text-sm font-bold transition-all duration-fast',
                'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ink/40',
                active
                  ? 'border-ink bg-ink text-white shadow-primary-glow'
                  : 'border-ink bg-card text-ink hover:bg-primary-light',
              ].join(' ')}
            >
              {choice.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Select
          label="优先级"
          value={filters.priority}
          options={PRIORITY_SELECT_OPTIONS}
          onChange={(priority) => onFilterChange({ priority })}
        />
        <Select
          label="状态"
          value={filters.status}
          options={STATUS_SELECT_OPTIONS}
          onChange={(status) => onFilterChange({ status })}
        />
      </div>

      {canClear && (
        <Button variant="secondary" size="sm" className="w-full" onClick={onClear}>
          清除筛选
        </Button>
      )}
    </div>
  );
}
