'use client';

import { useState } from 'react';
import { Task, TaskStatus } from '@/types';
import TaskModal from './TaskModal';

interface Props {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

import { FiEdit2, FiTrash2, FiClock, FiCalendar, FiUser, FiBriefcase, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { MdOutlineRadioButtonUnchecked } from 'react-icons/md';

const STATUS_CYCLE: TaskStatus[] = ['todo', 'in-progress', 'done'];
const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = { 
  todo: <MdOutlineRadioButtonUnchecked />, 
  'in-progress': <FiLoader className="spin" />, 
  done: <FiCheckCircle style={{ color: 'var(--green)' }} /> 
};

import { useApp } from '@/context/AppContext';

function formatDeadline(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, cls: 'badge-red' };
  if (diff === 0) return { label: 'Today', cls: 'badge-orange' };
  if (diff <= 3) return { label: `${diff}d left`, cls: 'badge-orange' };
  return { label: `${diff}d left`, cls: 'badge-ghost' };
}

function formatTime(minutes: number) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
}

export default function TaskCard({ task, onUpdate, onDelete, isDragging }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const { state } = useApp();

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = STATUS_CYCLE.indexOf(task.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onUpdate(task.id, { status: next });
  };

  const deadline = formatDeadline(task.deadline);
  const timeStr = formatTime(task.estimatedMinutes);
  
  const assignee = task.assigneeId ? state.users.find(u => u.id === task.assigneeId) : null;

  return (
    <>
      <div className={`task-card${isDragging ? ' dragging' : ''}`}>
        <div className="task-card-top">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
            <button
              className={`status-toggle ${task.status}`}
              onClick={cycleStatus}
              title="Cycle status"
            >
              {STATUS_ICONS[task.status]}
            </button>
            <span
              className="task-card-title"
              style={task.status === 'done' ? { textDecoration: 'line-through', opacity: 0.5 } : {}}
            >
              {task.title}
            </span>
            {task.scope === 'org' && (
              <span className="badge badge-accent" style={{ fontSize: '0.6rem', marginLeft: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiBriefcase /> Org
              </span>
            )}
          </div>
          <div className="task-actions">
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={e => { e.stopPropagation(); setShowEdit(true); }}
              title="Edit"
            >
              <FiEdit2 />
            </button>
            <button
              className="btn btn-danger btn-icon btn-sm"
              onClick={e => { e.stopPropagation(); onDelete(task.id); }}
              title="Delete"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>

        {task.description && (
          <p className="task-card-desc">{task.description}</p>
        )}

        <div className="task-card-footer">
          <div className="task-card-meta">
            {assignee && (
              <span className="task-assignee" title={assignee.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiUser /> {assignee.name.split(' ')[0]}
              </span>
            )}
            {timeStr && <span className="badge badge-blue" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiClock /> {timeStr}</span>}
            {deadline && <span className={`badge ${deadline.cls}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiCalendar /> {deadline.label}</span>}
          </div>
        </div>
      </div>

      {showEdit && (
        <TaskModal
          initial={task}
          onClose={() => setShowEdit(false)}
          onSave={(data) => { onUpdate(task.id, data); setShowEdit(false); }}
        />
      )}
    </>
  );
}
