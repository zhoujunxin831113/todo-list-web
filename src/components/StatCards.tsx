import type { TodoStats } from '../lib/stats';

export interface StatCardsProps {
  /** 必须来自全量 tasks 的统计（hooks 层产出），组件内不得自行计算 */
  stats: TodoStats;
}

interface StatCardProps {
  label: string;
  value: number | string;
  accent?: boolean;
}

function StatCard({ label, value, accent = false }: StatCardProps) {
  return (
    <div className="rounded-card bg-card p-4 shadow-card">
      <p className="text-xs text-ink-muted">{label}</p>
      <p
        className={[
          'mt-1 text-xl font-semibold tabular-nums',
          accent ? 'text-primary' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  );
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <section
      aria-label="任务统计"
      aria-live="polite"
      className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
    >
      <StatCard label="总任务" value={stats.total} />
      <StatCard label="待完成" value={stats.active} />
      <StatCard label="已完成" value={stats.completed} />
      <div className="rounded-card bg-card p-4 shadow-card">
        <p className="text-xs text-ink-muted">完成率</p>
        <p className="mt-1 text-xl font-semibold tabular-nums text-primary">{stats.rate}%</p>
        {/* 完成率 = 已完成 ÷ 总任务，总数 0 时为 0%（PRD 2.2-6） */}
        <div
          role="progressbar"
          aria-label="完成率"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stats.rate}
          className="mt-2 h-2 overflow-hidden rounded-pill bg-line/60"
        >
          <div
            className="h-full rounded-pill bg-primary transition-[width]"
            style={{ width: `${stats.rate}%` }}
          />
        </div>
      </div>
    </section>
  );
}
