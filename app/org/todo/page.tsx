'use client';

import { useApp } from '@/context/AppContext';
import TodoBoard from '@/components/todo/TodoBoard';
import { auth } from '@/lib/firebase';

export default function OrgTodoPage() {
  const { state, addTask, updateTask, deleteTask, moveTask } = useApp();

  const currentUser = state.users.find(u => 
    u.id === auth.currentUser?.uid || (u.email && u.email === auth.currentUser?.email)
  );
  if (!currentUser) return null;

  // Org board only shows org-scoped tasks
  const orgTasks = state.tasks.filter(t => t.scope === 'org');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏢 Organization Board</h1>
          <p className="page-subtitle">Manage and assign tasks for the entire organization.</p>
        </div>
      </div>

      <TodoBoard
        tasks={orgTasks}
        onAdd={(data) => addTask({ 
          title: '', 
          description: '', 
          assigneeId: null, 
          estimatedMinutes: 0, 
          deadline: '', 
          group: 'today', 
          status: 'todo', 
          scope: 'org',
          ...data 
        })}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onMove={moveTask}
        isOrgBoard={true}
      />
    </div>
  );
}
