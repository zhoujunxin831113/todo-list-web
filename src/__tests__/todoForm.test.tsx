import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { TodoFormModal } from '../components/TodoFormModal';
import { DEFAULT_FILTERS } from '../constants/options';
import { useTodoStore } from '../store/useTodoStore';
import type { Task } from '../types/todo';
import { makeTask } from './helpers';

function setup(task: Task | null = null) {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  const utils = render(<TodoFormModal open task={task} onSubmit={onSubmit} onClose={onClose} />);
  return { ...utils, onSubmit, onClose };
}

describe('TodoFormModal 新建', () => {
  it('打开即聚焦标题，默认优先级「中」、分类「其他」，描述与日期为空', () => {
    setup();

    const title = screen.getByLabelText('标题');
    expect(document.activeElement).toBe(title);
    expect((title as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('优先级') as HTMLSelectElement).value).toBe('medium');
    expect((screen.getByLabelText('分类') as HTMLSelectElement).value).toBe('other');
    expect((screen.getByLabelText('截止日期') as HTMLInputElement).value).toBe('');
  });

  it('只填标题即可提交，标题去首尾空格', () => {
    const { onSubmit } = setup();

    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '  买牛奶  ' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: '买牛奶',
      description: '',
      dueDate: null,
      priority: 'medium',
      category: 'other',
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('空标题与纯空白标题均被拦截并提示', () => {
    const { onSubmit } = setup();

    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByRole('alert').textContent).toContain('请输入任务标题');
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByRole('alert').textContent).toContain('请输入任务标题');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('超长标题与超长描述被拦截，并在字段上声明上限', () => {
    const { onSubmit } = setup();

    const titleInput = screen.getByLabelText('标题') as HTMLInputElement;
    expect(titleInput.getAttribute('maxlength')).toBe('100');
    expect((screen.getByLabelText('描述') as HTMLTextAreaElement).getAttribute('maxlength')).toBe(
      '500',
    );

    fireEvent.change(titleInput, { target: { value: 'a'.repeat(101) } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByRole('alert').textContent).toContain('标题最多 100 字');

    fireEvent.change(titleInput, { target: { value: '正常标题' } });
    fireEvent.change(screen.getByLabelText('描述'), { target: { value: 'd'.repeat(501) } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByRole('alert').textContent).toContain('描述最多 500 字');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('字段顺序固定：标题 → 描述 → 截止日期 → 优先级 → 分类', () => {
    const { container } = setup();

    const labels = Array.from(container.querySelectorAll('label'), (label) => label.textContent);
    expect(labels).toEqual(['标题', '描述', '截止日期', '优先级', '分类']);
  });

  it('截止日期可清空，提交时为 null', () => {
    const { onSubmit } = setup();

    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '交作业' } });
    fireEvent.change(screen.getByLabelText('截止日期'), { target: { value: '2026-11-20' } });

    const clearButton = screen.getByRole('button', { name: '清除' }) as HTMLButtonElement;
    expect(clearButton.disabled).toBe(false);
    fireEvent.click(clearButton);

    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: '交作业', dueDate: null }),
    );
  });
});

describe('TodoFormModal 编辑', () => {
  it('编辑预填全部字段，原样保存提交同一份数据', () => {
    const task = makeTask({
      id: 'edit-1',
      title: '写周报',
      description: '给团队的周报',
      dueDate: '2026-11-16',
      priority: 'high',
      category: 'work',
    });
    const { onSubmit } = setup(task);

    expect(screen.getByRole('dialog')).not.toBeNull();
    expect(screen.getByText('编辑任务')).not.toBeNull();
    expect((screen.getByLabelText('标题') as HTMLInputElement).value).toBe('写周报');
    expect((screen.getByLabelText('描述') as HTMLTextAreaElement).value).toBe('给团队的周报');
    expect((screen.getByLabelText('截止日期') as HTMLInputElement).value).toBe('2026-11-16');
    expect((screen.getByLabelText('优先级') as HTMLSelectElement).value).toBe('high');
    expect((screen.getByLabelText('分类') as HTMLSelectElement).value).toBe('work');

    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(onSubmit).toHaveBeenCalledWith({
      title: '写周报',
      description: '给团队的周报',
      dueDate: '2026-11-16',
      priority: 'high',
      category: 'work',
    });
  });

  it('修改字段后保存提交新值', () => {
    const task = makeTask({ id: 'edit-2', title: '旧标题' });
    const { onSubmit } = setup(task);

    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '新标题' } });
    fireEvent.change(screen.getByLabelText('优先级'), { target: { value: 'low' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: '新标题', priority: 'low' }),
    );
  });
});

