import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'My Tasks',
  '/team': 'Team',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/profile': 'Profile'
};

export default function Header({ unreadNotifications = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] || 'ProjectFlow';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <header style={{
      position: 'fixed', top: 0, right: 0, left: 'var(--sidebar-width)',
      height: 'var(--header-height)', background: 'rgba(10,15,30,0.9)',
      backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 32px',
      justifyContent: 'space-between', zIndex: 90
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
        {pageTitle}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }}>🔍</span>
          <input
            type="text"
            placeholder="Search projects, tasks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 14px 8px 36px', fontSize: 13,
              color: 'var(--text-primary)', width: 280, transition: 'all 0.2s'
            }}
          />
        </form>

        <button onClick={() => navigate('/notifications')} style={{
          position: 'relative', padding: '8px', borderRadius: 8,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', fontSize: 16, transition: 'all 0.2s'
        }}>
          🔔
          {unreadNotifications > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4, background: 'var(--danger)',
              color: 'white', fontSize: 10, fontWeight: 700, width: 18, height: 18,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
          )}
        </button>

        <button onClick={() => navigate('/profile')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
          borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)',
          cursor: 'pointer', transition: 'all 0.2s'
        }}>
          <div className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{user?.name?.split(' ')[0]}</span>
        </button>
      </div>
    </header>
  );
}
