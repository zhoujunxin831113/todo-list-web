import type { Task } from '../types/todo';
import { TodoItem } from './TodoItem';

export interface TodoListProps {
  tasks: readonly Task[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TodoList({ tasks, onToggle, onEdit, onDelete }: TodoListProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <ul aria-label="任务列表" className="mt-4 flex flex-col gap-3 sm:gap-4">
      {/* key 固定为 task.id；回调由上层以 useCallback 保持稳定，配合 React.memo 避免无效重渲染 */}
      {tasks.map((task) => (
        <TodoItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
