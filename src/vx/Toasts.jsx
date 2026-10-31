import React from 'react';
import { useApp } from './ctx.jsx';

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : ''}`} role="status">{t.message}</div>)}
    </div>
  );
}
