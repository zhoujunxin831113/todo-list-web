import { ListTodo, Lock } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-control bg-primary text-white shadow-primary-glow"
        >
          <ListTodo size={20} strokeWidth={2.25} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-ink">待办事项</h1>
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
            <Lock size={14} aria-hidden="true" />
            数据仅存本机
          </p>
        </div>
      </div>
    </header>
  );
}
