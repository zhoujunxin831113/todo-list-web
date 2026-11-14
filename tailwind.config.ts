import type { Config } from 'tailwindcss';

// 设计令牌与 src/styles/tokens.css 的 CSS 变量一一对应，组件内只引用语义类名，不硬编码色值。
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // 仅保留 PRD 4.5 的两个断点：640 / 1024px
    screens: {
      sm: '640px',
      lg: '1024px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      primary: {
        DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
        hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
        light: 'rgb(var(--color-primary-light) / <alpha-value>)',
      },
      page: 'rgb(var(--color-page) / <alpha-value>)',
      card: 'rgb(var(--color-card) / <alpha-value>)',
      ink: {
        DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
      },
      line: 'rgb(var(--color-line) / <alpha-value>)',
      success: 'rgb(var(--color-success) / <alpha-value>)',
      danger: 'rgb(var(--color-danger) / <alpha-value>)',
      warning: 'rgb(var(--color-warning) / <alpha-value>)',
    },
    borderRadius: {
      checkbox: 'var(--radius-checkbox)',
      control: 'var(--radius-control)',
      card: 'var(--radius-card)',
      pill: 'var(--radius-pill)',
    },
    boxShadow: {
      card: 'var(--shadow-card)',
      elevated: 'var(--shadow-elevated)',
      modal: 'var(--shadow-modal)',
      'primary-glow': 'var(--shadow-primary-glow)',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '20px',
      xl: '24px',
    },
    spacing: {
      // 4px 基准网格；补齐 20/28/36/40/44/48 便于控件尺寸与 PRD 的 40px 按钮高度
      0: '0',
      '0.5': '2px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      9: '36px',
      10: '40px',
      11: '44px',
      12: '48px',
      touch: 'var(--touch-target)',
    },
    transitionDuration: {
      DEFAULT: '200ms',
      fast: '150ms',
      slow: '250ms',
    },
  },
  plugins: [],
} satisfies Config;
