import React from 'react';

export function CardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ height: 200 }}>
          <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 8, width: '100%', marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skeleton" style={{ height: 28, width: 28, borderRadius: '50%' }} />
            <div className="skeleton" style={{ height: 28, width: 28, borderRadius: '50%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ height: 16, flex: 2 }} />
          <div className="skeleton" style={{ height: 16, flex: 1 }} />
          <div className="skeleton" style={{ height: 16, flex: 1 }} />
          <div className="skeleton" style={{ height: 16, width: 80 }} />
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card" style={{ height: 120 }}>
          <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 36, width: '70%' }} />
        </div>
      ))}
    </div>
  );
}
