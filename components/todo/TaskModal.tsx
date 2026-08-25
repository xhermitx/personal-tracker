'use client';

import { useState } from 'react';
import { Task, TaskGroup, TaskStatus } from '@/types';
import { useApp } from '@/context/AppContext';
import { auth } from '@/lib/firebase';
import CustomSelect, { SelectOption } from '../ui/CustomSelect';
import DatePicker from '../ui/DatePicker';

interface Props {
  initial?: Partial<Task>;
  defaultGroup?: TaskGroup;
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
  isOrgBoard?: boolean;
}

export default function TaskModal({ initial, defaultGroup, onClose, onSave, isOrgBoard }: Props) {
  const { state } = useApp();
  const currentUser = state.users.find(u => 
    u.id === auth.currentUser?.uid || (u.email && u.email === auth.currentUser?.email)
  );
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [assigneeId, setAssigneeId] = useState(initial?.assigneeId ?? '');
  const [hours, setHours] = useState(initial?.estimatedMinutes ? String(Math.floor((initial.estimatedMinutes) / 60)) : '0');
  const [minutes, setMinutes] = useState(initial?.estimatedMinutes ? String((initial.estimatedMinutes) % 60) : '0');
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [group, setGroup] = useState<TaskGroup>(initial?.group ?? defaultGroup ?? 'today');
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'todo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (isOrgBoard && !assigneeId) {
      alert("Please select an assignee for this organization task.");
      return;
    }
    const taskData: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      estimatedMinutes: parseInt(hours || '0') * 60 + parseInt(minutes || '0'),
      deadline,
      group,
      status,
    };
    if (assigneeId) {
      taskData.assigneeId = assigneeId;
    }
    onSave(taskData);
  };

  const groups: { value: TaskGroup; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const statuses: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'Todo' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{initial?.id ? '✏️ Edit Task' : '+ New Task'}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              className="form-input"
              placeholder="What needs to be done?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Add more details..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-row">
            {(isOrgBoard || initial?.assigneeId) && (
              <div className="form-group">
                <label className="form-label">Assignee {isOrgBoard ? '*' : ''}</label>
                <CustomSelect
                  value={assigneeId}
                  onChange={setAssigneeId}
                  options={state.users
                    .filter(u => u.role === 'member' && u.orgId === currentUser?.orgId)
                    .map(u => ({
                      value: u.id,
                      label: u.name,
                      color: u.color,
                      avatarText: u.avatar
                    }))
                  }
                  placeholder="Select a member..."
                  required={isOrgBoard}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <DatePicker
                value={deadline}
                onChange={setDeadline}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Time</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                min="0"
                max="99"
                value={hours}
                onChange={e => setHours(e.target.value)}
                style={{ maxWidth: 80 }}
              />
              <span className="text-muted">h</span>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                min="0"
                max="59"
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                style={{ maxWidth: 80 }}
              />
              <span className="text-muted">m</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Group</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {groups.map(g => (
                  <button
                    type="button"
                    key={g.value}
                    className={`module-toggle${group === g.value ? ' active' : ''}`}
                    style={{ flex: 1, fontSize: '0.75rem' }}
                    onClick={() => setGroup(g.value)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {statuses.map(s => (
                  <button
                    type="button"
                    key={s.value}
                    className={`module-toggle${status === s.value ? ' active' : ''}`}
                    style={{ flex: 1, fontSize: '0.72rem' }}
                    onClick={() => setStatus(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
              {initial?.id ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
