export function Header() {
  return (
    <header className="border-b-2 border-ink pb-4">
      <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">我的待办清单</h1>
      <p className="mt-1.5 font-mono text-xs tracking-wide text-ink-muted sm:text-sm">
        Todo List · 高效管理每日任务
      </p>
    </header>
  );
}
