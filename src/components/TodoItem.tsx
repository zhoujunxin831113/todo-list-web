import { Pencil, Trash2 } from 'lucide-react';
import { memo } from 'react';
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../constants/options';
import { formatDueDate } from '../lib/date';
import type { Task } from '../types/todo';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { Tag, type TagTone } from './ui/Tag';

const PRIORITY_TONES: Record<Task['priority'], TagTone> = {
  high: 'high',
  medium: 'medium',
  low: 'low',
};

export interface TodoItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TodoItemComponent({ task, onToggle, onEdit, onDelete }: TodoItemProps) {
  // 描述摘要 + 截止日期，单行省略（PRD 4.3 行布局）
  const summary = [
    task.description,
    task.dueDate !== null ? `截止 ${formatDueDate(task.dueDate)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <li
      className={[
        'rounded-card bg-card p-4 shadow-card transition-opacity duration-fast',
        task.completed ? 'opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          aria-label={task.completed ? `取消完成「${task.title}」` : `完成「${task.title}」`}
          checked={task.completed}
          onChange={() => onToggle(task.id)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={[
                'truncate text-sm font-medium text-ink',
                task.completed ? 'line-through' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {task.title}
            </p>
            <Tag tone={PRIORITY_TONES[task.priority]}>{PRIORITY_LABELS[task.priority]}</Tag>
            <Tag tone="category">{CATEGORY_LABELS[task.category]}</Tag>
          </div>
          {summary !== '' && (
            <p
              className={[
                'mt-1 truncate text-xs text-ink-muted',
                task.completed ? 'line-through' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {summary}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* 已完成隐藏编辑入口，但删除仍可用（PRD 4.4） */}
          {!task.completed && (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`编辑「${task.title}」`}
              onClick={() => onEdit(task)}
            >
              <Pencil size={16} aria-hidden="true" />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            aria-label={`删除「${task.title}」`}
            className="hover:text-danger"
            onClick={() => onDelete(task)}
          >
            <Trash2 size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </li>
  );
}

export const TodoItem = memo(TodoItemComponent);