describe('TodoFormModal 关闭与放弃编辑', () => {
  it('未修改时「取消」直接关闭，不弹确认', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: '放弃编辑？' })).toBeNull();
  });

  it('有未保存修改时取消 → 二次确认；继续编辑保留内容', () => {
    const { onClose } = setup();

    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '草稿' } });
    fireEvent.click(screen.getByRole('button', { name: '取消' }));

    const confirm = screen.getByRole('dialog');
    expect(confirm.textContent).toContain('放弃编辑？');
    expect(confirm.textContent).toContain('不可撤销');
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '继续编辑' }));

    expect((screen.getByLabelText('标题') as HTMLInputElement).value).toBe('草稿');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('确认「放弃修改」才真正关闭', () => {
    const { onClose, onSubmit } = setup();

    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '草稿' } });
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    fireEvent.click(screen.getByRole('button', { name: '放弃修改' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('Esc：无修改直接关闭；有修改走二次确认', () => {
    const first = setup();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(first.onClose).toHaveBeenCalledTimes(1);
    cleanup();

    const second = setup();
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '草稿' } });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(second.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog').textContent).toContain('放弃编辑？');
  });
});

describe('App 表单接入', () => {
  afterEach(() => {
    cleanup();
    useTodoStore.setState({ tasks: [], filters: { ...DEFAULT_FILTERS }, keyword: '' });
  });

  it('「新建任务」打开表单，保存后插入列表顶部', () => {
    useTodoStore.setState({ tasks: [makeTask({ id: 'old', title: '旧任务' })] });
    render(<App />);

    // 工具栏按钮与移动端悬浮按钮同名，DOM 中工具栏在前
    fireEvent.click(screen.getAllByRole('button', { name: '新建任务' })[0]);
    expect(screen.getByRole('heading', { name: '新建任务' })).not.toBeNull();

    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '买牛奶' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    const state = useTodoStore.getState();
    expect(state.tasks).toHaveLength(2);
    expect(state.tasks[0].title).toBe('买牛奶');
    expect(state.tasks[1].title).toBe('旧任务');
    expect(state.tasks[0].completed).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('已创建「买牛奶」');
  });

  it('空标题保存被拦截，store 不新增任务', () => {
    render(<App />);

    // 工具栏按钮与移动端悬浮按钮同名，DOM 中工具栏在前
    fireEvent.click(screen.getAllByRole('button', { name: '新建任务' })[0]);
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByRole('alert').textContent).toContain('请输入任务标题');
    expect(useTodoStore.getState().tasks).toHaveLength(0);
    expect(screen.getByRole('dialog')).not.toBeNull();
  });

  it('编辑保存后原地更新，列表位置不变', () => {
    useTodoStore.setState({
      tasks: [makeTask({ id: 'a', title: '任务 A' }), makeTask({ id: 'b', title: '任务 B' })],
    });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '编辑「任务 A」' }));
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '任务 A2' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    const state = useTodoStore.getState();
    expect(state.tasks.map((task) => task.id)).toEqual(['a', 'b']);
    expect(state.tasks[0].title).toBe('任务 A2');
    expect(screen.getByRole('status').textContent).toContain('已保存「任务 A2」');
  });

  it('修改后取消编辑需确认，放弃后 store 不变', () => {
    useTodoStore.setState({ tasks: [makeTask({ id: 'a', title: '任务 A' })] });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '编辑「任务 A」' }));
    fireEvent.change(screen.getByLabelText('标题'), { target: { value: '不该保存' } });
    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    fireEvent.click(screen.getByRole('button', { name: '放弃修改' }));

    expect(useTodoStore.getState().tasks[0].title).toBe('任务 A');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
