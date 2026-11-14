import type { Category, Filters, Priority } from '../types/todo';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

/* ---------- 优先级：高 / 中 / 低，默认中 ---------- */

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export const PRIORITY_ORDER: readonly Priority[] = ['high', 'medium', 'low'];

export const PRIORITY_OPTIONS: readonly SelectOption<Priority>[] = PRIORITY_ORDER.map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}));

export const DEFAULT_PRIORITY: Priority = 'medium';

/* ---------- 分类：工作 / 生活 / 学习 / 其他，默认其他 ---------- */

export const CATEGORY_LABELS: Record<Category, string> = {
  work: '工作',
  life: '生活',
  study: '学习',
  other: '其他',
};

export const CATEGORY_ORDER: readonly Category[] = ['work', 'life', 'study', 'other'];

export const CATEGORY_OPTIONS: readonly SelectOption<Category>[] = CATEGORY_ORDER.map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}));

export const DEFAULT_CATEGORY: Category = 'other';

/* ---------- 状态筛选：全部 / 未完成 / 已完成 ---------- */

export const STATUS_FILTER_LABELS: Record<Filters['status'], string> = {
  all: '全部',
  active: '未完成',
  completed: '已完成',
};

export const STATUS_FILTER_ORDER: readonly Filters['status'][] = ['all', 'active', 'completed'];

export const STATUS_FILTER_OPTIONS: readonly SelectOption<Filters['status']>[] =
  STATUS_FILTER_ORDER.map((value) => ({
    value,
    label: STATUS_FILTER_LABELS[value],
  }));

/* ---------- 默认筛选偏好（损坏时也回落至此） ---------- */

export const DEFAULT_FILTERS: Filters = {
  category: 'all',
  priority: 'all',
  status: 'all',
};
