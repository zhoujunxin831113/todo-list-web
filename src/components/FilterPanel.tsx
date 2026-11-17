import { FilterBar } from './FilterBar';
import type { Filters } from '../types/todo';

export interface FilterPanelProps {
  filters: Filters;
  canClear: boolean;
  onFilterChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
}

/** 左侧栏的分类筛选卡片：纵向分类按钮 + 优先级/状态下拉 + 清除 */
export function FilterPanel({ filters, canClear, onFilterChange, onClear }: FilterPanelProps) {
  return (
    <section
      aria-label="筛选任务"
      className="rounded-card border-2 border-ink bg-card p-5 shadow-card"
    >
      <h2 className="mb-4 text-sm font-bold text-ink-muted">分类筛选</h2>
      <FilterBar
        filters={filters}
        canClear={canClear}
        onFilterChange={onFilterChange}
        onClear={onClear}
      />
    </section>
  );
}
