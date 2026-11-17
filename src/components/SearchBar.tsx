import { useId } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (keyword: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const inputId = useId();

  return (
    <div className="relative w-full">
      {/* 参考图无可见标签，用 sr-only 保留无障碍名称（getByLabelText('搜索任务') 仍可命中） */}
      <label htmlFor={inputId} className="sr-only">
        搜索任务
      </label>
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索任务..."
        className="h-11 w-full rounded-control border-2 border-ink bg-primary-light pl-10 pr-10 text-sm text-ink placeholder:text-ink-muted/70 focus:outline-none focus:ring-3 focus:ring-ink/30"
      />
      {value !== '' && (
        <button
          type="button"
          aria-label="清除搜索"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-ink/10 hover:text-ink"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
