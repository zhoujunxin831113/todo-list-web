import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_FILTERS } from '../constants/options';
import { useDerivedTodos } from '../hooks/useDerivedTodos';
import { filterTasks } from '../lib/filter';
import { computeStats } from '../lib/stats';
import type { Filters } from '../types/todo';
import { makeTask } from './helpers';

function filters(overrides: Partial<Filters> = {}): Filters {
  return { ...DEFAULT_FILTERS, ...overrides };
}

describe('useDerivedTodos', () => {
  describe('统计口径', () => {
    it('空列表：可见任务为空，四项统计全 0（完成率不出现 NaN）', () => {
      const { result } = renderHook(() => useDerivedTodos([], filters(), ''));
      expect(result.current.visibleTasks).toEqual([]);
      expect(result.current.stats).toEqual({ total: 0, active: 0, completed: 0, rate: 0 });
    });

    it('统计恒基于全量 tasks，不受三维筛选影响（PRD 2.3 规则 1）', () => {
      const tasks = [
        makeTask({ category: 'work' }),
        makeTask({ category: 'life', completed: true, completedAt: '2026-01-02T00:00:00.000Z' }),
        makeTask({ category: 'work' }),
        makeTask({ category: 'study', completed: true, completedAt: '2026-01-03T00:00:00.000Z' }),
      ];

      const { result } = renderHook(() =>
        useDerivedTodos(tasks, filters({ category: 'work' }), ''),
      );

      // 视图只剩 2 条 work，但统计仍是 4 条全量
      expect(result.current.visibleTasks).toHaveLength(2);
      expect(result.current.stats).toEqual({
        total: 4,
        active: 2,
        completed: 2,
        rate: 50,
      });
    });

    it('统计同样不受关键词搜索影响', () => {
      const tasks = [
        makeTask({ title: '周报', category: 'work' }),
        makeTask({ title: '买牛奶', category: 'life' }),
        makeTask({
          title: '写代码',
          category: 'work',
          completed: true,
          completedAt: '2026-01-02T00:00:00.000Z',
        }),
      ];

      const { result } = renderHook(() => useDerivedTodos(tasks, filters(), '牛奶'));

      expect(result.current.visibleTasks).toHaveLength(1);
      expect(result.current.stats.total).toBe(3);
      expect(result.current.stats.rate).toBe(33);
    });

    it('全完成时完成率为 100，即使状态筛选为「未完成」导致列表为空', () => {
      const tasks = [
        makeTask({ completed: true, completedAt: '2026-01-02T00:00:00.000Z' }),
        makeTask({ completed: true, completedAt: '2026-01-03T00:00:00.000Z' }),
      ];

      const { result } = renderHook(() =>
        useDerivedTodos(tasks, filters({ status: 'active' }), ''),
      );

      expect(result.current.visibleTasks).toEqual([]);
      expect(result.current.stats).toEqual({ total: 2, active: 0, completed: 2, rate: 100 });
    });
  });

  describe('可见任务', () => {
    it('三维 AND + 关键词叠加，只命中全部条件满足的任务', () => {
      const target = makeTask({ title: '写周报 Report', category: 'work', priority: 'high' });
      const tasks = [
        target,
        makeTask({ title: '写周报', category: 'work', priority: 'low' }),
        makeTask({ title: '写周报', category: 'life', priority: 'high' }),
        makeTask({
          title: '写周报',
          category: 'work',
          priority: 'high',
          completed: true,
          completedAt: '2026-01-02T00:00:00.000Z',
        }),
      ];

      const { result } = renderHook(() =>
        useDerivedTodos(
          tasks,
          filters({ category: 'work', priority: 'high', status: 'active' }),
          'report',
        ),
      );

      expect(result.current.visibleTasks).toEqual([target]);
    });

    it('保持 store 中原始顺序，不排序', () => {
      const tasks = [
        makeTask({ title: 'A' }),
        makeTask({ title: 'B', category: 'work' }),
        makeTask({ title: 'C' }),
        makeTask({ title: 'D', category: 'work' }),
      ];

      const { result } = renderHook(() =>
        useDerivedTodos(tasks, filters({ category: 'work' }), ''),
      );

      expect(result.current.visibleTasks.map((task) => task.title)).toEqual(['B', 'D']);
    });

    it('单次遍历结果与纯函数 filterTasks + computeStats 口径一致', () => {
      const tasks = [
        makeTask({ title: '周报', description: '', category: 'work', priority: 'high' }),
        makeTask({ title: '购物', description: 'REPORT 附件', category: 'life' }),
        makeTask({
          title: '复习',
          category: 'study',
          priority: 'low',
          completed: true,
          completedAt: '2026-01-02T00:00:00.000Z',
        }),
        makeTask({ title: '收拾', category: 'other' }),
      ];
      const current = filters({ priority: 'high' });
      const keyword = ' report ';

      const { result } = renderHook(() => useDerivedTodos(tasks, current, keyword));

      expect(result.current.visibleTasks).toEqual(
        filterTasks(tasks, { filters: current, keyword }),
      );
      expect(result.current.stats).toEqual(computeStats(tasks));
    });
  });

  describe('关键词防抖', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('筛选维度即时生效，关键词 250ms 后才收窄列表', () => {
      const tasks = [
        makeTask({ title: '周报', category: 'work' }),
        makeTask({ title: '买牛奶', category: 'work' }),
        makeTask({ title: '买牛奶', category: 'life' }),
      ];

      const { result, rerender } = renderHook(
        ({ keyword }: { keyword: string }) =>
          useDerivedTodos(tasks, filters({ category: 'work' }), keyword),
        { initialProps: { keyword: '' } },
      );

      // 分类筛选立即生效：work 共 2 条
      expect(result.current.visibleTasks).toHaveLength(2);

      rerender({ keyword: '牛奶' });
      // 未满 250ms，关键词尚未生效
      expect(result.current.visibleTasks).toHaveLength(2);

      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(result.current.visibleTasks).toHaveLength(1);
      expect(result.current.visibleTasks[0].title).toBe('买牛奶');
      // 统计仍为全量 3 条
      expect(result.current.stats.total).toBe(3);
    });
  });
});
