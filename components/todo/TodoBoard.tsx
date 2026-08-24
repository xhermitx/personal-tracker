'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import { Task, TaskGroup } from '@/types';
import TaskColumn from './TaskColumn';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

const GROUPS: TaskGroup[] = ['today', 'week', 'month'];

interface Props {
  tasks: Task[];
  onAdd: (data: Partial<Task>) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, group: TaskGroup) => void;
  isOrgBoard?: boolean;
}

export default function TodoBoard({ tasks, onAdd, onUpdate, onDelete, onMove, isOrgBoard }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  useEffect(() => {
    if (tasks.length === 0) return;
    
    // Auto-move uncompleted 'today' tasks to 'week' if they were moved/created before today
    const todayStr = new Date().toISOString().split('T')[0];
    tasks.forEach(t => {
      if (t.group === 'today' && t.status !== 'done') {
        const dateToCheck = t.movedAt || t.createdAt;
        const dateStr = dateToCheck ? dateToCheck.split('T')[0] : '';
        if (dateStr && dateStr < todayStr) {
          onMove(t.id, 'week');
        }
      }
    });
  }, [tasks, onMove]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getTasksByGroup = (group: TaskGroup) => tasks.filter(t => t.group === group);

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) return;
    if (GROUPS.includes(over.id as TaskGroup)) {
      onMove(active.id as string, over.id as TaskGroup);
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      const dragTask = tasks.find(t => t.id === active.id);
      if (overTask && dragTask && overTask.group !== dragTask.group) {
        onMove(active.id as string, overTask.group);
      }
    }
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over) return;
    if (GROUPS.includes(over.id as TaskGroup)) {
      onMove(active.id as string, over.id as TaskGroup);
    }
  };

  const totalDone = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 20, flex: 1, flexWrap: 'wrap' }}>
          {GROUPS.map(g => {
            const count = getTasksByGroup(g).length;
            const done = getTasksByGroup(g).filter(t => t.status === 'done').length;
            return (
              <div key={g} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>{count}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {g === 'today' ? 'Today' : g === 'week' ? 'This Week' : 'This Month'}
                </span>
              </div>
            );
          })}
          {totalTasks > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green)' }}>{totalDone}/{totalTasks}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</span>
            </div>
          )}
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewTask(true)}>+ New Task</button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="todo-board">
          {GROUPS.map(group => (
            <TaskColumn
              key={group}
              group={group}
              tasks={getTasksByGroup(group)}
              onAddTask={(data) => onAdd({ ...data, group })}
              onUpdateTask={onUpdate}
              onDeleteTask={onDelete}
              isOrgBoard={isOrgBoard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div style={{ opacity: 0.9, transform: 'rotate(2deg)', boxShadow: 'var(--shadow-lg)' }}>
              <TaskCard task={activeTask} onUpdate={() => {}} onDelete={() => {}} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showNewTask && (
        <TaskModal
          isOrgBoard={isOrgBoard}
          onClose={() => setShowNewTask(false)}
          onSave={(data) => { onAdd(data); setShowNewTask(false); }}
        />
      )}
    </div>
  );
}
