'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import TodoBoard from '@/components/todo/TodoBoard';

export default function TodoPage() {
  const { state, addTask, updateTask, deleteTask, moveTask } = useApp();
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string;

  const user = state.users.find(u => u.id === userId);
  if (!user) return null;

  if (!user.modules.includes('todo')) {
    return (
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="empty-state-icon">📋</div>
        <p className="empty-state-text">Todo Board is not enabled for this user.</p>
        <button className="btn btn-ghost" onClick={() => router.push('/admin')}>
          Enable in Settings →
        </button>
      </div>
    );
  }

  const userTasks = state.tasks.filter(t => t.assigneeId === userId);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Todo Board</h1>
          <p className="page-subtitle">Drag tasks between groups to reprioritize your work.</p>
        </div>
      </div>

      <TodoBoard
        tasks={userTasks}
        onAdd={(data) => addTask({ 
          title: '', 
          description: '', 
          assigneeId: userId, 
          estimatedMinutes: 0, 
          deadline: '', 
          group: 'today', 
          status: 'todo', 
          scope: 'personal',
          ...data 
        })}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onMove={moveTask}
      />
    </div>
  );
}
