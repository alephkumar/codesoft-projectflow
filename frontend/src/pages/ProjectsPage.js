import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge, StatusBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import useToast from '../hooks/useToast';
import { formatDate, truncate, timeAgo } from '../utils/helpers';

const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function ProjectForm({ initialData, onSubmit, loading }) {
  const [form, setForm] = useState(initialData || { name: '', description: '', status: 'planning', priority: 'medium', startDate: '', endDate: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <div className="form-group"><label className="form-label">Project Name *</label>
        <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Enter project name" required /></div>
      <div className="form-group"><label className="form-label">Description</label>
        <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Project description..." rows={3} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group"><label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select></div>
        <div className="form-group"><label className="form-label">Priority</label>
          <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group"><label className="form-label">Start Date *</label>
          <input type="date" className="form-input" value={form.startDate?.split('T')[0] || ''} onChange={e => set('startDate', e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">End Date *</label>
          <input type="date" className="form-input" value={form.endDate?.split('T')[0] || ''} onChange={e => set('endDate', e.target.value)} required /></div>
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>
        {loading ? 'Saving...' : (initialData ? 'Update Project' : 'Create Project')}
      </button>
    </form>
  );
}

function ProjectCard({ project, onEdit, onDelete, onArchive, onClick }) {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'project_manager';
  const isOverdue = new Date(project.endDate) < new Date() && project.status !== 'completed';

  return (
    <div className="card fade-in" style={{ cursor: 'pointer', transition: 'all 0.2s', border: isOverdue ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isOverdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}
      onClick={() => onClick(project._id)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{project.name}</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{truncate(project.description, 80)}</p>
        </div>
        {canManage && (
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-icon btn-secondary btn-sm" onClick={() => onEdit(project)} title="Edit">✏️</button>
            <button className="btn btn-icon btn-secondary btn-sm" onClick={() => onArchive(project)} title="Archive">📦</button>
            <button className="btn btn-icon btn-danger btn-sm" onClick={() => onDelete(project)} title="Delete">🗑️</button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <StatusBadge status={project.status} />
        <PriorityBadge priority={project.priority} />
        {isOverdue && <span className="badge badge-danger">Overdue</span>}
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
          <span>Progress</span>
          <span style={{ fontWeight: 600, color: 'var(--accent-light)' }}>{project.progress || 0}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${project.progress || 0}%` }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{project.completedTasks || 0}/{project.totalTasks || 0} tasks</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>{project.createdBy?.name?.charAt(0)}</div>
          <span>{project.createdBy?.name}</span>
        </div>
        <span>📅 {formatDate(project.endDate)}</span>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [archiveConfirm, setArchiveConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const canManage = user?.role === 'admin' || user?.role === 'project_manager';

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      const res = await projectAPI.getAll(params);
      setProjects(res.data.projects);
    } catch (err) { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      await projectAPI.create(data);
      toast.success('Project created!');
      setCreateModal(false);
      loadProjects();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create'); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (data) => {
    setSubmitting(true);
    try {
      await projectAPI.update(editModal._id, data);
      toast.success('Project updated!');
      setEditModal(null);
      loadProjects();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await projectAPI.delete(deleteConfirm._id);
      toast.success('Project deleted');
      setDeleteConfirm(null);
      loadProjects();
    } catch (err) { toast.error('Failed to delete'); }
    finally { setSubmitting(false); }
  };

  const handleArchive = async () => {
    setSubmitting(true);
    try {
      await projectAPI.archive(archiveConfirm._id);
      toast.success('Project archived');
      setArchiveConfirm(null);
      loadProjects();
    } catch (err) { toast.error('Failed to archive'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setCreateModal(true)}>+ New Project</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ width: 280 }} placeholder="🔍 Search projects..." value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
        <select className="form-select" style={{ width: 160 }} value={filters.status}
          onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="form-select" style={{ width: 160 }} value={filters.priority}
          onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filters.status || filters.priority || filters.search) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({ status: '', priority: '', search: '' })}>Clear</button>
        )}
      </div>

      {loading ? <CardSkeleton count={6} /> : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No projects found</div>
          <p>{canManage ? 'Create your first project to get started.' : 'No projects assigned to you yet.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {projects.map(project => (
            <ProjectCard key={project._id} project={project} onClick={(id) => navigate(`/projects/${id}`)}
              onEdit={setEditModal} onDelete={setDeleteConfirm} onArchive={setArchiveConfirm} />
          ))}
        </div>
      )}

      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="New Project">
        <ProjectForm onSubmit={handleCreate} loading={submitting} />
      </Modal>

      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Project">
        {editModal && <ProjectForm initialData={editModal} onSubmit={handleEdit} loading={submitting} />}
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Delete Project" message={`Are you sure you want to delete "${deleteConfirm?.name}"? This will also delete all tasks.`}
        confirmLabel="Delete Project" danger loading={submitting} />

      <ConfirmDialog isOpen={!!archiveConfirm} onClose={() => setArchiveConfirm(null)} onConfirm={handleArchive}
        title="Archive Project" message={`Archive "${archiveConfirm?.name}"? It will be hidden from active projects.`}
        confirmLabel="Archive" loading={submitting} />
    </div>
  );
}
