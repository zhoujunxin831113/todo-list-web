import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { Input } from '../components/ui/Input';
import { Tag } from '../components/ui/Tag';
import { EmptyState } from '../components/EmptyState';

describe('Button', () => {
  it('默认 type=button，避免在表单内误触发提交', () => {
    render(<Button>保存</Button>);
    expect(screen.getByRole('button', { name: '保存' }).getAttribute('type')).toBe('button');
  });

  it('支持提交类型、禁用态与无障碍名称', () => {
    render(
      <>
        <Button type="submit">提交</Button>
        <Button disabled>不可用</Button>
        <Button size="icon" aria-label="删除任务">
          ×
        </Button>
      </>,
    );

    expect(screen.getByRole('button', { name: '提交' }).getAttribute('type')).toBe('submit');
    expect(screen.getByRole('button', { name: '不可用' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: '删除任务' }).getAttribute('aria-label')).toBe(
      '删除任务',
    );
  });
});

describe('Input', () => {
  it('label 通过 htmlFor 关联输入框', () => {
    render(<Input label="标题" />);
    const input = screen.getByLabelText('标题');
    expect(input.hasAttribute('id')).toBe(true);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
  });

  it('校验失败：aria-invalid + aria-describedby 指向行内提示', () => {
    render(<Input label="标题" error="标题不能为空" />);

    const input = screen.getByLabelText('标题');
    const alert = screen.getByRole('alert');

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(alert.id);
    expect(alert.textContent).toContain('标题不能为空');
  });
});

describe('Tag', () => {
  it('以胶囊标签展示文本，并区分优先级语义 tone', () => {
    render(
      <>
        <Tag tone="high">高</Tag>
        <Tag tone="medium">中</Tag>
        <Tag tone="low">低</Tag>
        <Tag tone="category">工作</Tag>
      </>,
    );

    expect(screen.getByText('高')).not.toBeNull();
    expect(screen.getByText('中')).not.toBeNull();
    expect(screen.getByText('低')).not.toBeNull();
    expect(screen.getByText('工作')).not.toBeNull();
  });
});

describe('Checkbox', () => {
  it('原生 checkbox + label：点击可切换，label 可关联', () => {
    render(<Checkbox label="标记完成" />);

    const checkbox = screen.getByLabelText('标记完成');
    expect(checkbox).toHaveProperty('checked', false);

    fireEvent.click(checkbox);
    expect(checkbox).toHaveProperty('checked', true);
  });

  it('无可见文案时以 aria-label 提供无障碍名称', () => {
    render(<Checkbox aria-label="完成 买牛奶" />);
    expect(screen.getByLabelText('完成 买牛奶').getAttribute('type')).toBe('checkbox');
  });
});

describe('EmptyState', () => {
  it('渲染图标、标题、描述与行动按钮，按钮可点击', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        icon={<span>icon</span>}
        title="还没有任务"
        description="点击下方按钮创建第一条待办"
        actionLabel="新建任务"
        onAction={onAction}
      />,
    );

    expect(screen.getByText('还没有任务')).not.toBeNull();
    expect(screen.getByText('点击下方按钮创建第一条待办')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '新建任务' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('无行动按钮时不渲染按钮', () => {
    render(<EmptyState title="暂无内容" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
