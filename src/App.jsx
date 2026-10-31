import React, { lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './vx/ctx.jsx';
import Shell from './vx/Shell.jsx';
import Login from './vx/pages/Login.jsx';
import Toasts from './vx/Toasts.jsx';

const Overview = lazy(() => import('./vx/pages/Overview.jsx'));
const Billing = lazy(() => import('./vx/pages/Billing.jsx'));
const Content = lazy(() => import('./vx/pages/Content.jsx'));
const Filters = lazy(() => import('./vx/pages/Filters.jsx'));
const ParentsList = lazy(() => import('./vx/pages/Parents.jsx').then((m) => ({ default: m.ParentsList })));
const ParentDetail = lazy(() => import('./vx/pages/Parents.jsx').then((m) => ({ default: m.ParentDetail })));
const ChildDetail = lazy(() => import('./vx/pages/Parents.jsx').then((m) => ({ default: m.ChildDetail })));

function RequireAuth({ children }) {
  const { auth } = useApp();
  const loc = useLocation();
  if (!auth?.access_token) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  return children;
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth><Shell /></RequireAuth>}>
          <Route path="/overview" element={<Overview />} />
          <Route path="/parents" element={<ParentsList />} />
          <Route path="/parents/:id" element={<ParentDetail />} />
          <Route path="/children/:id" element={<ChildDetail />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/content/*" element={<Content />} />
          <Route path="/filters" element={<Filters />} />
        </Route>
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
      <Toasts />
    </AppProvider>
  );
}
