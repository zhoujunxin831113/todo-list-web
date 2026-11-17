import { useState, type FormEvent } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import {
  CATEGORY_OPTIONS,
  DEFAULT_CATEGORY,
  DEFAULT_PRIORITY,
  PRIORITY_OPTIONS,
} from '../constants/options';
import { useTodoStore } from '../store/useTodoStore';
import type { Category, Priority } from '../types/todo';

const TITLE_MAX_LENGTH = 100;

/**
 * 参考图中的「快速添加」卡片：标题 + 分类 + 优先级 + 添加按钮（桌面端横向一行）。
 * 描述/截止日期等完整字段仍由 TodoFormModal 承载，校验口径与 store 保持一致。
 * 仅在 ≥640px 的两栏布局展示；移动端由右下角悬浮按钮打开完整弹窗。
 */
export function QuickAddForm({ onAdded }: { onAdded: (title: string) => void }) {
  const add = useTodoStore((state) => state.add);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>(DEFAULT_PRIORITY);
  const [category, setCategory] = useState<Category>(DEFAULT_CATEGORY);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      setError('请输入任务标题');
      return;
    }
    if (trimmed.length > TITLE_MAX_LENGTH) {
      setError('标题最多 100 字');
      return;
    }
    add({ title: trimmed, priority, category });
    onAdded(trimmed);
    setTitle('');
    setPriority(DEFAULT_PRIORITY);
    setCategory(DEFAULT_CATEGORY);
    setError(null);
  };

  return (
    <section
      aria-label="快速添加"
      className="hidden rounded-card border-2 border-ink bg-card p-5 shadow-card sm:block"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="任务标题"
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              placeholder="输入任务内容..."
              error={error ?? undefined}
              onChange={(event) => {
                setTitle(event.target.value);
                if (error !== null) {
                  setError(null);
                }
              }}
            />
          </div>
          <div className="sm:w-36">
            <Select
              label="分类"
              value={category}
              options={CATEGORY_OPTIONS}
              onChange={setCategory}
            />
          </div>
          <div className="sm:w-32">
            <Select
              label="优先级"
              value={priority}
              options={PRIORITY_OPTIONS}
              onChange={setPriority}
            />
          </div>
          <Button type="submit" className="h-11 shrink-0 sm:w-24">
            添加
          </Button>
        </div>
      </form>
    </section>
  );
}
