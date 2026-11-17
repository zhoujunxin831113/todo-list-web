import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { FilterBar } from '../components/FilterBar';
import { FilterPanel } from '../components/FilterPanel';
import { SearchBar } from '../components/SearchBar';
import { DEFAULT_FILTERS } from '../constants/options';
import { useTodoStore } from '../store/useTodoStore';
import type { Filters } from '../types/todo';

const ACTIVE_FILTERS: Filters = { category: 'work', priority: 'high', status: 'active' };

describe('SearchBar', () => {
  it('输入即时回调；无内容时不显示清除按钮', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('搜索任务'), { target: { value: '周报' } });
    expect(onChange).toHaveBeenCalledWith('周报');
    expect(screen.queryByRole('button', { name: '清除搜索' })).toBeNull();
  });

  it('有内容时可一键清空关键词', () => {
    const onChange = vi.fn();
    render(<SearchBar value="周报" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '清除搜索' }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('无可见标签但保留屏幕阅读器名称', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('搜索任务')).not.toBeNull();
  });
});

describe('FilterBar', () => {
  it('分类按钮组：点击只回传被改动的 category（其余维度不动）', () => {
    const onFilterChange = vi.fn();
    render(
      <FilterBar
        filters={DEFAULT_FILTERS}
        canClear={false}
        onFilterChange={onFilterChange}
        onClear={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '工作' }));
    expect(onFilterChange).toHaveBeenLastCalledWith({ category: 'work' });

    fireEvent.click(screen.getByRole('button', { name: '全部任务' }));
    expect(onFilterChange).toHaveBeenLastCalledWith({ category: 'all' });
  });

  it('选中的分类按钮以 aria-pressed 标注', () => {
    render(
      <FilterBar
        filters={{ ...DEFAULT_FILTERS, category: 'work' }}
        canClear={false}
        onFilterChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '工作' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(
      screen.getByRole('button', { name: '全部任务' }).getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('优先级 / 状态下拉含「全部」占位 + 各自枚举文案', () => {
    render(
      <FilterBar
        filters={DEFAULT_FILTERS}
        canClear={false}
        onFilterChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    const priority = screen.getByLabelText('优先级') as HTMLSelectElement;
    expect(Array.from(priority.options, (option) => option.textContent)).toEqual([
      '全部优先级',
      '高',
      '中',
      '低',
    ]);

    const status = screen.getByLabelText('状态') as HTMLSelectElement;
    expect(Array.from(status.options, (option) => option.textContent)).toEqual([
      '全部',
      '未完成',
      '已完成',
    ]);
  });

  it('下拉变更只回传对应维度', () => {
    const onFilterChange = vi.fn();
    render(
      <FilterBar
        filters={DEFAULT_FILTERS}
        canClear={false}
        onFilterChange={onFilterChange}
        onClear={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('优先级'), { target: { value: 'high' } });
    expect(onFilterChange).toHaveBeenLastCalledWith({ priority: 'high' });

    fireEvent.change(screen.getByLabelText('状态'), { target: { value: 'completed' } });
    expect(onFilterChange).toHaveBeenLastCalledWith({ status: 'completed' });
  });

  it('仅在有筛选条件时展示「清除筛选」，点击派发清除', () => {
    const onClear = vi.fn();
    const { rerender } = render(
      <FilterBar
        filters={DEFAULT_FILTERS}
        canClear={false}
        onFilterChange={vi.fn()}
        onClear={onClear}
      />,
    );
    expect(screen.queryByRole('button', { name: '清除筛选' })).toBeNull();

    rerender(
      <FilterBar filters={ACTIVE_FILTERS} canClear onFilterChange={vi.fn()} onClear={onClear} />,
    );
    fireEvent.click(screen.getByRole('button', { name: '清除筛选' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe('FilterPanel', () => {
  it('组合分类筛选卡片，标题为「分类筛选」', () => {
    render(
      <FilterPanel
        filters={DEFAULT_FILTERS}
        canClear={false}
        onFilterChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('筛选任务')).not.toBeNull();
    expect(screen.getByText('分类筛选')).not.toBeNull();
    expect(screen.getByRole('button', { name: '全部任务' })).not.toBeNull();
  });
});

describe('App 筛选接入', () => {
  afterEach(() => {
    // 先卸载再复位 store，避免在 act 之外触发已挂载组件的更新
    cleanup();
    vi.useRealTimers();
    useTodoStore.setState({ filters: { ...DEFAULT_FILTERS }, keyword: '' });
  });

  it('搜索输入写入 store 的 keyword', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('搜索任务'), { target: { value: '周报' } });
    expect(useTodoStore.getState().keyword).toBe('周报');
  });

  it('分类按钮写入 store 的 filters.category', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '学习' }));
    expect(useTodoStore.getState().filters.category).toBe('study');
  });

  it('清除筛选：三维与关键词全部复位，并弹出 Toast 反馈', () => {
    useTodoStore.setState({ filters: { ...ACTIVE_FILTERS }, keyword: '周报' });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '清除筛选' }));

    expect(useTodoStore.getState().filters).toEqual(DEFAULT_FILTERS);
    expect(useTodoStore.getState().keyword).toBe('');
    expect(screen.getByRole('status').textContent).toContain('已清除筛选条件');
  });

  it('Toast 在 2.5s 后自动消失', async () => {
    vi.useFakeTimers();
    useTodoStore.setState({ filters: { ...ACTIVE_FILTERS }, keyword: '' });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '清除筛选' }));
    expect(screen.getByRole('status')).not.toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.queryByRole('status')).toBeNull();
  });
});
