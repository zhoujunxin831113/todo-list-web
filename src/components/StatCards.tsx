import type { TodoStats } from '../lib/stats';

export interface StatCardsProps {
  stats: TodoStats;
}

interface StatRow {
  label: string;
  value: number;
  tone: 'ink' | 'warning' | 'success';
  suffix?: string;
}

export function StatCards({ stats }: StatCardsProps) {
  const rows: StatRow[] = [
    { label: '总任务', value: stats.total, tone: 'ink' },
    { label: '待完成', value: stats.active, tone: 'warning' },
    { label: '已完成', value: stats.completed, tone: 'success' },
  ];
  const toneClass = {
    ink: 'text-ink',
    warning: 'text-warning',
    success: 'text-success',
  } as const;

  return (
    <section
      aria-label="任务统计"
      aria-live="polite"
      className="rounded-card border-2 border-ink bg-card p-5 shadow-card"
    >
      <h2 className="mb-3 text-sm font-bold text-ink-muted">统计数据</h2>

      <dl className="divide-y-2 divide-ink/10">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2.5">
            <dt className="text-sm font-medium text-ink">{row.label}</dt>
            <dd
              className={`font-mono text-lg font-bold tabular-nums ${toneClass[row.tone]}`}
            >
              {row.value}
              {row.suffix ?? ''}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 border-t-2 border-ink/10 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink-muted">完成率</span>
          <span className="font-mono text-lg font-bold tabular-nums text-ink">{stats.rate}%</span>
        </div>
        <div
          className="mt-2 h-3 w-full overflow-hidden rounded-pill border-2 border-ink bg-page"
          role="progressbar"
          aria-valuenow={stats.rate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="任务完成率"
        >
          <div
            className="h-full rounded-pill bg-ink transition-all duration-slow"
            style={{ width: `${stats.rate}%` }}
          />
        </div>
      </div>
    </section>
  );
}
