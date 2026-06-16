import React, { useState, useEffect } from 'react';
import { userAPI, taskAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import useToast from '../hooks/useToast';
import { formatDate, timeAgo } from '../utils/helpers';
import { Badge } from '../components/common/Badge';

const ROLE_LABELS = { admin: 'Admin', project_manager: 'Project Manager', team_member: 'Team Member' };
const ROLE_COLORS = { admin: 'critical', project_manager: 'accent', team_member: 'info' };

function UserCard({ member, taskCount, onEdit, onDeactivate, canManage, isCurrentUser }) {
  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div className="avatar" style={{ width: 52, height: 52, fontSize: 20, flexShrink: 0 }}>
          {member.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{member.name}</div>
            {isCurrentUser && <span className="badge badge-success" style={{ fontSize: 10 }}>You</span>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{member.email}</div>
          <div style={{ marginTop: 8 }}>
            <Badge variant={ROLE_COLORS[member.role]}>{ROLE_LABELS[member.role]}</Badge>
          </div>
        </div>
        {canManage && !isCurrentUser && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(member)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDeactivate(member)}>Deactivate</button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-light)' }}>{taskCount}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Tasks</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{member.lastLogin ? timeAgo(member.lastLogin) : 'Never'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Login</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{formatDate(member.createdAt)}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</div>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deactivateConfirm, setDeactivateConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user?.role === 'admin';

  useEffect(() => {
    Promise.all([userAPI.getAll(), taskAPI.getAll()])
      .then(([usersRes, tasksRes]) => {
        setUsers(usersRes.data.users);
        setTasks(tasksRes.data.tasks);
      }).catch(() => toast.error('Failed to load team'))
      .finally(() => setLoading(false));
  }, []);

  const getTaskCount = (userId) => tasks.filter(t => t.assignedTo?._id === userId && t.status !== 'completed').length;

  const handleEdit = async (data) => {
    setSubmitting(true);
    try {
      const res = await userAPI.update(editModal._id, data);
      setUsers(prev => prev.map(u => u._id === editModal._id ? res.data.user : u));
      toast.success('User updated');
      setEditModal(null);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update'); }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = async () => {
    setSubmitting(true);
    try {
      await userAPI.delete(deactivateConfirm._id);
      setUsers(prev => prev.filter(u => u._id !== deactivateConfirm._id));
      toast.success('User deactivated');
      setDeactivateConfirm(null);
    } catch { toast.error('Failed to deactivate'); }
    finally { setSubmitting(false); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading team...</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{users.length} members</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Members', val: users.length, icon: '👥', color: 'var(--accent)' },
          { label: 'Admins & PMs', val: users.filter(u => u.role !== 'team_member').length, icon: '🛡️', color: 'var(--warning)' },
          { label: 'Active Tasks', val: tasks.filter(t => t.status !== 'completed').length, icon: '⚡', color: 'var(--success)' }
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginTop: 4 }}>{s.icon} {s.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ width: 280 }} placeholder="🔍 Search members..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: 200 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
          <option value="team_member">Team Member</option>
        </select>
        {(search || roleFilter) && <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setRoleFilter(''); }}>Clear</button>}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">👥</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>No members found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filtered.map(member => (
            <UserCard key={member._id} member={member} taskCount={getTaskCount(member._id)}
              onEdit={setEditModal} onDeactivate={setDeactivateConfirm}
              canManage={canManage} isCurrentUser={member._id === user._id} />
          ))}
        </div>
      )}

      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Edit Member">
        {editModal && (
          <form onSubmit={e => { e.preventDefault(); const fd = new FormData(e.target); handleEdit(Object.fromEntries(fd)); }}>
            <div className="form-group"><label className="form-label">Name</label>
              <input name="name" className="form-input" defaultValue={editModal.name} required /></div>
            <div className="form-group"><label className="form-label">Role</label>
              <select name="role" className="form-select" defaultValue={editModal.role}>
                <option value="team_member">Team Member</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Admin</option>
              </select></div>
            <button type="submit" className="btn btn-primary w-full" disabled={submitting} style={{ justifyContent: 'center' }}>
              {submitting ? 'Saving...' : 'Update Member'}
            </button>
          </form>
        )}
      </Modal>
      <ConfirmDialog isOpen={!!deactivateConfirm} onClose={() => setDeactivateConfirm(null)} onConfirm={handleDeactivate}
        title="Deactivate User" message={`Deactivate ${deactivateConfirm?.name}? They will lose access.`}
        confirmLabel="Deactivate" danger loading={submitting} />
    </div>
  );
}
