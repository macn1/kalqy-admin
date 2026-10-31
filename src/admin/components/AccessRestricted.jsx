import React from 'react';
import { Link } from 'react-router-dom';
import { Doodle, Button } from './ui.jsx';

export default function AccessRestricted({ role, onReset }) {
  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 560, margin: '40px auto' }}>
        <div className="empty">
          <Doodle kind="marble" />
          <h4>Access restricted for {role}</h4>
          <p>Your simulated role does not include permission to view this page. This is a frontend demonstration of role-based navigation and is not real security.</p>
          <div className="row">
            <Link to="/admin/dashboard"><Button variant="primary">Back to overview</Button></Link>
            {onReset && <Button onClick={onReset}>Stop previewing role</Button>}
          </div>
        </div>
      </div>
    </div>
  );
}
