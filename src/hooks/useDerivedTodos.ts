import { useMemo } from 'react';
import { matchesFilters, normalizeKeyword } from '../lib/filter';
import { statsFromCounts, type TodoStats } from '../lib/stats';
import type { Filters, Task } from '../types/todo';
import { useDebounce } from './useDebounce';

export interface DerivedTodos {
  /** 命中三维 AND + 关键词的任务，保持 store 中的原始顺序 */
  visibleTasks: Task[];
  /** 恒为全量 tasks 的统计，与筛选/搜索物理隔离（PRD 2.3 规则 1） */
  stats: TodoStats;
}

/**
 * 派生数据：在 useMemo 内单次遍历 tasks，同时产出可见任务与统计。
 * - 统计在遍历中按全量累加，因此不受筛选/关键词影响，组件不得自行计算统计；
 * - 关键词内部防抖 250ms，筛选维度变化立即生效；
 * - 复用 lib/filter 与 lib/stats 的匹配/公式，保证口径与纯函数一致。
 */
export function useDerivedTodos(
  tasks: readonly Task[],
  filters: Filters,
  keyword: string,
): DerivedTodos {
  const debouncedKeyword = useDebounce(keyword);

  return useMemo(() => {
    const normalizedKeyword = normalizeKeyword(debouncedKeyword);
    let completed = 0;
    const visibleTasks: Task[] = [];

    for (const task of tasks) {
      if (task.completed) {
        completed += 1;
      }
      if (matchesFilters(task, filters, normalizedKeyword)) {
        visibleTasks.push(task);
      }
    }

    return { visibleTasks, stats: statsFromCounts(tasks.length, completed) };
  }, [tasks, filters, debouncedKeyword]);
}
