import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { Toast } from './components/Toast';
import { TodoEmptyState, type TodoEmptyKind } from './components/TodoEmptyState';
import { TodoFormModal, type TodoFormValues } from './components/TodoFormModal';
import { TodoList } from './components/TodoList';
import { Toolbar } from './components/Toolbar';
import { DEFAULT_FILTERS } from './constants/options';
import { useDerivedTodos } from './hooks/useDerivedTodos';
import { useTodoStore } from './store/useTodoStore';
import type { Task } from './types/todo';

export default function App() {
  const tasks = useTodoStore((state) => state.tasks);
  const filters = useTodoStore((state) => state.filters);
  const keyword = useTodoStore((state) => state.keyword);
  const setKeyword = useTodoStore((state) => state.setKeyword);
  const setFilter = useTodoStore((state) => state.setFilter);
  const toggle = useTodoStore((state) => state.toggle);
  const remove = useTodoStore((state) => state.remove);
  const add = useTodoStore((state) => state.add);
  const update = useTodoStore((state) => state.update);
  // 统计只走 hooks 派生层，恒为全量 tasks（PRD 2.3 规则 1）；列表用可见任务
  const { visibleTasks, stats } = useDerivedTodos(tasks, filters, keyword);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const closeToast = useCallback(() => setToastMessage(null), []);

  const handleClear = useCallback(() => {
    setFilter(DEFAULT_FILTERS);
    setKeyword('');
    setToastMessage('已清除筛选条件');
  }, [setFilter, setKeyword]);

  const handleCreate = useCallback(() => {
    setEditingTask(null);
    setFormOpen(true);
  }, []);

  // 已完成任务不渲染编辑入口（TodoItem 守卫）；store.update 会再次拒绝，双重守卫
  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditingTask(null);
  }, []);

  const handleFormSubmit = useCallback(
    (values: TodoFormValues) => {
      if (editingTask === null) {
        add({
          title: values.title,
          description: values.description,
          dueDate: values.dueDate,
          priority: values.priority,
          category: values.category,
        });
        setToastMessage(`已创建「${values.title}」`);
      } else {
        update(editingTask.id, {
          title: values.title,
          description: values.description,
          dueDate: values.dueDate,
          priority: values.priority,
          category: values.category,
        });
        setToastMessage(`已保存「${values.title}」`);
      }
      setFormOpen(false);
      setEditingTask(null);
    },
    [add, editingTask, update],
  );

  const handleDeleteRequest = useCallback((task: Task) => setPendingDelete(task), []);
  const handleCancelDelete = useCallback(() => setPendingDelete(null), []);

  // 删除必须先二次确认（含任务名、注明不可撤销），确认后才写 store
  const handleConfirmDelete = useCallback(() => {
    if (pendingDelete === null) {
      return;
    }
    remove(pendingDelete.id);
    setToastMessage(`已删除「${pendingDelete.title}」`);
    setPendingDelete(null);
  }, [pendingDelete, remove]);

  // 空状态判定（展示层不做业务判断）：无任何任务 → 无任务；列表为空且「待完成」为 0 → 全部完成；其余为无匹配
  const emptyKind: TodoEmptyKind =
    tasks.length === 0
      ? 'no-tasks'
      : filters.status === 'active' && stats.active === 0
        ? 'all-complete'
        : 'no-match';

  return (
    <div className="min-h-screen bg-page">
      <main className="mx-auto w-full max-w-[720px] px-4 pb-[88px] pt-6 sm:px-6 sm:pb-16 lg:max-w-[1080px]">
        <Header />
        <StatCards stats={stats} />
        <Toolbar
          filters={filters}
          keyword={keyword}
          onKeywordChange={setKeyword}
          onFilterChange={setFilter}
          onClear={handleClear}
          onCreate={handleCreate}
        />
        {visibleTasks.length > 0 ? (
          <TodoList
            tasks={visibleTasks}
            onToggle={toggle}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        ) : (
          <TodoEmptyState kind={emptyKind} onCreate={handleCreate} onClear={handleClear} />
        )}
      </main>
      {/* <640 右下角悬浮新建按钮（含安全区） */}
      <button
        type="button"
        aria-label="新建任务"
        onClick={handleCreate}
        className="fixed bottom-[calc(16px+var(--safe-area-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-pill bg-primary text-white shadow-modal transition-colors duration-fast hover:bg-primary-hover sm:hidden"
      >
        <Plus size={24} aria-hidden="true" />
      </button>
      <Toast open={toastMessage !== null} message={toastMessage ?? ''} onClose={closeToast} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除任务"
        description={
          pendingDelete !== null ? `「${pendingDelete.title}」将被永久移除，此操作不可撤销。` : ''
        }
        confirmLabel="删除"
        tone="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      <TodoFormModal
        open={formOpen}
        task={editingTask}
        onSubmit={handleFormSubmit}
        onClose={handleFormClose}
      />
    </div>
  );
}
