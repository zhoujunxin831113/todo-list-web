import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { Header } from '../components/Header';
import { StatCards } from '../components/StatCards';

describe('Header', () => {
  it('展示品牌标题与「数据仅存本机」提示', () => {
    render(<Header />);

    expect(screen.getByRole('heading', { level: 1, name: '待办事项' })).not.toBeNull();
    expect(screen.getByText('数据仅存本机')).not.toBeNull();
  });
});

describe('StatCards', () => {
  it('四卡常驻：总任务 / 待完成 / 已完成 / 完成率', () => {
    render(<StatCards stats={{ total: 5, active: 3, completed: 2, rate: 40 }} />);

    const group = screen.getByLabelText('任务统计');
    expect(group).not.toBeNull();
    expect(screen.getByText('总任务')).not.toBeNull();
    expect(screen.getByText('待完成')).not.toBeNull();
    expect(screen.getByText('已完成')).not.toBeNull();
    expect(screen.getByText('完成率')).not.toBeNull();
    expect(screen.getByText('40%')).not.toBeNull();
  });

  it('总数为 0 时完成率显示 0%，进度条为 0 且不出现 NaN', () => {
    render(<StatCards stats={{ total: 0, active: 0, completed: 0, rate: 0 }} />);

    expect(screen.getByText('0%')).not.toBeNull();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(screen.queryByText('NaN%')).toBeNull();
  });

  it('全部完成时完成率为 100%，进度条同步', () => {
    render(<StatCards stats={{ total: 3, active: 0, completed: 3, rate: 100 }} />);

    expect(screen.getByText('100%')).not.toBeNull();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
  });
});

describe('App 骨架', () => {
  it('渲染 Header 与统计面板（初始空态：四卡全 0）', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: '待办事项' })).not.toBeNull();
    expect(screen.getByLabelText('任务统计')).not.toBeNull();
    expect(screen.getByText('0%')).not.toBeNull();
  });
});
