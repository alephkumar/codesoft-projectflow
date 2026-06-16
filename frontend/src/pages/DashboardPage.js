import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatSkeleton } from '../components/common/LoadingSkeleton';
import { StatusBadge } from '../components/common/Badge';
import { timeAgo } from '../utils/helpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend, Filler);

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>{label}</div>
        <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 32, opacity: 0.6 }}>{icon}</div>
    </div>
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '0 0 12px 12px' }} />
  </div>
);

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#131c35', borderColor: '#1e2d4a', borderWidth: 1 } },
  scales: { x: { grid: { color: '#1e2d4a' }, ticks: { color: '#64748b' } }, y: { grid: { color: '#1e2d4a' }, ticks: { color: '#64748b' } } }
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    dashboardAPI.getStats().then(res => setStats(res.data.stats)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="fade-in"><StatSkeleton /></div>;

  const trendData = {
    labels: stats?.chartData?.taskCompletionTrend?.map(d => d.date) || [],
    datasets: [{
      label: 'Tasks Completed',
      data: stats?.chartData?.taskCompletionTrend?.map(d => d.completed) || [],
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true, tension: 0.4, pointBackgroundColor: '#6366f1', pointRadius: 4
    }]
  };

  const statusData = {
    labels: ['Active', 'Completed', 'Planning', 'On Hold'],
    datasets: [{
      data: [stats?.projects?.active, stats?.projects?.completed, stats?.projects?.planning, stats?.projects?.onHold],
      backgroundColor: ['rgba(99,102,241,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(100,116,139,0.8)'],
      borderColor: ['#6366f1', '#10b981', '#f59e0b', '#64748b'],
      borderWidth: 1
    }]
  };

  const taskStatusData = {
    labels: ['To Do', 'In Progress', 'Review', 'Completed'],
    datasets: [{
      data: [stats?.tasks?.todo, stats?.tasks?.inProgress, stats?.tasks?.review, stats?.tasks?.completed],
      backgroundColor: ['rgba(100,116,139,0.7)', 'rgba(59,130,246,0.7)', 'rgba(245,158,11,0.7)', 'rgba(16,185,129,0.7)'],
      borderRadius: 6, borderSkipped: false
    }]
  };

  const activityIcons = {
    project_created: '📁', task_created: '✅', status_changed: '🔄',
    task_assigned: '👤', comment_added: '💬', attachment_uploaded: '📎', member_added: '👥'
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your projects today.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        <StatCard label="Total Projects" value={stats?.projects?.total || 0} icon="📁" color="var(--accent)" sub={`${stats?.projects?.active} active`} />
        <StatCard label="Total Tasks" value={stats?.tasks?.total || 0} icon="✅" color="var(--info)" sub={`${stats?.tasks?.completed} completed`} />
        <StatCard label="Overdue Tasks" value={stats?.tasks?.overdue || 0} icon="⚠️" color="var(--danger)" sub="Need attention" />
        <StatCard label="Team Members" value={stats?.users?.total || 0} icon="👥" color="var(--success)" sub="Active users" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 24 }}>Task Completion Trend</div>
          <div style={{ height: 220 }}>
            <Line data={trendData} options={{ ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} />
          </div>
        </div>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 24 }}>Project Status</div>
          <div style={{ height: 220, display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={statusData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } } }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 24 }}>Task Distribution</div>
          <div style={{ height: 200 }}>
            <Bar data={taskStatusData} options={{ ...chartDefaults, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        <div className="card">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Project Progress</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {stats?.projectProgress?.length === 0 && <div className="empty-state" style={{ padding: '20px' }}>No projects yet</div>}
            {stats?.projectProgress?.map(project => (
              <div key={project.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${project.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{project.name}</span>
                  <span style={{ fontSize: 13, color: 'var(--accent-light)', fontWeight: 600 }}>{project.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{project.completedTasks}/{project.totalTasks} tasks</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Recent Activity</div>
        {stats?.recentActivity?.length === 0 && <div className="empty-state">No recent activity</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {stats?.recentActivity?.slice(0, 8).map((log, i) => (
            <div key={log._id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < 7 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 18, width: 32, textAlign: 'center' }}>{activityIcons[log.action] || '📌'}</div>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{log.userId?.name?.charAt(0) || '?'}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{log.userId?.name}</strong>{' '}
                  {log.action.replace(/_/g, ' ')}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(log.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
