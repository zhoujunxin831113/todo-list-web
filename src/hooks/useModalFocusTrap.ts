import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface ModalFocusTrapOptions {
  open: boolean;
  containerRef: RefObject<HTMLElement>;
  /** 打开时优先聚焦的元素（表单为第一个输入；确认框为安全项） */
  initialFocusRef?: RefObject<HTMLElement>;
  onEscape: () => void;
}

/**
 * 模态焦点管理（TECH_DESIGN 4-6）：打开时聚焦指定元素、Tab 首尾循环且不逃逸、
 * Esc 回调、关闭/卸载时把焦点归还给触发元素。
 */
export function useModalFocusTrap({
  open,
  containerRef,
  initialFocusRef,
  onEscape,
}: ModalFocusTrapOptions): void {
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const initial = initialFocusRef?.current ?? containerRef.current;
    initial?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }

      const container = containerRef.current;
      if (!container) {
        return;
      }
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && container.contains(active);

      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previous?.focus();
    };
  }, [open, containerRef, initialFocusRef]);
}
