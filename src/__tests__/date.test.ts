import { describe, expect, it } from 'vitest';
import { compareDateString, formatDueDate, isValidDateString } from '../lib/date';

describe('isValidDateString', () => {
  it('接受合法 YYYY-MM-DD（含闰年 2-29）', () => {
    expect(isValidDateString('2026-11-14')).toBe(true);
    expect(isValidDateString('2024-02-29')).toBe(true);
  });

  it('拒绝不存在的日期、错误格式与非字符串', () => {
    expect(isValidDateString('2026-02-29')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('2026-2-1')).toBe(false);
    expect(isValidDateString('2026-11-14T00:00:00Z')).toBe(false);
    expect(isValidDateString(null)).toBe(false);
    expect(isValidDateString(20261114)).toBe(false);
  });
});

describe('compareDateString', () => {
  it('字典序即时间序，覆盖跨月末', () => {
    expect(compareDateString('2026-01-31', '2026-02-01')).toBe(-1);
    expect(compareDateString('2026-02-01', '2026-01-31')).toBe(1);
    expect(compareDateString('2026-11-14', '2026-11-14')).toBe(0);
    expect(compareDateString('2026-12-31', '2027-01-01')).toBe(-1);
  });
});

describe('formatDueDate', () => {
  it('展示为 MM-dd，跨月末不发生时区偏移', () => {
    expect(formatDueDate('2026-01-31')).toBe('01-31');
    expect(formatDueDate('2026-02-01')).toBe('02-01');
    expect(formatDueDate('2026-12-01')).toBe('12-01');
  });
});
