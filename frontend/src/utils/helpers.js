import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
};

export const timeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'completed') return false;
  return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getPriorityColor = (priority) => {
  const colors = { low: 'success', medium: 'info', high: 'warning', critical: 'critical' };
  return colors[priority] || 'muted';
};

export const getStatusColor = (status) => {
  const colors = {
    planning: 'muted', active: 'accent', on_hold: 'warning', completed: 'success', archived: 'muted',
    todo: 'muted', in_progress: 'info', review: 'warning', done: 'success'
  };
  return colors[status] || 'muted';
};

export const getStatusLabel = (status) => {
  const labels = {
    planning: 'Planning', active: 'Active', on_hold: 'On Hold', completed: 'Completed', archived: 'Archived',
    todo: 'To Do', in_progress: 'In Progress', review: 'In Review', completed: 'Completed'
  };
  return labels[status] || status;
};

export const truncate = (str, len = 60) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
};

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
