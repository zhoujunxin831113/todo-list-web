import { useEffect, useState } from 'react';

export const DEBOUNCE_DELAY_MS = 250;

/**
 * 值防抖：输入停止 delay 毫秒后才输出新值，连续输入只保留最后一次（PRD 4.x 搜索 250ms）。
 * 首次渲染直接返回传入值，避免搜索框初始状态出现空窗。
 */
export function useDebounce<T>(value: T, delay: number = DEBOUNCE_DELAY_MS): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
