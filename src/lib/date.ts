import { format, isValid, parseISO } from 'date-fns';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    DATE_PATTERN.test(value) &&
    // 禁止 new Date('yyyy-MM-dd')：UTC 解析在东八区会偏移一天，统一走 parseISO。
    isValid(parseISO(value))
  );
}

/** 字典序比较即时间序；返回负数表示 a 早于 b。null 不参与排序比较。 */
export function compareDateString(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 列表摘要展示，如 2026-11-16 → 11-16（PRD 4.3 线稿口径）。 */
export function formatDueDate(value: string): string {
  return format(parseISO(value), 'MM-dd');
}
