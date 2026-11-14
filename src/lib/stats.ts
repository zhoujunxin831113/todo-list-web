import type { Task } from '../types/todo';

export interface TodoStats {
  total: number;
  active: number;
  completed: number;
  /** 整数百分比；total 为 0 时恒为 0（PRD 2.2-6） */
  rate: number;
}

/** 由全量计数派生四项统计，统一 rate 公式；hooks 单次遍历时复用，避免口径分叉。 */
export function statsFromCounts(total: number, completed: number): TodoStats {
  return {
    total,
    active: total - completed,
    completed,
    rate: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

// 统计输入恒为全部任务，调用方不得传入筛选后的列表（PRD 2.3 规则 1）。
export function computeStats(tasks: readonly Task[]): TodoStats {
  let completed = 0;

  for (const task of tasks) {
    if (task.completed) {
      completed += 1;
    }
  }

  return statsFromCounts(tasks.length, completed);
}
