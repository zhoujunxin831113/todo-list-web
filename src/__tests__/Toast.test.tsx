import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toast } from '../components/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('以 role=status 展示文案（非阻断的礼貌播报）', () => {
    render(<Toast open message="已保存" onClose={vi.fn()} />);

    const toast = screen.getByRole('status');
    expect(toast.getAttribute('aria-live')).toBe('polite');
    expect(toast.textContent).toContain('已保存');
  });

  it('默认 2500ms 后自动关闭，未到时间不触发', () => {
    const onClose = vi.fn();
    render(<Toast open message="已删除" onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(2499);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('自定义 duration 生效', () => {
    const onClose = vi.fn();
    render(<Toast open message="已保存" duration={3000} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('open=false 不渲染且不设定时器', () => {
    const onClose = vi.fn();
    render(<Toast open={false} message="不应出现" onClose={onClose} />);

    expect(screen.queryByRole('status')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('卸载时清理定时器', () => {
    const onClose = vi.fn();
    const { unmount } = render(<Toast open message="提示" onClose={onClose} />);

    unmount();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
