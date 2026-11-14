import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '../components/ConfirmDialog';

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  return render(
    <ConfirmDialog
      open
      title="删除任务"
      description="「买牛奶」将被永久移除，此操作不可撤销。"
      confirmLabel="删除"
      tone="danger"
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />,
  );
}

describe('ConfirmDialog', () => {
  it('渲染为可访问模态：role=dialog + aria-modal + 标题/描述关联', () => {
    renderDialog();

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const title = screen.getByText('删除任务');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);

    const description = screen.getByText(/不可撤销/);
    expect(dialog.getAttribute('aria-describedby')).toBe(description.id);
  });

  it('打开时焦点落在「取消」（破坏性操作的默认安全项）', () => {
    renderDialog();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '取消' }));
  });

  it('Esc 触发取消', () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Tab 焦点陷阱：首尾循环，不逃逸出对话框', () => {
    renderDialog();

    const cancel = screen.getByRole('button', { name: '取消' });
    const confirm = screen.getByRole('button', { name: '删除' });

    // 当前在首个元素，Shift+Tab 回绕到最后一个
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirm);

    // 当前在最后一个元素，Tab 回绕到第一个
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(cancel);
  });

  it('确认与取消分别派发回调', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderDialog({ onConfirm, onCancel });

    fireEvent.click(screen.getByRole('button', { name: '删除' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '取消' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('点击遮罩（非内容区）视为取消', () => {
    const onCancel = vi.fn();
    const { container } = renderDialog({ onCancel });

    fireEvent.mouseDown(container.firstElementChild as Element);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('关闭后焦点归还触发元素', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            删除任务
          </button>
          <ConfirmDialog
            open={open}
            title="确认删除"
            confirmLabel="删除"
            onConfirm={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: '删除任务' });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog')).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('open=false 时不渲染对话框也不夺取焦点', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
