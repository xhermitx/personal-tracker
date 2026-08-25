'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import TodoBoard from '@/components/todo/TodoBoard';
import { auth } from '@/lib/firebase';
import CustomSelect, { SelectOption } from '@/components/ui/CustomSelect';

export default function OrgTodoPage() {
  const { state, addTask, updateTask, deleteTask, moveTask } = useApp();

  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  const currentUser = state.users.find(u => 
    u.id === auth.currentUser?.uid || (u.email && u.email === auth.currentUser?.email)
  );
  if (!currentUser) return null;

  // Org board only shows org-scoped tasks, and optionally filters by assignee
  let orgTasks = state.tasks.filter(t => t.scope === 'org');
  if (assigneeFilter !== 'all') {
    orgTasks = orgTasks.filter(t => t.assigneeId === assigneeFilter);
  }

  const orgMembers = state.users.filter(u => u.role === 'member' && u.orgId === currentUser.orgId);
  const filterOptions: SelectOption[] = [
    { value: 'all', label: 'All Members' },
    ...orgMembers.map(u => ({
      value: u.id,
      label: u.name,
      color: u.color,
      avatarText: u.avatar
    }))
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">🏢 Organization Board</h1>
          <p className="page-subtitle">Manage and assign tasks for the entire organization.</p>
        </div>
        <div style={{ width: 220 }}>
          <CustomSelect
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            options={filterOptions}
          />
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
