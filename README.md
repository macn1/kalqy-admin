# KALQY Admin Dashboard (frontend demo)

Premium admin dashboard for https://kalqy.in, built with Vite + React 18, React Router 6, Recharts and lucide-react.

```
npm install
npm run dev      # http://localhost:5173  (admin at /admin/login)
npm run build
```

**Demo login:** `admin@kalqy.in` / `KalqyDemo123!` (mock auth, `src/services/mockAuth.js`; never reuse in production).

## Structure
- `src/admin/{components,layouts,pages,hooks,utils}`: UI kit, shell, 15 routes (+ student / school detail), hooks, helpers
- `src/data/*`: deterministic seed generators (single source of truth for all sample records)
- `src/services/demoDataService.js`: async localStorage-backed CRUD (swap for real API calls later)
- Public brand assets in `public/images` were copied from kalqy.in.

## Notes
- All records are fictional; a DEMO DATA badge is always visible. Nothing touches kalqy.in.
- Reset / clear sample data: Settings → Data & Privacy.
- Role-based navigation is simulated in the browser only; it is not real security.
