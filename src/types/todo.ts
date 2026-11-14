export type Priority = 'high' | 'medium' | 'low';
export type Category = 'work' | 'life' | 'study' | 'other';
export type FilterValue<T> = 'all' | T;

export interface Task {
  id: string; // crypto.randomUUID()
  title: string; // trim 后 1–100 字符，必填
  description: string; // ≤ 500 字符，默认 ''
  dueDate: string | null; // 'YYYY-MM-DD' | null，默认 null
  priority: Priority; // 默认 'medium'
  category: Category; // 默认 'other'
  completed: boolean; // 默认 false
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  completedAt: string | null; // 完成时写入，取消完成清空
}

export interface Filters {
  category: FilterValue<Category>;
  priority: FilterValue<Priority>;
  status: 'all' | 'active' | 'completed';
}

export interface PersistedState {
  version: number; // 当前 1，用于 schema 迁移
  tasks: Task[];
  preferences: {
    filters: Filters;
    keyword: string;
  };
}
