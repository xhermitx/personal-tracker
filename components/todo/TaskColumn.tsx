'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskGroup } from '@/types';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

interface SortableTaskProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

function SortableTask({ task, onUpdate, onDelete }: SortableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onUpdate={onUpdate} onDelete={onDelete} isDragging={isDragging} />
    </div>
  );
}

const COLUMN_CONFIG: Record<TaskGroup, { label: string; dotColor: string; icon: string }> = {
  today:  { label: 'Today',      dotColor: '#ff6b6b', icon: '🔥' },
  week:   { label: 'This Week',  dotColor: '#ff9f43', icon: '📅' },
  month:  { label: 'This Month', dotColor: '#3de88a', icon: '🗓️' },
};

interface Props {
  group: TaskGroup;
  tasks: Task[];
  onAddTask: (data: Partial<Task>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskColumn({ group, tasks, onAddTask, onUpdateTask, onDeleteTask }: Props) {
  const [showModal, setShowModal] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: group });
  const cfg = COLUMN_CONFIG[group];
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  return (
    <div ref={setNodeRef} className={`task-column${isOver ? ' drag-over' : ''}`}>
      <div className="column-header">
        <div className="column-title">
          <span>{cfg.icon}</span>
          <span className="column-dot" style={{ background: cfg.dotColor }} />
          {cfg.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tasks.length > 0 && (
            <span className="text-muted text-xs">{doneTasks}/{tasks.length}</span>
          )}
          <span className="column-count">{tasks.length}</span>
        </div>
      </div>

      <div className="column-body">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTask
              key={task.id}
              task={task}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="empty-state" style={{ padding: '24px 12px' }}>
            <div style={{ fontSize: '1.5rem', opacity: 0.25 }}>{cfg.icon}</div>
            <div className="empty-state-text">No tasks</div>
          </div>
        )}

        <button className="column-add-btn" onClick={() => setShowModal(true)}>
          <span>+</span> Add task
        </button>
      </div>

      {showModal && (
        <TaskModal
          defaultGroup={group}
          onClose={() => setShowModal(false)}
          onSave={(data) => { onAddTask(data); setShowModal(false); }}
        />
      )}
    </div>
  );
}
