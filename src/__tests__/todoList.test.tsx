import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { TodoItem } from '../components/TodoItem';
import { TodoList } from '../components/TodoList';
import { DEFAULT_FILTERS } from '../constants/options';
import { useTodoStore } from '../store/useTodoStore';
import type { Task } from '../types/todo';
import { makeTask } from './helpers';

const callbacks = {
  onToggle: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

function renderItem(task: Task) {
  return render(
    <ul>
      <TodoItem task={task} {...callbacks} />
    </ul>,
  );
}

describe('TodoItem', () => {
  it('渲染标题、描述摘要 · 截止日期、优先级 / 分类标签与操作按钮', () => {
    const task = makeTask({
      title: '写周报',
      description: '给团队的周报',
      dueDate: '2026-11-16',
      priority: 'high',
      category: 'work',
    });
    renderItem(task);

    expect(screen.getByText('写周报')).not.toBeNull();
    expect(screen.getByText('给团队的周报 · 截止 11-16')).not.toBeNull();
    expect(screen.getByText('高')).not.toBeNull();
    expect(screen.getByText('工作')).not.toBeNull();
    expect(screen.getByRole('button', { name: '编辑「写周报」' })).not.toBeNull();
    expect(screen.getByRole('button', { name: '删除「写周报」' })).not.toBeNull();
  });

  it('无描述且无截止日期时不渲染摘要行', () => {
    renderItem(makeTask({ title: '只填标题' }));
    expect(screen.queryByText(/截止/)).toBeNull();
  });

  it('复选框派发 toggle，且仍可取消完成', () => {
    const task = makeTask({
      title: '买牛奶',
      completed: true,
      completedAt: '2026-01-02T00:00:00.000Z',
    });
    renderItem(task);

    const checkbox = screen.getByLabelText('取消完成「买牛奶」') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(callbacks.onToggle).toHaveBeenLastCalledWith(task.id);
  });

  it('已完成态：删除线 + 隐藏编辑入口，删除仍可用', () => {
    const task = makeTask({
      title: '已完成任务',
      completed: true,
      completedAt: '2026-01-02T00:00:00.000Z',
    });
    renderItem(task);

    expect(screen.getByText('已完成任务').className).toContain('line-through');
    expect(screen.queryByRole('button', { name: '编辑「已完成任务」' })).toBeNull();
    expect(screen.getByRole('button', { name: '删除「已完成任务」' })).not.toBeNull();
  });

  it('编辑 / 删除按钮回传当前任务对象', () => {
    const task = makeTask({ title: '待编辑' });
    renderItem(task);

    fireEvent.click(screen.getByRole('button', { name: '编辑「待编辑」' }));
    expect(callbacks.onEdit).toHaveBeenLastCalledWith(task);

    fireEvent.click(screen.getByRole('button', { name: '删除「待编辑」' }));
    expect(callbacks.onDelete).toHaveBeenLastCalledWith(task);
  });
});

describe('TodoList', () => {
  it('按传入顺序渲染，key 不影响可见顺序', () => {
    const first = makeTask({ id: 'a', title: '任务 A' });
    const second = makeTask({ id: 'b', title: '任务 B' });
    render(<TodoList tasks={[first, second]} {...callbacks} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('任务 A');
    expect(items[1].textContent).toContain('任务 B');
  });

  it('空列表不渲染容器', () => {
    render(<TodoList tasks={[]} {...callbacks} />);
    expect(screen.queryByRole('list')).toBeNull();
  });
});

describe('App 列表接入', () => {
  afterEach(() => {
    cleanup();
    useTodoStore.setState({ tasks: [], filters: { ...DEFAULT_FILTERS }, keyword: '' });
  });

  function seed(tasks: Task[]) {
    useTodoStore.setState({ tasks, filters: { ...DEFAULT_FILTERS }, keyword: '' });
  }

  it('勾选后元素位置不变，completedAt 同步写入', () => {
    seed([makeTask({ id: 'a', title: '任务 A' }), makeTask({ id: 'b', title: '任务 B' })]);
    render(<App />);

    fireEvent.click(screen.getByLabelText('完成「任务 A」'));

    const state = useTodoStore.getState();
    expect(state.tasks.map((task) => task.id)).toEqual(['a', 'b']);
    expect(state.tasks[0].completed).toBe(true);
    expect(state.tasks[0].completedAt).not.toBeNull();
  });

  it('再次点击可取消完成，completedAt 置空', () => {
    seed([makeTask({ id: 'a', title: '任务 A' })]);
    render(<App />);

    fireEvent.click(screen.getByLabelText('完成「任务 A」'));
    fireEvent.click(screen.getByLabelText('取消完成「任务 A」'));

    const state = useTodoStore.getState();
    expect(state.tasks[0].completed).toBe(false);
    expect(state.tasks[0].completedAt).toBeNull();
  });

  it('删除走二次确认：含任务名、注明不可撤销；取消则不删除', () => {
    seed([makeTask({ id: 'a', title: '任务 A' })]);
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '删除「任务 A」' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('任务 A');
    expect(dialog.textContent).toContain('不可撤销');

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(useTodoStore.getState().tasks).toHaveLength(1);
  });

  it('确认删除后移除任务并弹出 Toast 反馈', () => {
    seed([makeTask({ id: 'a', title: '任务 A' })]);
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '删除「任务 A」' }));
    fireEvent.click(screen.getByRole('button', { name: '删除' }));

    expect(useTodoStore.getState().tasks).toEqual([]);
    expect(screen.getByRole('status').textContent).toContain('已删除「任务 A」');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
