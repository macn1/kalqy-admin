import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button, IconButton, cx } from './ui.jsx';

function useOverlay(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; prev?.focus?.(); };
  }, [open, onClose]);
  return ref;
}

export function Modal({ open, title, onClose, children, footer, size }) {
  const ref = useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('modal', size)} role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
        <div className="modal-head"><h3>{title}</h3><IconButton icon={X} label="Close dialog" onClick={onClose} /></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>, document.body);
}

export function Drawer({ open, title, subtitle, onClose, children, footer }) {
  const ref = useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="drawer-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
        <div className="modal-head">
          <div><h3>{title}</h3>{subtitle && <p className="muted" style={{ fontSize: 13 }}>{subtitle}</p>}</div>
          <IconButton icon={X} label="Close panel" onClick={onClose} />
        </div>
        <div className="modal-body" style={{ flex: 1 }}>{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </aside>
    </div>, document.body);
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onClose, loading }) {
  return (
    <Modal open={open} title={title} onClose={onClose}
      footer={<><Button onClick={onClose}>Cancel</Button><Button variant={danger ? 'danger' : 'primary'} className={danger ? 'solid' : ''} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <p className="muted">{message}</p>
    </Modal>
  );
}
