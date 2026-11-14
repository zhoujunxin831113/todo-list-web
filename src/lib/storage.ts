import { DEFAULT_CATEGORY, DEFAULT_FILTERS, DEFAULT_PRIORITY } from '../constants/options';
import type { Category, Filters, PersistedState, Priority, Task } from '../types/todo';
import { isValidDateString } from './date';

export const STORAGE_KEY = 'todoapp.state.v1';
export const CURRENT_VERSION = 1;
const BROKEN_KEY_PREFIX = 'todoapp.state.broken.';

export type StorageWarning =
  'invalid-json' | 'unknown-version' | 'quota-exceeded' | 'storage-unavailable';

export interface LoadResult {
  state: PersistedState;
  warning: StorageWarning | null;
}

export interface SaveResult {
  ok: boolean;
  warning: StorageWarning | null;
}

const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low'];
const CATEGORIES: readonly Category[] = ['work', 'life', 'study', 'other'];
const STATUSES: readonly Filters['status'][] = ['all', 'active', 'completed'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeString(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.length <= maxLength ? value : null;
}

function normalizeDate(value: unknown): string | null {
  return isValidDateString(value) ? value : null;
}

function normalizeTimestamp(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

// 字段级宽松校验：非法枚举/日期回落默认值，结构缺失（id/title 非字符串）整项丢弃。
function normalizeTask(raw: unknown): Task | null {
  if (!isObject(raw)) {
    return null;
  }

  const id = normalizeString(raw.id, 100);
  const title = normalizeString(raw.title, 100);
  if (id === null || title === null || title.trim() === '') {
    return null;
  }

  const description = normalizeString(raw.description, 500) ?? '';
  const dueDate = normalizeDate(raw.dueDate);
  const priority = PRIORITIES.includes(raw.priority as Priority)
    ? (raw.priority as Priority)
    : DEFAULT_PRIORITY;
  const category = CATEGORIES.includes(raw.category as Category)
    ? (raw.category as Category)
    : DEFAULT_CATEGORY;
  const completed = raw.completed === true;
  const createdAt = normalizeTimestamp(raw.createdAt) ?? new Date(0).toISOString();
  const updatedAt = normalizeTimestamp(raw.updatedAt) ?? createdAt;
  // 维持不变量：completed === true ⟺ completedAt !== null（TECH_DESIGN 3.2）
  const completedAt = completed ? (normalizeTimestamp(raw.completedAt) ?? updatedAt) : null;

  return {
    id,
    title,
    description,
    dueDate,
    priority,
    category,
    completed,
    createdAt,
    updatedAt,
    completedAt,
  };
}

function normalizeFilters(raw: unknown): Filters {
  if (!isObject(raw)) {
    return { ...DEFAULT_FILTERS };
  }
  const category =
    CATEGORIES.includes(raw.category as Category) || raw.category === 'all'
      ? (raw.category as Filters['category'])
      : DEFAULT_FILTERS.category;
  const priority =
    PRIORITIES.includes(raw.priority as Priority) || raw.priority === 'all'
      ? (raw.priority as Filters['priority'])
      : DEFAULT_FILTERS.priority;
  const status = STATUSES.includes(raw.status as Filters['status'])
    ? (raw.status as Filters['status'])
    : DEFAULT_FILTERS.status;
  return { category, priority, status };
}

export function createEmptyState(): PersistedState {
  return {
    version: CURRENT_VERSION,
    tasks: [],
    preferences: { filters: { ...DEFAULT_FILTERS }, keyword: '' },
  };
}

// 预留迁移链：未来版本以 migrate[fromVersion](state) 链式升级；当前仅 v1，无历史版本。
const migrate: Record<number, (state: PersistedState) => PersistedState> = {};

function backupBroken(storage: Storage, rawValue: string): void {
  try {
    storage.setItem(`${BROKEN_KEY_PREFIX}${Date.now()}`, rawValue);
  } catch {
    // 备份本身失败不应阻断降级空状态流程
  }
}

export function loadState(storage: Storage = localStorage): LoadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { state: createEmptyState(), warning: 'storage-unavailable' };
  }

  if (raw === null) {
    return { state: createEmptyState(), warning: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    backupBroken(storage, raw);
    return { state: createEmptyState(), warning: 'invalid-json' };
  }

  if (!isObject(parsed) || typeof parsed.version !== 'number') {
    backupBroken(storage, raw);
    return { state: createEmptyState(), warning: 'invalid-json' };
  }

  if (parsed.version > CURRENT_VERSION) {
    backupBroken(storage, raw);
    return { state: createEmptyState(), warning: 'unknown-version' };
  }

  let state = parsed as unknown as PersistedState;
  for (let v = state.version; v < CURRENT_VERSION; v += 1) {
    const step = migrate[v];
    if (!step) {
      backupBroken(storage, raw);
      return { state: createEmptyState(), warning: 'unknown-version' };
    }
    state = step(state);
  }

  const tasks = Array.isArray(state.tasks)
    ? state.tasks.map(normalizeTask).filter((task): task is Task => task !== null)
    : [];
  const preferences: Record<string, unknown> = isObject(state.preferences) ? state.preferences : {};
  const keyword = typeof preferences.keyword === 'string' ? preferences.keyword : '';

  return {
    state: {
      version: CURRENT_VERSION,
      tasks,
      preferences: { filters: normalizeFilters(preferences.filters), keyword },
    },
    warning: null,
  };
}

export function saveState(state: PersistedState, storage: Storage = localStorage): SaveResult {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true, warning: null };
  } catch (error) {
    const warning: StorageWarning =
      isObject(error) && error.name === 'QuotaExceededError'
        ? 'quota-exceeded'
        : 'storage-unavailable';
    return { ok: false, warning };
  }
}
