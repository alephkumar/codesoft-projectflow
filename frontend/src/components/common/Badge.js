import React from 'react';
import { getPriorityColor, getStatusColor, getStatusLabel } from '../../utils/helpers';

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge badge-${getPriorityColor(priority)}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${getStatusColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export function Badge({ children, variant = 'muted' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}
