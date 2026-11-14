import { beforeEach, describe, expect, it } from 'vitest';
import {
  CURRENT_VERSION,
  STORAGE_KEY,
  createEmptyState,
  loadState,
  saveState,
} from '../lib/storage';
import type { PersistedState, Task } from '../types/todo';
import { QuotaStorage, ThrowingStorage, makeTask } from './helpers';

function persist(partial: Partial<PersistedState> = {}): PersistedState {
  return { ...createEmptyState(), ...partial };
}

describe('loadState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('无存储记录时返回空状态且无警告', () => {
    const result = loadState();
    expect(result.warning).toBeNull();
    expect(result.state).toEqual(createEmptyState());
    expect(result.state.version).toBe(CURRENT_VERSION);
  });

  it('正常状态原样返回（version/tasks/preferences）', () => {
    const task = makeTask();
    const state = persist({
      tasks: [task],
      preferences: {
        filters: { category: 'work', priority: 'high', status: 'active' },
        keyword: '周报',
      },
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    const result = loadState();
    expect(result.warning).toBeNull();
    expect(result.state.tasks).toEqual([task]);
    expect(result.state.preferences.keyword).toBe('周报');
    expect(result.state.preferences.filters.category).toBe('work');
  });

  it('非法 JSON：备份原值、降级空状态并提示 invalid-json', () => {
    const broken = '{not-valid-json';
    localStorage.setItem(STORAGE_KEY, broken);

    const result = loadState();

    expect(result.warning).toBe('invalid-json');
    expect(result.state).toEqual(createEmptyState());
    const backupKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith('todoapp.state.broken.'),
    );
    expect(backupKeys).toHaveLength(1);
    expect(localStorage.getItem(backupKeys[0])).toBe(broken);
  });

  it('根结构损坏（非对象 / 无 version）：同样备份并降级', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([1, 2, 3]));
    expect(loadState().warning).toBe('invalid-json');

    localStorage.clear();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: [] }));
    expect(loadState().warning).toBe('invalid-json');
  });

  it('未知 version（高于当前）：备份原值、降级空状态并提示 unknown-version', () => {
    const future = persist({ version: CURRENT_VERSION + 1 });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(future));

    const result = loadState();

    expect(result.warning).toBe('unknown-version');
    expect(result.state).toEqual(createEmptyState());
    expect(Object.keys(localStorage).some((key) => key.startsWith('todoapp.state.broken.'))).toBe(
      true,
    );
  });

  it('getItem 抛错（隐私模式等）：降级空状态并提示 storage-unavailable', () => {
    const result = loadState(new ThrowingStorage());
    expect(result.warning).toBe('storage-unavailable');
    expect(result.state).toEqual(createEmptyState());
  });

  it('非法 Task 被丢弃：缺 id / title 为非字符串 / 纯空白标题', () => {
    const valid = makeTask({ id: 'valid' });
    const raw = persist({
      tasks: [
        valid,
        { ...makeTask(), id: null } as unknown as Task,
        { ...makeTask(), title: 123 } as unknown as Task,
        { ...makeTask(), title: '   ' },
      ],
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));

    const result = loadState();
    expect(result.state.tasks.map((task) => task.id)).toEqual(['valid']);
  });

  it('字段级容错：非法枚举回落默认值、非法日期回落 null、损坏 filters/keyword 回落默认', () => {
    const task = makeTask({
      priority: 'urgent' as Task['priority'],
      category: 'family' as Task['category'],
      dueDate: '2026-13-40',
    });
    const raw = persist({ tasks: [task], preferences: {} as PersistedState['preferences'] });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));

    const result = loadState();
    const restored = result.state.tasks[0];
    expect(restored.priority).toBe('medium');
    expect(restored.category).toBe('other');
    expect(restored.dueDate).toBeNull();
    expect(result.state.preferences.filters).toEqual({
      category: 'all',
      priority: 'all',
      status: 'all',
    });
    expect(result.state.preferences.keyword).toBe('');
  });

  it('维持 completed 与 completedAt 的一致性不变量', () => {
    const completedButNoStamp = makeTask({ completed: true, completedAt: null });
    const activeButHasStamp = makeTask({
      completed: false,
      completedAt: '2026-01-02T00:00:00.000Z',
    });
    const raw = persist({ tasks: [completedButNoStamp, activeButHasStamp] });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));

    const [first, second] = loadState().state.tasks;
    expect(first.completed).toBe(true);
    expect(first.completedAt).not.toBeNull();
    expect(second.completed).toBe(false);
    expect(second.completedAt).toBeNull();
  });
});

describe('saveState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('成功写入单键，内容为 JSON 序列化的 PersistedState', () => {
    const state = persist({ tasks: [makeTask()] });
    const result = saveState(state);

    expect(result).toEqual({ ok: true, warning: null });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toEqual(state);
  });

  it('QuotaExceeded：不抛出，返回 quota-exceeded 警告（调用方据此降级内存态）', () => {
    const result = saveState(persist(), new QuotaStorage());
    expect(result.ok).toBe(false);
    expect(result.warning).toBe('quota-exceeded');
  });

  it('存储不可用（setItem 抛普通错误）：返回 storage-unavailable', () => {
    const result = saveState(persist(), new ThrowingStorage());
    expect(result.ok).toBe(false);
    expect(result.warning).toBe('storage-unavailable');
  });
});
