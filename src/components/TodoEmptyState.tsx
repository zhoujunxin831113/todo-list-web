import { CheckCircle2, ClipboardList, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import type { ButtonVariant } from './ui/Button';

export type TodoEmptyKind = 'no-tasks' | 'no-match' | 'all-complete';

interface EmptyContent {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  action: 'create' | 'clear';
  actionVariant: ButtonVariant;
}

const CONTENT: Record<TodoEmptyKind, EmptyContent> = {
  'no-tasks': {
    icon: <ClipboardList size={24} />,
    title: '还没有任务',
    description: '创建第一个待办事项，开始安排要做的事。',
    actionLabel: '新建任务',
    action: 'create',
    actionVariant: 'primary',
  },
  'no-match': {
    icon: <SearchX size={24} />,
    title: '没有符合条件的任务',
    description: '试试更换关键词，或清除当前的筛选条件。',
    actionLabel: '清除筛选',
    action: 'clear',
    actionVariant: 'secondary',
  },
  'all-complete': {
    icon: <CheckCircle2 size={24} />,
    title: '全部任务已完成',
    description: '干得漂亮！可以新建任务，继续下一件事。',
    actionLabel: '新建任务',
    action: 'create',
    actionVariant: 'secondary',
  },
};

export interface TodoEmptyStateProps {
  kind: TodoEmptyKind;
  onCreate: () => void;
  onClear: () => void;
}

/** 空状态只负责展示，类型判定由上层（App 组合层）完成 */
export function TodoEmptyState({ kind, onCreate, onClear }: TodoEmptyStateProps) {
  const content = CONTENT[kind];

  return (
    <div className="mt-4">
      <EmptyState
        icon={content.icon}
        title={content.title}
        description={content.description}
        actionLabel={content.actionLabel}
        actionVariant={content.actionVariant}
        onAction={content.action === 'create' ? onCreate : onClear}
      />
    </div>
  );
}
