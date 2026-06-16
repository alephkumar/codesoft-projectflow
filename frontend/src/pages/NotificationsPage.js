import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import useToast from '../hooks/useToast';
import { timeAgo } from '../utils/helpers';

const TYPE_ICONS = {
  task_assigned: '👤', deadline_approaching: '⏰', task_completed: '✅',
  comment_added: '💬', project_update: '📁'
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch {}
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>Mark all as read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="empty-state-icon">🔔</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No notifications</div>
          <p style={{ color: 'var(--text-muted)' }}>You're all caught up! We'll notify you when something needs your attention.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {notifications.map((notification, i) => (
            <div key={notification._id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 16, padding: '18px 24px',
                borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                background: notification.isRead ? '' : 'rgba(99,102,241,0.04)',
                transition: 'background 0.2s', cursor: 'pointer'
              }}
              onClick={() => !notification.isRead && markRead(notification._id)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = notification.isRead ? '' : 'rgba(99,102,241,0.04)'}>
              <div style={{ fontSize: 24, marginTop: 2, flexShrink: 0 }}>{TYPE_ICONS[notification.type] || '🔔'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{notification.title}</span>
                  {!notification.isRead && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{notification.message}</p>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{timeAgo(notification.createdAt)}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
                style={{ color: 'var(--text-muted)', padding: '4px 8px', borderRadius: 6, fontSize: 16, flexShrink: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--danger)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
