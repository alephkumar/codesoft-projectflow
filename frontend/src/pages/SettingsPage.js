import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [taskAssigned, setTaskAssigned] = useState(true);

  const Toggle = ({ value, onChange, label, description }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 44, height: 24, borderRadius: 12, padding: 2,
        background: value ? 'var(--accent)' : 'var(--bg-hover)',
        border: `1px solid ${value ? 'var(--accent)' : 'var(--border)'}`,
        transition: 'all 0.2s', position: 'relative', flexShrink: 0
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          transform: value ? 'translateX(20px)' : 'translateX(0)',
          transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
        }} />
      </button>
    </div>
  );

  if (user?.role !== 'admin' && user?.role !== 'project_manager') {
    return (
      <div className="fade-in">
        <div className="page-header"><h1 className="page-title">Settings</h1></div>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Access Restricted</div>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Settings are available to Admins and Project Managers only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your workspace preferences</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Notifications</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Control how you receive notifications</div>
        <Toggle value={emailNotifications} onChange={setEmailNotifications} label="Email Notifications" description="Receive notifications via email" />
        <Toggle value={deadlineAlerts} onChange={setDeadlineAlerts} label="Deadline Alerts" description="Get notified 24h before task deadlines" />
        <Toggle value={taskAssigned} onChange={setTaskAssigned} label="Task Assignment" description="Notify when a task is assigned to you" />
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Workspace Info</div>
        <div style={{ display: 'grid', gap: 16 }}>
          {[
            { label: 'Version', value: '1.0.0' },
            { label: 'Environment', value: process.env.NODE_ENV || 'development' },
            { label: 'API URL', value: process.env.REACT_APP_API_URL || '/api' }
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'monospace', color: 'var(--accent-light)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Danger Zone</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Irreversible actions — proceed with caution</div>
        <div style={{ padding: 16, border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, background: 'rgba(239,68,68,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)', marginBottom: 4 }}>Delete All Archived Projects</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>This will permanently remove all archived projects and their tasks.</div>
          <button className="btn btn-danger btn-sm" onClick={() => alert('This would delete archived projects in production.')}>
            Delete Archived Projects
          </button>
        </div>
      </div>
    </div>
  );
}
