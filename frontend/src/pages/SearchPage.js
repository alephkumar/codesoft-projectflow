import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { projectAPI, taskAPI } from '../services/api';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { formatDate } from '../utils/helpers';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    Promise.all([
      projectAPI.getAll({ search: query }),
      taskAPI.getAll()
    ]).then(([projRes, taskRes]) => {
      setProjects(projRes.data.projects);
      setTasks(taskRes.data.tasks.filter(t => t.title?.toLowerCase().includes(query.toLowerCase()) || t.description?.toLowerCase().includes(query.toLowerCase())));
    }).finally(() => setLoading(false));
  }, [query]);

  if (!query) return <div className="fade-in"><div className="page-header"><h1 className="page-title">Search</h1></div><div className="card empty-state">Enter a search query in the header.</div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Search Results</h1>
          <p className="page-subtitle">Results for "{query}" — {projects.length + tasks.length} found</p>
        </div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Searching...</div> : (
        <>
          {projects.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontSize: 12 }}>Projects ({projects.length})</div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {projects.map((p, i) => (
                  <div key={p._id} onClick={() => navigate(`/projects/${p._id}`)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < projects.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <span style={{ fontSize: 24 }}>📁</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.description?.slice(0, 80)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}><StatusBadge status={p.status} /><PriorityBadge priority={p.priority} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tasks.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, marginBottom: 16, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Tasks ({tasks.length})</div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {tasks.map((t, i) => (
                  <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <span style={{ fontSize: 24 }}>✅</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.projectId?.name} · {formatDate(t.dueDate)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}><StatusBadge status={t.status} /><PriorityBadge priority={t.priority} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {projects.length === 0 && tasks.length === 0 && (
            <div className="empty-state card" style={{ padding: 60 }}>
              <div className="empty-state-icon">🔍</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>No results for "{query}"</div>
              <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Try different keywords or check your spelling.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
