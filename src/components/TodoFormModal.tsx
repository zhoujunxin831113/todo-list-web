import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import {
  CATEGORY_OPTIONS,
  DEFAULT_CATEGORY,
  DEFAULT_PRIORITY,
  PRIORITY_OPTIONS,
} from '../constants/options';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';
import type { Category, Priority, Task } from '../types/todo';
import { ConfirmDialog } from './ConfirmDialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';

export const TITLE_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export interface TodoFormValues {
  title: string;
  description: string;
  dueDate: string | null;
  priority: Priority;
  category: Category;
}

export interface TodoFormModalProps {
  open: boolean;
  /** null 表示新建，否则为编辑目标 */
  task: Task | null;
  onSubmit: (values: TodoFormValues) => void;
  onClose: () => void;
}

interface FormState {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  category: Category;
}

interface FormErrors {
  title?: string;
  description?: string;
}

function toFormState(task: Task | null): FormState {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    dueDate: task?.dueDate ?? '',
    priority: task?.priority ?? DEFAULT_PRIORITY,
    category: task?.category ?? DEFAULT_CATEGORY,
  };
}

interface FormDialogProps {
  heading: string;
  form: FormState;
  errors: FormErrors;
  onChange: (patch: Partial<FormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function FormDialog({ heading, form, errors, onChange, onSubmit, onCancel }: FormDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const headingId = useId();

  useModalFocusTrap({
    open: true,
    containerRef: dialogRef,
    initialFocusRef: titleRef,
    onEscape: onCancel,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={[
          'w-full overflow-y-auto rounded-t-card bg-card p-6 shadow-modal',
          // 移动端底部抽屉：限高可滚动 + 安全区留白；≥640 变为居中弹窗
          'mb-[var(--safe-area-bottom)] max-h-[85vh]',
          'sm:mb-0 sm:max-w-[480px] sm:rounded-card',
        ].join(' ')}
      >
        <h2 id={headingId} className="text-lg font-semibold text-ink">
          {heading}
        </h2>
        {/* 字段顺序固定：标题 → 描述 → 截止日期 → 优先级 → 分类 → [取消] [保存] */}
        <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            ref={titleRef}
            label="标题"
            value={form.title}
            error={errors.title}
            placeholder="要做什么？"
            maxLength={TITLE_MAX_LENGTH}
            aria-required="true"
            onChange={(event) => onChange({ title: event.target.value })}
          />
          <Textarea
            label="描述"
            value={form.description}
            error={errors.description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            placeholder="补充说明（可选）"
            onChange={(event) => onChange({ description: event.target.value })}
          />
          <div className="flex items-end gap-2">
            <Input
              type="date"
              label="截止日期"
              value={form.dueDate}
              containerClassName="flex-1"
              onChange={(event) => onChange({ dueDate: event.target.value })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={form.dueDate === ''}
              onClick={() => onChange({ dueDate: '' })}
            >
              清除
            </Button>
          </div>
          <Select
            label="优先级"
            value={form.priority}
            options={PRIORITY_OPTIONS}
            onChange={(priority) => onChange({ priority })}
          />
          <Select
            label="分类"
            value={form.category}
            options={CATEGORY_OPTIONS}
            onChange={(category) => onChange({ category })}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TodoFormModal({ open, task, onSubmit, onClose }: TodoFormModalProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(task));
  const [baseline, setBaseline] = useState<FormState>(() => toFormState(task));
  const [errors, setErrors] = useState<FormErrors>({});
  const [abandonOpen, setAbandonOpen] = useState(false);

  // 每次打开都按目标任务重置表单（新建清空、编辑预填全部字段）
  useEffect(() => {
    if (!open) {
      return;
    }
    const next = toFormState(task);
    setForm(next);
    setBaseline(next);
    setErrors({});
    setAbandonOpen(false);
  }, [open, task]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(baseline);

  // 有未保存修改时，取消 / Esc / 点遮罩都先走「放弃编辑」二次确认（PRD 2.3 规则 4）
  const requestClose = useCallback(() => {
    if (isDirty) {
      setAbandonOpen(true);
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleChange = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors({});
  }, []);

  const handleSubmit = useCallback(() => {
    const title = form.title.trim();
    const nextErrors: FormErrors = {};

    // 标题去首尾空格后 1–100 字，空标题拦截（PRD 2.1）
    if (title === '') {
      nextErrors.title = '请输入任务标题';
    } else if (title.length > TITLE_MAX_LENGTH) {
      nextErrors.title = `标题最多 ${TITLE_MAX_LENGTH} 字`;
    }
    if (form.description.length > DESCRIPTION_MAX_LENGTH) {
      nextErrors.description = `描述最多 ${DESCRIPTION_MAX_LENGTH} 字`;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({
      title,
      description: form.description,
      dueDate: form.dueDate === '' ? null : form.dueDate,
      priority: form.priority,
      category: form.category,
    });
  }, [form, onSubmit]);

  if (!open) {
    return null;
  }

  if (abandonOpen) {
    return (
      <ConfirmDialog
        open
        title="放弃编辑？"
        description="当前未保存的修改将会丢失，此操作不可撤销。"
        confirmLabel="放弃修改"
        cancelLabel="继续编辑"
        tone="danger"
        onConfirm={() => {
          setAbandonOpen(false);
          onClose();
        }}
        onCancel={() => setAbandonOpen(false)}
      />
    );
  }

  return (
    <FormDialog
      heading={task === null ? '新建任务' : '编辑任务'}
      form={form}
      errors={errors}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onCancel={requestClose}
    />
  );
}
