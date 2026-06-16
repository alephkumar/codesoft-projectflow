import React, { useState, useEffect, useCallback } from 'react';
import { taskAPI, projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import useToast from '../hooks/useToast';
import { formatDate, isOverdue, timeAgo } from '../utils/helpers';

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'completed'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'In Review', completed: 'Completed' };

function TaskForm({ initialData, projects, users, onSubmit, loading }) {
  const [form, setForm] = useState(initialData || { title: '', description: '', projectId: '', assignedTo: '', status: 'todo', priority: 'medium', dueDate: '', estimatedHours: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <div className="form-group"><label className="form-label">Title *</label>
        <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Task title" /></div>
      <div className="form-group"><label className="form-label">Project *</label>
        <select className="form-select" value={form.projectId || ''} onChange={e => set('projectId', e.target.value)} required>
          <option value="">Select project</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select></div>
      <div className="form-group"><label className="form-label">Description</label>
        <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} rows={3} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group"><label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            {TASK_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Priority</label>
          <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group"><label className="form-label">Assign To</label>
          <select className="form-select" value={form.assignedTo || ''} onChange={e => set('assignedTo', e.target.value)}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Due Date</label>
          <input type="date" className="form-input" value={form.dueDate?.split('T')[0] || ''} onChange={e => set('dueDate', e.target.value)} /></div>
      </div>
      <div className="form-group"><label className="form-label">Estimated Hours</label>
        <input type="number" className="form-input" value={form.estimatedHours} onChange={e => set('estimatedHours', e.target.value)} min="0" placeholder="0" /></div>
      <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center' }}>
        {loading ? 'Saving...' : (initialData ? 'Update Task' : 'Create Task')}
      </button>
    </form>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', assignedTo: '' });
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user?.role === 'admin' || user?.role === 'project_manager';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        taskAPI.getAll(params),
        projectAPI.getAll(),
        userAPI.getAll()
      ]);
      setTasks(tasksRes.data.tasks);
      setProjects(projectsRes.data.projects);
      setUsers(usersRes.data.users);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      await taskAPI.create(data);
      toast.success('Task created!');
      setCreateModal(false);
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create'); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async (data) => {
    setSubmitting(true);
    try {
      await taskAPI.update(editModal._id, data);
      toast.success('Task updated!');
      setEditModal(null);
      loadData();
    } catch (err) { toast.error('Failed to update'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await taskAPI.delete(deleteConfirm._id);
      toast.success('Task deleted');
      setDeleteConfirm(null);
      setTasks(prev => prev.filter(t => t._id !== deleteConfirm._id));
    } catch { toast.error('Failed to delete'); }
    finally { setSubmitting(false); }
  };

  const overdueTasks = tasks.filter(t => isOverdue(t.dueDate, t.status));

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">{tasks.length} tasks · {overdueTasks.length > 0 && <span style={{ color: 'var(--danger)' }}>{overdueTasks.length} overdue</span>}</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setCreateModal(true)}>+ New Task</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total', val: tasks.length, color: 'var(--accent)', icon: '✅' },
          { label: 'In Progress', val: tasks.filter(t => t.status === 'in_progress').length, color: 'var(--info)', icon: '⚡' },
          { label: 'Review', val: tasks.filter(t => t.status === 'review').length, color: 'var(--warning)', icon: '👀' },
          { label: 'Overdue', val: overdueTasks.length, color: 'var(--danger)', icon: '⚠️' }
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginTop: 4 }}>{s.icon} {s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <select className="form-select" style={{ width: 180 }} value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {TASK_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select className="form-select" style={{ width: 160 }} value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {canManage && (
          <select className="form-select" style={{ width: 200 }} value={filters.assignedTo} onChange={e => setFilters(p => ({ ...p, assignedTo: e.target.value }))}>
            <option value="">All Members</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        )}
        {(filters.status || filters.priority || filters.assignedTo) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: '', priority: '', assignedTo: '' })}>Clear</button>
        )}
      </div>

      {loading ? <TableSkeleton rows={8} /> : tasks.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">✅</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No tasks found</div>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your filters or create a new task.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                {['Task', 'Project', 'Status', 'Priority', 'Assigned To', 'Due Date', ''].map(h => (
                  <th key={h} style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const overdue = isOverdue(task.dueDate, task.status);
                return (
                  <tr key={task._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s', background: overdue ? 'rgba(239,68,68,0.03)' : '' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = overdue ? 'rgba(239,68,68,0.03)' : ''}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.description.slice(0, 60)}...</div>}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-muted)' }}>{task.projectId?.name || '—'}</td>
                    <td style={{ padding: '14px 20px' }}><StatusBadge status={task.status} /></td>
                    <td style={{ padding: '14px 20px' }}><PriorityBadge priority={task.priority} /></td>
                    <td style={{ padding: '14px 20px' }}>
                      {task.assignedTo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar" style={{ width: 24, height: 24, fontSize: 11 }}>{task.assignedTo.name?.charAt(0)}</div>
                          <span style={{ fontSize: 13 }}>{task.assignedTo.name}</span>
                        </div>
                      ) : <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: overdue ? 'var(--danger)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {overdue && '⚠️ '}{formatDate(task.dueDate)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditModal(task)}>Edit</button>
                        {canManage && <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(task)}>Delete</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Task">
        <TaskForm projects={projects} users={users} onSubmit={handleCreate} loading={submitting} />
      </Modal>
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Task">
        {editModal && <TaskForm initialData={{ ...editModal, projectId: editModal.projectId?._id || editModal.projectId, assignedTo: editModal.assignedTo?._id || editModal.assignedTo }} projects={projects} users={users} onSubmit={handleUpdate} loading={submitting} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Delete Task" message={`Delete "${deleteConfirm?.title}"?`} confirmLabel="Delete" danger loading={submitting} />
    </div>
  );
}
