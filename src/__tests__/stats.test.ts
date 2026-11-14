import { describe, expect, it } from 'vitest';
import { computeStats } from '../lib/stats';
import { makeTask } from './helpers';

describe('computeStats', () => {
  it('空列表：total 为 0 且完成率为 0%（不出现 NaN/Infinity）', () => {
    expect(computeStats([])).toEqual({ total: 0, active: 0, completed: 0, rate: 0 });
  });

  it('全未完成：rate 为 0，active 等于总数', () => {
    const tasks = [makeTask(), makeTask(), makeTask()];
    expect(computeStats(tasks)).toEqual({ total: 3, active: 3, completed: 0, rate: 0 });
  });

  it('全完成：rate 为 100', () => {
    const tasks = [
      makeTask({ completed: true, completedAt: '2026-01-02T00:00:00.000Z' }),
      makeTask({ completed: true, completedAt: '2026-01-03T00:00:00.000Z' }),
    ];
    expect(computeStats(tasks)).toEqual({ total: 2, active: 0, completed: 2, rate: 100 });
  });

  it('部分完成：四舍五入为整数百分比', () => {
    const tasks = [
      makeTask(),
      makeTask(),
      makeTask({ completed: true, completedAt: '2026-01-02T00:00:00.000Z' }),
    ];
    expect(computeStats(tasks)).toEqual({ total: 3, active: 2, completed: 1, rate: 33 });
  });

  it('统计恒按全部任务计算：先全量统计，再对筛选后子集统计，全量结果不变', () => {
    const tasks = [
      makeTask({ category: 'work' }),
      makeTask({ category: 'life', completed: true, completedAt: '2026-01-02T00:00:00.000Z' }),
      makeTask({ category: 'work' }),
      makeTask({ category: 'study', completed: true, completedAt: '2026-01-03T00:00:00.000Z' }),
    ];

    const allStats = computeStats(tasks);
    const workOnly = tasks.filter((task) => task.category === 'work');
    const subsetStats = computeStats(workOnly);

    expect(allStats).toEqual({ total: 4, active: 2, completed: 2, rate: 50 });
    expect(subsetStats).toEqual({ total: 2, active: 2, completed: 0, rate: 0 });
    expect(allStats.total).not.toBe(subsetStats.total);
  });
});
