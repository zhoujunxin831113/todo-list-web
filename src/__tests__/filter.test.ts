import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTER_OPTIONS, filterTasks } from '../lib/filter';
import { DEFAULT_FILTERS } from '../constants/options';
import type { Filters } from '../types/todo';
import { makeTask } from './helpers';

function filters(overrides: Partial<Filters> = {}): Filters {
  return { ...DEFAULT_FILTERS, ...overrides };
}

describe('filterTasks', () => {
  it('默认（all + 空关键词）返回全部任务且顺序不变', () => {
    const tasks = [makeTask(), makeTask(), makeTask()];
    const result = filterTasks(tasks, DEFAULT_FILTER_OPTIONS);
    expect(result.map((task) => task.id)).toEqual(tasks.map((task) => task.id));
  });

  it('按分类筛选', () => {
    const tasks = [
      makeTask({ category: 'work' }),
      makeTask({ category: 'life' }),
      makeTask({ category: 'work' }),
    ];
    const result = filterTasks(tasks, {
      filters: filters({ category: 'work' }),
      keyword: '',
    });
    expect(result).toHaveLength(2);
    expect(result.every((task) => task.category === 'work')).toBe(true);
  });

  it('按优先级筛选', () => {
    const tasks = [
      makeTask({ priority: 'high' }),
      makeTask({ priority: 'low' }),
      makeTask({ priority: 'high' }),
    ];
    const result = filterTasks(tasks, {
      filters: filters({ priority: 'high' }),
      keyword: '',
    });
    expect(result.map((task) => task.id)).toEqual([tasks[0].id, tasks[2].id]);
  });

  it('按状态筛选：active / completed', () => {
    const done = makeTask({ completed: true, completedAt: '2026-01-02T00:00:00.000Z' });
    const tasks = [makeTask(), done, makeTask()];

    const active = filterTasks(tasks, { filters: filters({ status: 'active' }), keyword: '' });
    const completed = filterTasks(tasks, {
      filters: filters({ status: 'completed' }),
      keyword: '',
    });

    expect(active).toHaveLength(2);
    expect(active.every((task) => !task.completed)).toBe(true);
    expect(completed).toEqual([done]);
  });

  it('三维 AND：分类 × 优先级 × 状态同时满足才命中', () => {
    const target = makeTask({
      category: 'work',
      priority: 'high',
      completed: false,
    });
    const tasks = [
      target,
      makeTask({ category: 'work', priority: 'low' }),
      makeTask({ category: 'life', priority: 'high' }),
      makeTask({
        category: 'work',
        priority: 'high',
        completed: true,
        completedAt: '2026-01-02T00:00:00.000Z',
      }),
    ];

    const result = filterTasks(tasks, {
      filters: filters({ category: 'work', priority: 'high', status: 'active' }),
      keyword: '',
    });

    expect(result).toEqual([target]);
  });

  it('关键词匹配标题与描述、不区分大小写，并与三维筛选叠加为 AND', () => {
    const match = makeTask({
      title: '写周报 Report',
      description: '整理本周进展',
      category: 'work',
    });
    const tasks = [
      match,
      makeTask({ title: '买牛奶', description: 'report 附件' }),
      makeTask({ title: '写日报', category: 'work' }),
    ];

    const byKeyword = filterTasks(tasks, { filters: DEFAULT_FILTERS, keyword: 'report' });
    expect(byKeyword).toHaveLength(2);

    const combined = filterTasks(tasks, {
      filters: filters({ category: 'work' }),
      keyword: 'REPORT',
    });
    expect(combined).toEqual([match]);
  });

  it('关键词首尾空白被 trim，纯空白等同空关键词', () => {
    const tasks = [makeTask({ title: '唯一任务' })];
    const result = filterTasks(tasks, { filters: DEFAULT_FILTERS, keyword: '   ' });
    expect(result).toEqual(tasks);
  });

  it('不修改输入数组（无副作用）', () => {
    const tasks = [makeTask(), makeTask({ category: 'work' })];
    const snapshot = [...tasks];
    filterTasks(tasks, { filters: filters({ category: 'work' }), keyword: 'x' });
    expect(tasks).toEqual(snapshot);
  });
});
