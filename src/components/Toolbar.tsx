import { Plus } from 'lucide-react';
import { DEFAULT_FILTERS } from '../constants/options';
import type { Filters } from '../types/todo';
import { FilterBar } from './FilterBar';
import { SearchBar } from './SearchBar';
import { Button } from './ui/Button';

export interface ToolbarProps {
  filters: Filters;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onFilterChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
  onCreate: () => void;
}

export function Toolbar({
  filters,
  keyword,
  onKeywordChange,
  onFilterChange,
  onClear,
  onCreate,
}: ToolbarProps) {
  const canClear =
    filters.category !== DEFAULT_FILTERS.category ||
    filters.priority !== DEFAULT_FILTERS.priority ||
    filters.status !== DEFAULT_FILTERS.status ||
    keyword.trim() !== '';

  return (
    <section
      aria-label="任务工具栏"
      className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center"
    >
      {/* <640 搜索独占一行；640–1024 与筛选分两行；≥1024 合并为单行 */}
      <SearchBar value={keyword} onChange={onKeywordChange} className="lg:flex-1" />
      <FilterBar
        filters={filters}
        canClear={canClear}
        onFilterChange={onFilterChange}
        onClear={onClear}
      />
      {/* <640 由右下角悬浮按钮接管（PRD 4.5） */}
      <Button className="hidden shrink-0 sm:inline-flex" onClick={onCreate}>
        <Plus size={16} aria-hidden="true" />
        新建任务
      </Button>
    </section>
  );
}
