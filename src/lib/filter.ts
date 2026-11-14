import { DEFAULT_FILTERS } from '../constants/options';
import type { Filters, Task } from '../types/todo';

export interface FilterOptions {
  filters: Filters;
  /** 已防抖的关键词；匹配标题 + 描述，不区分大小写 */
  keyword: string;
}

/** 关键词归一化：trim + 小写。放在循环外只算一次，hooks 逐条匹配时复用同一结果。 */
export function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

/** 单任务是否命中三维 AND + 关键词；keyword 必须已归一化，供 filterTasks 与单次遍历复用。 */
export function matchesFilters(task: Task, filters: Filters, normalizedKeyword: string): boolean {
  if (filters.category !== 'all' && task.category !== filters.category) {
    return false;
  }
  if (filters.priority !== 'all' && task.priority !== filters.priority) {
    return false;
  }
  if (
    filters.status === 'active' ? task.completed : filters.status === 'completed' && !task.completed
  ) {
    return false;
  }

  return (
    normalizedKeyword === '' ||
    task.title.toLowerCase().includes(normalizedKeyword) ||
    task.description.toLowerCase().includes(normalizedKeyword)
  );
}

// 三维（分类 × 优先级 × 状态）AND，与关键词叠加仍为 AND；只影响视图，不改变统计口径。
// 保留原数组顺序，筛选不做排序（PRD 2.3 规则 3）。
export function filterTasks(tasks: readonly Task[], { filters, keyword }: FilterOptions): Task[] {
  const normalizedKeyword = normalizeKeyword(keyword);
  return tasks.filter((task) => matchesFilters(task, filters, normalizedKeyword));
}

export const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  filters: DEFAULT_FILTERS,
  keyword: '',
};
