import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '⬛', label: 'Dashboard' },
  { to: '/projects', icon: '📁', label: 'Projects' },
  { to: '/tasks', icon: '✅', label: 'My Tasks' },
  { to: '/team', icon: '👥', label: 'Team' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
];

const ADMIN_ITEMS = [
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

const styles = {
  sidebar: {
    position: 'fixed', left: 0, top: 0, bottom: 0, width: 'var(--sidebar-width)',
    background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto'
  },
  logo: {
    padding: '24px 20px', borderBottom: '1px solid var(--border)',
    fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800,
    background: 'linear-gradient(135deg, var(--accent-light), #c084fc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px'
  },
  nav: { flex: 1, padding: '16px 12px' },
  navSection: { marginBottom: '24px' },
  navLabel: { fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0 8px', marginBottom: '8px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
    borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 500,
    color: 'var(--text-secondary)', transition: 'all var(--transition)',
    marginBottom: '2px', cursor: 'pointer'
  },
  activeItem: { background: 'var(--accent-glow)', color: 'var(--accent-light)', borderLeft: '2px solid var(--accent)' },
  userSection: {
    padding: '16px', borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: '12px'
  }
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logo}>⚡ ProjectFlow</div>

      <nav style={styles.nav}>
        <div style={styles.navSection}>
          <div style={styles.navLabel}>Main Menu</div>
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to}
              style={({ isActive }) => ({
                ...styles.navItem,
                textDecoration: 'none',
                ...(isActive ? styles.activeItem : {}),
                ...(hoveredItem === item.to && !isActive ? { background: 'var(--bg-hover)', color: 'var(--text-primary)' } : {})
              })}
              onMouseEnter={() => setHoveredItem(item.to)}
              onMouseLeave={() => setHoveredItem(null)}>
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        {(user?.role === 'admin' || user?.role === 'project_manager') && (
          <div style={styles.navSection}>
            <div style={styles.navLabel}>Admin</div>
            {ADMIN_ITEMS.map(item => (
              <NavLink key={item.to} to={item.to}
                style={({ isActive }) => ({
                  ...styles.navItem, textDecoration: 'none',
                  ...(isActive ? styles.activeItem : {})
                })}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div style={styles.userSection}>
        <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
        </div>
        <button onClick={handleLogout} style={{ color: 'var(--text-muted)', padding: '4px', borderRadius: 6, transition: 'color 0.2s' }}
          title="Logout" onMouseEnter={e => e.target.style.color = 'var(--danger)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
          ↩
        </button>
      </div>
    </aside>
  );
}
