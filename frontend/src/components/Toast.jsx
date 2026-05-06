import React from 'react';

const CFG = {
  success: { marker: '[+]', color: 'var(--ink)' },
  error:   { marker: '[x]', color: '#c04040'     },
  info:    { marker: '[-]', color: 'var(--mute)' },
};

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      display: 'flex', flexDirection: 'column', gap: 6,
      zIndex: 200, pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const c = CFG[t.type] ?? CFG.info;
        return (
          <div key={t.id} className="toast-enter" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px',
            background: 'var(--canvas)',
            border: '1px solid var(--hairline)',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(15,0,0,0.08)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: c.color, fontFamily: 'var(--font)' }}>
              {c.marker}
            </span>
            <span style={{ fontSize: 11, color: 'var(--body)', fontFamily: 'var(--font)' }}>
              {t.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
