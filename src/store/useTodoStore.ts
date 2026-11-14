import { create } from 'zustand';
import { createJSONStorage, type StateStorage, persist } from 'zustand/middleware';
import { DEFAULT_CATEGORY, DEFAULT_FILTERS, DEFAULT_PRIORITY } from '../constants/options';
import {
  CURRENT_VERSION,
  STORAGE_KEY,
  loadState,
  saveState,
  type StorageWarning,
} from '../lib/storage';
import type { Category, Filters, PersistedState, Priority, Task } from '../types/todo';

export interface NewTaskInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  category?: Category;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  category?: Category;
}

export interface TodoState {
  tasks: Task[];
  filters: Filters;
  keyword: string;
  // 存储降级提示不参与持久化（派生/运行时态），由 Toast 读取后自行定时消失。
  storageWarning: StorageWarning | null;
  add: (input: NewTaskInput) => void;
  update: (id: string, patch: UpdateTaskInput) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  setFilter: (patch: Partial<Filters>) => void;
  setKeyword: (keyword: string) => void;
}

type PersistedTodoState = Pick<TodoState, 'tasks' | 'filters' | 'keyword'>;

function createId(): string {
  return crypto.randomUUID();
}

function toPersisted(state: PersistedTodoState): PersistedState {
  return {
    version: CURRENT_VERSION,
    tasks: state.tasks,
    preferences: { filters: state.filters, keyword: state.keyword },
  };
}

// 自定义持久化层：读写交给 storage.ts 统一容错，磁盘上始终是 TECH_DESIGN 3.2 的扁平
// { version, tasks, preferences }；适配器内部再与 persist 期望的 { state, version } 信封互转，
// schema 版本与迁移完全由 storage.ts 负责，persist 自身 version 恒为 0。
interface TodoStorage extends StateStorage {
  rehydrateWarning: StorageWarning | null;
}

function createTodoStorage(
  storage: Storage,
  onWarning: (warning: StorageWarning | null) => void,
): TodoStorage {
  let activeWarning: StorageWarning | null = null;
  const adapter: TodoStorage = {
    rehydrateWarning: null,
    getItem(name) {
      const result = loadState(storage);
      activeWarning = result.warning;
      adapter.rehydrateWarning = result.warning;
      if (name !== STORAGE_KEY) {
        return null;
      }
      // 磁盘是扁平 PersistedState；此处翻译回 zustand persist 期望的 { state } 信封，
      // 版本/迁移/容错已由 storage.ts 处理，persist 的 version 恒为 0。
      const { tasks, preferences } = result.state;
      return JSON.stringify({
        state: { tasks, filters: preferences.filters, keyword: preferences.keyword },
        version: 0,
      } satisfies { state: PersistedTodoState; version: number });
    },
    setItem(_name, value) {
      const envelope = JSON.parse(value) as { state: PersistedTodoState };
      const result = saveState(toPersisted(envelope.state), storage);
      if (result.warning !== activeWarning) {
        activeWarning = result.warning;
        onWarning(result.warning);
      }
    },
    removeItem(name) {
      try {
        storage.removeItem(name);
      } catch {
        // 清理失败不影响内存态运行
      }
    },
  };
  return adapter;
}

const initialState: PersistedTodoState = {
  tasks: [],
  filters: { ...DEFAULT_FILTERS },
  keyword: '',
};

function validateTitle(title: string | undefined): string | null {
  const trimmed = title?.trim() ?? '';
  return trimmed.length >= 1 && trimmed.length <= 100 ? trimmed : null;
}

export const createTodoStore = (storage: Storage = localStorage) => {
  const todoStorage = createTodoStorage(storage, (warning) => {
    store.setState({ storageWarning: warning });
  });

  const store = create<TodoState>()(
    persist(
      (set) => ({
        ...initialState,
        filters: { ...DEFAULT_FILTERS },
        storageWarning: null,

        add: (input) => {
          const title = validateTitle(input.title);
          if (title === null) {
            return;
          }
          const description = (input.description ?? '').slice(0, 500);
          const now = new Date().toISOString();
          const task: Task = {
            id: createId(),
            title,
            description,
            dueDate: input.dueDate ?? null,
            priority: input.priority ?? DEFAULT_PRIORITY,
            category: input.category ?? DEFAULT_CATEGORY,
            completed: false,
            createdAt: now,
            updatedAt: now,
            completedAt: null,
          };
          // 新建插入列表顶部；新 id 不与既有任务冲突（randomUUID）。
          set((state) => ({ tasks: [task, ...state.tasks] }));
        },

        update: (id, patch) =>
          set((state) => {
            // store 层二次校验：已完成任务拒绝编辑（PRD 2.3 规则 2），map 原地替换不改变顺序。
            const index = state.tasks.findIndex((task) => task.id === id);
            if (index === -1 || state.tasks[index].completed) {
              return state;
            }
            const nextTitle = patch.title === undefined ? undefined : validateTitle(patch.title);
            if (patch.title !== undefined && nextTitle === null) {
              return state;
            }
            const tasks = state.tasks.map((task) =>
              task.id === id
                ? {
                    ...task,
                    ...(nextTitle !== undefined && nextTitle !== null ? { title: nextTitle } : {}),
                    ...(patch.description !== undefined
                      ? { description: patch.description.slice(0, 500) }
                      : {}),
                    ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : {}),
                    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
                    ...(patch.category !== undefined ? { category: patch.category } : {}),
                    updatedAt: new Date().toISOString(),
                  }
                : task,
            );
            return { tasks };
          }),

        toggle: (id) =>
          set((state) => {
            const now = new Date().toISOString();
            // map 原地替换：勾选/取消不改变元素顺序，同时维持 completed ⟺ completedAt 不变量。
            const tasks = state.tasks.map((task) => {
              if (task.id !== id) {
                return task;
              }
              const completed = !task.completed;
              return {
                ...task,
                completed,
                completedAt: completed ? now : null,
                updatedAt: now,
              };
            });
            return { tasks };
          }),

        remove: (id) => set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) })),

        setFilter: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),

        setKeyword: (keyword) => set({ keyword }),
      }),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => todoStorage),
        // 仅落盘原始数据与偏好；storageWarning 等运行时态不落盘，派生数据本就不在 store 中。
        partialize: (state): PersistedTodoState => ({
          tasks: state.tasks,
          filters: state.filters,
          keyword: state.keyword,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.storageWarning = todoStorage.rehydrateWarning;
          }
        },
      },
    ),
  );

  return store;
};

export const useTodoStore = createTodoStore();
