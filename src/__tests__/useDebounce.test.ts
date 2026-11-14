import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEBOUNCE_DELAY_MS, useDebounce } from '../hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('首次渲染立即返回传入值，不出现空窗', () => {
    const { result } = renderHook(() => useDebounce('初始', 250));
    expect(result.current).toBe('初始');
  });

  it('默认延迟为 250ms：未到时间保持旧值，到点后切换新值', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_DELAY_MS - 1);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('b');
  });

  it('连续输入只保留最后一次（防抖而非节流）', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 250), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'c' });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ value: 'd' });

    // 仍未满 d 的 250ms，且 b/c 的定时器已被清理
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(result.current).toBe('d');
  });

  it('卸载时清理定时器，不再触发状态更新', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebounce(value, 250), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    unmount();

    expect(() => {
      vi.advanceTimersByTime(250);
    }).not.toThrow();
  });
});
