import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useAdmin } from '../hooks/AdminContext.jsx';

export default function Toasts() {
  const { toasts, dismissToast } = useAdmin();
  return (
    <div className="toasts" aria-live="polite" role="status">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === 'error' ? <AlertTriangle className="lead" size={18} /> : <CheckCircle2 className="lead" size={18} />}
          <span>{t.message}</span>
          <button aria-label="Dismiss" onClick={() => dismissToast(t.id)}><X size={15} /></button>
        </div>
      ))}
    </div>
  );
}
