import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (keyword: string) => void;
  className?: string;
}

export function SearchBar({ value, onChange, className }: SearchBarProps) {
  return (
    <div className={['relative w-full', className].filter(Boolean).join(' ')}>
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索标题或描述"
        aria-label="搜索任务"
        enterKeyHint="search"
        className="h-11 w-full rounded-control border border-line bg-card pl-10 pr-11 text-sm text-ink placeholder:text-ink-muted/70 focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20"
      />
      {value !== '' && (
        <button
          type="button"
          aria-label="清除搜索"
          onClick={() => onChange('')}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-control text-ink-muted transition-colors duration-fast hover:text-ink"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
