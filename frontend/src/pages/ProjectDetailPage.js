import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import useToast from '../hooks/useToast';
import { formatDate, timeAgo, isOverdue } from '../utils/helpers';

const TASK_STATUSES = ['todo', 'in_progress', 'review', 'completed'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', review: 'In Review', completed: 'Completed' };

function TaskCard({ task, onEdit, onDelete, canManage }) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, borderRadius: 10, padding: 14, marginBottom: 8, cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = overdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, flex: 1, marginRight: 8 }}>{task.title}</div>
        <PriorityBadge priority={task.priority} />
      </div>
      {task.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>{task.description.slice(0, 100)}{task.description.length > 100 ? '...' : ''}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.assignedTo ? (
            <>
              <div className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>{task.assignedTo.name?.charAt(0)}</div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.assignedTo.name}</span>
            </>
          ) : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unassigned</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {task.dueDate && <span style={{ fontSize: 11, color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}>📅 {formatDate(task.dueDate)}</span>}
          {canManage && (
            <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-icon btn-secondary btn-sm" style={{ padding: '3px 6px', fontSize: 11 }} onClick={() => onEdit(task)}>✏️</button>
              <button className="btn btn-icon btn-danger btn-sm" style={{ padding: '3px 6px', fontSize: 11 }} onClick={() => onDelete(task)}>🗑️</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskForm({ initialData, projectId, users, onSubmit, loading }) {
  const [form, setForm] = useState(initialData || { title: '', description: '', assignedTo: '', status: 'todo', priority: 'medium', dueDate: '', estimatedHours: '', projectId });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <div className="form-group"><label className="form-label">Title *</label>
        <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" required /></div>
      <div className="form-group"><label className="form-label">Description</label>
        <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Task details..." /></div>
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
        <input type="number" className="form-input" value={form.estimatedHours} onChange={e => set('estimatedHours', e.target.value)} placeholder="0" min="0" /></div>
      <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center' }}>
        {loading ? 'Saving...' : (initialData ? 'Update Task' : 'Create Task')}
      </button>
    </form>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createTaskModal, setCreateTaskModal] = useState(false);
  const [editTaskModal, setEditTaskModal] = useState(null);
  const [deleteTaskConfirm, setDeleteTaskConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('board');
  const canManage = user?.role === 'admin' || user?.role === 'project_manager';

  useEffect(() => {
    Promise.all([
      projectAPI.getOne(id),
      taskAPI.getAll({ projectId: id }),
      userAPI.getAll()
    ]).then(([projRes, taskRes, userRes]) => {
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);
      setUsers(userRes.data.users);
    }).catch(() => toast.error('Failed to load project'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCreateTask = async (data) => {
    setSubmitting(true);
    try {
      await taskAPI.create({ ...data, projectId: id });
      toast.success('Task created!');
      setCreateTaskModal(false);
      const res = await taskAPI.getAll({ projectId: id });
      setTasks(res.data.tasks);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create task'); }
    finally { setSubmitting(false); }
  };

  const handleUpdateTask = async (data) => {
    setSubmitting(true);
    try {
      await taskAPI.update(editTaskModal._id, data);
      toast.success('Task updated!');
      setEditTaskModal(null);
      const res = await taskAPI.getAll({ projectId: id });
      setTasks(res.data.tasks);
    } catch (err) { toast.error('Failed to update task'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteTask = async () => {
    setSubmitting(true);
    try {
      await taskAPI.delete(deleteTaskConfirm._id);
      toast.success('Task deleted');
      setDeleteTaskConfirm(null);
      setTasks(prev => prev.filter(t => t._id !== deleteTaskConfirm._id));
    } catch (err) { toast.error('Failed to delete task'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading project...</div>;
  if (!project) return <div style={{ padding: 40, textAlign: 'center' }}>Project not found. <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>Back</button></div>;

  const tasksByStatus = TASK_STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s) }), {});
  const completedPct = tasks.length > 0 ? Math.round((tasksByStatus.completed.length / tasks.length) * 100) : 0;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>← Projects</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>{project.name}</h1>
            <StatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </div>
          {project.description && <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{project.description}</p>}
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setCreateTaskModal(true)}>+ Add Task</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[['Total Tasks', tasks.length, '✅'], ['Completed', tasksByStatus.completed.length, '🏁'], ['In Progress', tasksByStatus.in_progress.length, '⚡'], ['To Do', tasksByStatus.todo.length, '📋']].map(([label, val, icon]) => (
          <div key={label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {icon} {val}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Overall Progress</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-light)' }}>{completedPct}%</span>
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div className="progress-fill" style={{ width: `${completedPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          <span>📅 {formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
          <span>By {project.createdBy?.name}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {['board', 'list'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '10px 24px', fontSize: 14, fontWeight: 500, borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`, color: activeTab === tab ? 'var(--accent-light)' : 'var(--text-muted)', transition: 'all 0.2s', textTransform: 'capitalize' }}>
            {tab === 'board' ? '🗂️ Kanban Board' : '📋 List View'}
          </button>
        ))}
      </div>

      {activeTab === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {TASK_STATUSES.map(status => (
            <div key={status} style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16, minHeight: 200 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{STATUS_LABELS[status]}</span>
                <span style={{ fontSize: 12, background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 99, color: 'var(--text-muted)' }}>{tasksByStatus[status]?.length || 0}</span>
              </div>
              {tasksByStatus[status]?.map(task => (
                <TaskCard key={task._id} task={task} canManage={canManage} onEdit={setEditTaskModal} onDelete={setDeleteTaskConfirm} />
              ))}
              {tasksByStatus[status]?.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>No tasks</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {tasks.length === 0 ? <div className="empty-state" style={{ padding: 40 }}>No tasks yet</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                  {['Title', 'Status', 'Priority', 'Assigned', 'Due Date'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500 }}>{task.title}</td>
                    <td style={{ padding: '14px 20px' }}><StatusBadge status={task.status} /></td>
                    <td style={{ padding: '14px 20px' }}><PriorityBadge priority={task.priority} /></td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-muted)' }}>{task.assignedTo?.name || '—'}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: isOverdue(task.dueDate, task.status) ? 'var(--danger)' : 'var(--text-muted)' }}>{formatDate(task.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={createTaskModal} onClose={() => setCreateTaskModal(false)} title="Create Task">
        <TaskForm projectId={id} users={users} onSubmit={handleCreateTask} loading={submitting} />
      </Modal>
      <Modal isOpen={!!editTaskModal} onClose={() => setEditTaskModal(null)} title="Edit Task">
        {editTaskModal && <TaskForm initialData={editTaskModal} projectId={id} users={users} onSubmit={handleUpdateTask} loading={submitting} />}
      </Modal>
      <ConfirmDialog isOpen={!!deleteTaskConfirm} onClose={() => setDeleteTaskConfirm(null)} onConfirm={handleDeleteTask}
        title="Delete Task" message={`Delete "${deleteTaskConfirm?.title}"?`} confirmLabel="Delete" danger loading={submitting} />
    </div>
  );
}
