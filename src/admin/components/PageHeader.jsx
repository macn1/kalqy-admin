import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const NAMES = {
  dashboard: 'Overview', students: 'Students', schools: 'Schools & Centres', parents: 'Parents', teachers: 'Teachers',
  games: 'Games Library', 'game-sessions': 'Game Sessions', 'learning-analytics': 'Learning Analytics', reports: 'Reports & Exports',
  website: 'Website Content', leads: 'Demo Requests & Leads', downloads: 'Downloads & Installations', team: 'Team & Roles', settings: 'Settings',
};

export default function PageHeader({ title, description, actions, crumbs }) {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean).slice(1);
  const auto = parts.map((p, i) => ({ label: NAMES[p] || p, to: '/admin/' + parts.slice(0, i + 1).join('/') }));
  const trail = crumbs || auto;
  return (
    <header className="page-header">
      <div>
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/admin/dashboard">Admin</Link>
          {trail.map((c, i) => (
            <React.Fragment key={c.to + i}>
              <ChevronRight size={13} aria-hidden />
              {i === trail.length - 1 ? <span aria-current="page" style={{ color: 'var(--text)' }}>{c.label}</span> : <Link to={c.to}>{c.label}</Link>}
            </React.Fragment>
          ))}
        </nav>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}
