import type { Category, Priority, Task } from '../types/todo';

let sequence = 0;

export class MemoryStorage implements Storage {
  length = 0;
  private readonly store = new Map<string, string>();

  clear(): void {
    this.store.clear();
    this.length = 0;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
    this.length = this.store.size;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
    this.length = this.store.size;
  }
}

export class ThrowingStorage implements Storage {
  length = 0;
  clear(): void {
    throw new Error('storage unavailable');
  }
  getItem(): string | null {
    throw new Error('storage unavailable');
  }
  key(): string | null {
    throw new Error('storage unavailable');
  }
  removeItem(): void {
    throw new Error('storage unavailable');
  }
  setItem(): void {
    throw new Error('storage unavailable');
  }
}

export class QuotaStorage extends MemoryStorage {
  override setItem(): void {
    const error = new Error('quota exceeded');
    error.name = 'QuotaExceededError';
    throw error;
  }
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  sequence += 1;
  const createdAt = `2026-01-0${Math.min(sequence, 9)}T08:00:00.000Z`;
  return {
    id: `task-${sequence}`,
    title: `任务 ${sequence}`,
    description: '',
    dueDate: null,
    priority: 'medium' satisfies Priority,
    category: 'other' satisfies Category,
    completed: false,
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
    ...overrides,
  };
}
