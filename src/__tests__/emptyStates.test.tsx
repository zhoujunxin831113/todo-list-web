import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App';
import { DEFAULT_FILTERS } from '../constants/options';
import { useTodoStore } from '../store/useTodoStore';
import { makeTask } from './helpers';

const cloneFilters = () => ({ ...DEFAULT_FILTERS });

describe('空状态', () => {
  afterEach(() => {
    cleanup();
    useTodoStore.setState({ tasks: [], filters: cloneFilters(), keyword: '' });
  });

  it('无任务：引导创建第一个任务，按钮打开表单', () => {
    render(<App />);

    expect(screen.getByText('还没有任务')).not.toBeNull();
    expect(screen.getByText('创建第一个待办事项，开始安排要做的事。')).not.toBeNull();

    // 空状态行动按钮位于工具栏按钮之后、悬浮按钮之前
    fireEvent.click(screen.getAllByRole('button', { name: '新建任务' })[1]);
    expect(screen.getByRole('heading', { name: '新建任务' })).not.toBeNull();
  });

  it('无匹配：有关键词但结果为空，给出清除筛选引导', async () => {
    useTodoStore.setState({ tasks: [makeTask({ id: 'a', title: '任务 A' })], keyword: '周报' });
    render(<App />);

    expect(screen.getByText('没有符合条件的任务')).not.toBeNull();

    // 筛选栏与空状态都有「清除筛选」，点击空状态中的引导按钮（DOM 中靠后）
    const clearButtons = screen.getAllByRole('button', { name: '清除筛选' });
    expect(clearButtons).toHaveLength(2);
    fireEvent.click(clearButtons[1]);

    expect(useTodoStore.getState().keyword).toBe('');
    expect(screen.getByRole('status').textContent).toContain('已清除筛选条件');
    // 关键词过滤有 250ms 防抖，等待列表恢复
    await waitFor(() => expect(screen.getByText('任务 A')).not.toBeNull());
  });

  it('按「未完成」筛选且全部已完成时进入「全部任务已完成」', () => {
    useTodoStore.setState({
      tasks: [
        makeTask({
          id: 'a',
          title: '任务 A',
          completed: true,
          completedAt: '2026-01-01T00:00:00.000Z',
        }),
      ],
      filters: { ...DEFAULT_FILTERS, status: 'active' },
    });
    render(<App />);

    expect(screen.getByText('全部任务已完成')).not.toBeNull();
    expect(screen.queryByText('没有符合条件的任务')).toBeNull();
  });

  it('未筛选时已完成任务仍留在列表，不显示空状态', () => {
    useTodoStore.setState({
      tasks: [
        makeTask({
          id: 'a',
          title: '任务 A',
          completed: true,
          completedAt: '2026-01-01T00:00:00.000Z',
        }),
      ],
      filters: cloneFilters(),
    });
    render(<App />);

    expect(screen.getByText('任务 A')).not.toBeNull();
    expect(screen.queryByText('全部任务已完成')).toBeNull();
    expect(screen.queryByText('还没有任务')).toBeNull();
  });
});

describe('响应式骨架', () => {
  afterEach(() => {
    cleanup();
    useTodoStore.setState({ tasks: [], filters: cloneFilters(), keyword: '' });
  });

  it('内容区 720px 起步、≥1024 收窄到 1080px', () => {
    render(<App />);

    const main = screen.getByRole('main');
    expect(main.className).toContain('max-w-[720px]');
    expect(main.className).toContain('lg:max-w-[1080px]');
  });

  it('<640 用右下角悬浮新建按钮，工具栏按钮在 ≥640 才显示', () => {
    render(<App />);

    const floating = screen.getAllByRole('button', { name: '新建任务' })[2];
    expect(floating.className).toContain('sm:hidden');
    expect(floating.className).toContain('fixed');
    expect(floating.className).toContain('rounded-pill');

    const toolbarButton = screen.getAllByRole('button', { name: '新建任务' })[0];
    expect(toolbarButton.className).toContain('hidden');
    expect(toolbarButton.className).toContain('sm:inline-flex');

    fireEvent.click(floating);
    expect(screen.getByRole('heading', { name: '新建任务' })).not.toBeNull();
  });
});
