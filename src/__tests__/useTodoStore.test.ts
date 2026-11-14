import { beforeEach, describe, expect, it } from 'vitest';
import { CURRENT_VERSION, STORAGE_KEY } from '../lib/storage';
import { createTodoStore, type TodoState } from '../store/useTodoStore';
import { MemoryStorage, QuotaStorage, ThrowingStorage, makeTask } from './helpers';

type Store = ReturnType<typeof createTodoStore>;

function readPersisted(storage: Storage) {
  return JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null') as {
    version: number;
    tasks: TodoState['tasks'];
    preferences: { filters: TodoState['filters']; keyword: string };
  } | null;
}

describe('useTodoStore', () => {
  let storage: MemoryStorage;
  let store: Store;

  beforeEach(() => {
    storage = new MemoryStorage();
    store = createTodoStore(storage);
  });

  it('初始为空任务、默认筛选、空关键词', () => {
    const state = store.getState();
    expect(state.tasks).toEqual([]);
    expect(state.filters).toEqual({ category: 'all', priority: 'all', status: 'all' });
    expect(state.keyword).toBe('');
    expect(state.storageWarning).toBeNull();
  });

  it('add：trim 标题、应用默认优先级/分类，插入列表顶部并生成唯一 id', () => {
    store.getState().add({ title: '  第一项  ' });
    store.getState().add({ title: '第二项', priority: 'high', category: 'work' });

    const { tasks } = store.getState();
    expect(tasks).toHaveLength(2);
    expect(tasks[0].title).toBe('第二项');
    expect(tasks[1].title).toBe('第一项');
    expect(tasks[0].id).not.toBe(tasks[1].id);
    expect(tasks[1].priority).toBe('medium');
    expect(tasks[1].category).toBe('other');
    expect(tasks[0].completed).toBe(false);
    expect(tasks[0].completedAt).toBeNull();
    expect(tasks[0].createdAt).toBe(tasks[0].updatedAt);
  });

  it('add：空标题 / 纯空白 / 超 100 字标题被拦截，不产生任务', () => {
    store.getState().add({ title: '' });
    store.getState().add({ title: '    ' });
    store.getState().add({ title: '字'.repeat(101) });
    expect(store.getState().tasks).toHaveLength(0);
  });

  it('add：描述截断到 500 字符，截止日期原样保留', () => {
    store.getState().add({ title: '长描述', description: 'x'.repeat(600), dueDate: '2026-11-16' });
    const task = store.getState().tasks[0];
    expect(task.description).toHaveLength(500);
    expect(task.dueDate).toBe('2026-11-16');
  });

  it('update：未完成任务原地更新并刷新 updatedAt，元素顺序不变', () => {
    store.getState().add({ title: 'A' });
    store.getState().add({ title: 'B' });
    store.getState().add({ title: 'C' });
    const targetId = store.getState().tasks[1].id;
    const beforeOrder = store.getState().tasks.map((task) => task.id);
    const beforeUpdatedAt = store.getState().tasks[1].updatedAt;

    store.getState().update(targetId, { title: 'B 改', priority: 'low' });

    const tasks = store.getState().tasks;
    expect(tasks.map((task) => task.id)).toEqual(beforeOrder);
    const updated = tasks.find((task) => task.id === targetId);
    expect(updated).toBeDefined();
    expect(updated?.title).toBe('B 改');
    expect(updated?.priority).toBe('low');
    expect(updated ? updated.updatedAt >= beforeUpdatedAt : false).toBe(true);
  });

  it('update：已完成任务拒绝编辑（store 层守卫），内容与顺序都不变', () => {
    store.getState().add({ title: '可编辑' });
    const id = store.getState().tasks[0].id;
    store.getState().toggle(id);
    const snapshot = store.getState().tasks;

    store.getState().update(id, { title: '尝试篡改' });

    expect(store.getState().tasks).toEqual(snapshot);
    expect(store.getState().tasks[0].title).toBe('可编辑');
  });

  it('update：不存在的 id 与非法标题静默忽略', () => {
    store.getState().add({ title: '保留' });
    const id = store.getState().tasks[0].id;
    const snapshot = store.getState().tasks;

    store.getState().update('missing-id', { title: 'x' });
    store.getState().update(id, { title: '   ' });

    expect(store.getState().tasks).toEqual(snapshot);
  });

  it('toggle：完成写入 completedAt，再次取消清空，且位置不变（不变量 1 与 4）', () => {
    store.getState().add({ title: 'A' });
    store.getState().add({ title: 'B' });
    store.getState().add({ title: 'C' });
    const targetId = store.getState().tasks[1].id;
    const beforeOrder = store.getState().tasks.map((task) => task.id);

    store.getState().toggle(targetId);
    let task = store.getState().tasks.find((item) => item.id === targetId);
    expect(task?.completed).toBe(true);
    expect(task?.completedAt).not.toBeNull();
    expect(store.getState().tasks.map((item) => item.id)).toEqual(beforeOrder);

    store.getState().toggle(targetId);
    task = store.getState().tasks.find((item) => item.id === targetId);
    expect(task?.completed).toBe(false);
    expect(task?.completedAt).toBeNull();
    expect(store.getState().tasks.map((item) => item.id)).toEqual(beforeOrder);
  });

  it('remove：删除目标，其余元素相对顺序不变', () => {
    store.getState().add({ title: 'A' });
    store.getState().add({ title: 'B' });
    store.getState().add({ title: 'C' });
    const removeId = store.getState().tasks[1].id;

    store.getState().remove(removeId);

    expect(store.getState().tasks.map((task) => task.title)).toEqual(['C', 'A']);
    expect(store.getState().tasks.some((task) => task.id === removeId)).toBe(false);
  });

  it('setFilter / setKeyword：局部合并筛选、更新关键词', () => {
    store.getState().setFilter({ category: 'work' });
    expect(store.getState().filters).toEqual({
      category: 'work',
      priority: 'all',
      status: 'all',
    });
    store.getState().setFilter({ status: 'completed' });
    expect(store.getState().filters.category).toBe('work');
    expect(store.getState().filters.status).toBe('completed');

    store.getState().setKeyword('  周报 ');
    expect(store.getState().keyword).toBe('  周报 ');
  });

  it('持久化：落盘为扁平 { version, tasks, preferences }，派生/运行时字段不落盘', () => {
    store.getState().add({ title: '落盘任务', category: 'work' });
    store.getState().setFilter({ priority: 'high' });
    store.getState().setKeyword('关键词');

    const persisted = readPersisted(storage);
    expect(persisted).not.toBeNull();
    expect(persisted?.version).toBe(CURRENT_VERSION);
    expect(persisted?.tasks).toHaveLength(1);
    expect(persisted?.tasks[0].title).toBe('落盘任务');
    expect(persisted?.preferences).toEqual({
      filters: { category: 'all', priority: 'high', status: 'all' },
      keyword: '关键词',
    });
    expect(persisted).not.toHaveProperty('storageWarning');
    expect(persisted).not.toHaveProperty('visibleTasks');
    expect(persisted).not.toHaveProperty('stats');
  });

  it('水合：已有数据在新 store 中恢复，且不出现 persist 的 state/version 包装结构', () => {
    const task = makeTask({ title: '恢复我' });
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: CURRENT_VERSION,
        tasks: [task],
        preferences: {
          filters: { category: 'life', priority: 'all', status: 'active' },
          keyword: '恢复关键词',
        },
      }),
    );

    const rehydrated = createTodoStore(storage);
    expect(rehydrated.getState().tasks).toEqual([task]);
    expect(rehydrated.getState().filters.category).toBe('life');
    expect(rehydrated.getState().keyword).toBe('恢复关键词');
  });

  it('水合：损坏数据走 storage.ts 降级为空状态并带 invalid-json 警告，原值被备份', () => {
    storage.setItem(STORAGE_KEY, '{broken-json');
    const rehydrated = createTodoStore(storage);

    expect(rehydrated.getState().tasks).toEqual([]);
    expect(rehydrated.getState().storageWarning).toBe('invalid-json');
    const keys = [...Array(storage.length).keys()].map((index) => storage.key(index));
    expect(keys.some((key) => key?.startsWith('todoapp.state.broken.'))).toBe(true);
  });

  it('QuotaExceeded：写入不抛错，store 标记 quota-exceeded 且内存态仍可继续操作', () => {
    const quotaStore = createTodoStore(new QuotaStorage());
    quotaStore.getState().add({ title: '内存任务' });

    expect(quotaStore.getState().storageWarning).toBe('quota-exceeded');
    expect(quotaStore.getState().tasks).toHaveLength(1);
  });

  it('存储完全不可用：水合与写入均降级，标记 storage-unavailable 且不白屏', () => {
    const offlineStore = createTodoStore(new ThrowingStorage());
    expect(offlineStore.getState().storageWarning).toBe('storage-unavailable');
    offlineStore.getState().add({ title: '离线任务' });
    expect(offlineStore.getState().tasks[0].title).toBe('离线任务');
    expect(offlineStore.getState().storageWarning).toBe('storage-unavailable');
  });
});
