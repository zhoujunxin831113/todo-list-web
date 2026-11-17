import { memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Checkbox } from './ui/Checkbox';
import { Tag, type TagTone } from './ui/Tag';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
} from '../constants/options';
import { formatDueDate } from '../lib/date';
import type { Priority, Task } from '../types/todo';

export interface TodoItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const PRIORITY_TONES: Record<Priority, TagTone> = {
  high: 'high',
  medium: 'medium',
  low: 'low',
};

function TodoItemComponent({ task, onToggle, onEdit, onDelete }: TodoItemProps) {
  const summaryParts = [task.description, task.dueDate ? `截止 ${formatDueDate(task.dueDate)}` : ''].filter(
    Boolean,
  );

  return (
    <li
      className={[
        'rounded-control border-2 border-ink/15 bg-surface p-4 transition-all duration-fast',
        task.completed ? 'opacity-60' : 'hover:border-ink/40',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">
          <Checkbox
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            aria-label={`${task.completed ? '取消完成' : '完成'}「${task.title}」`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={[
              'break-words text-sm font-bold text-ink',
              task.completed ? 'line-through' : '',
            ].join(' ')}
          >
            {task.title}
          </p>
          {summaryParts.length > 0 && (
            <p
              className={[
                'mt-1 break-words text-xs text-ink-muted',
                task.completed ? 'line-through' : '',
              ].join(' ')}
            >
              {summaryParts.join(' · ')}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Tag tone="category">{CATEGORY_LABELS[task.category]}</Tag>
            <Tag tone={PRIORITY_TONES[task.priority]}>{PRIORITY_LABELS[task.priority]}</Tag>
            {task.dueDate && (
              <span className="font-mono text-xs font-medium text-ink-muted">
                {formatDueDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* 已完成任务不可编辑：UI 层隐藏入口，store.update 内还有第二道守卫 */}
          {!task.completed && (
            <button
              type="button"
              aria-label={`编辑「${task.title}」`}
              onClick={() => onEdit(task)}
              className="flex h-11 w-11 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-ink/10 hover:text-ink"
            >
              <Pencil size={18} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            aria-label={`删除「${task.title}」`}
            onClick={() => onDelete(task)}
            className="flex h-11 w-11 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

export const TodoItem = memo(TodoItemComponent);
