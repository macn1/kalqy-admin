import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SortIcon, TableSkeleton, EmptyState } from './ui.jsx';

/**
 * columns: [{ key, header, render?(row), sortValue?(row), className }]
 * Sorting and pagination are client-side over the rows passed in (already filtered by the page).
 */
export default function DataTable({ columns, rows, loading, pageSize = 10, onRowClick, rowKey = 'id', empty, label, initialSort }) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort || null);

  useEffect(() => { setPage(1); }, [rows.length]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const val = col.sortValue || ((r) => r[col.key]);
    return [...rows].sort((a, b) => {
      const x = val(a), y = val(b);
      const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true });
      return sort.dir === 'asc' ? r : -r;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = sorted.slice((cur - 1) * pageSize, cur * pageSize);
  const toggle = (key) => setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }));

  if (loading) return <TableSkeleton />;
  if (!rows.length) return empty || <EmptyState title="Nothing to show" text="No records match the current filters." />;

  const nums = [];
  for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - cur) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');

  return (
    <>
      <div className="table-wrap" tabIndex={0} role="region" aria-label={label || 'Data table'}>
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined} className={c.className}>
                  {c.sortable === false || !c.header ? c.header : <button onClick={() => toggle(c.key)}>{c.header}<SortIcon dir={sort?.key === c.key ? sort.dir : null} /></button>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r[rowKey]} className={onRowClick ? 'clickable' : ''} onClick={onRowClick ? () => onRowClick(r) : undefined}
                tabIndex={onRowClick ? 0 : undefined} onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onRowClick(r); } : undefined}>
                {columns.map((c) => <td key={c.key} className={c.className}>{c.render ? c.render(r) : r[c.key]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <span>Showing {(cur - 1) * pageSize + 1}–{Math.min(cur * pageSize, sorted.length)} of {sorted.length}</span>
        <nav className="pages" aria-label="Pagination">
          <button className="pg" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
          {nums.map((n, i) => n === '…' ? <span key={`e${i}`} className="faint">…</span> : (
            <button key={n} className="pg" aria-current={n === cur ? 'page' : undefined} aria-label={`Page ${n}`} onClick={() => setPage(n)}>{n}</button>
          ))}
          <button className="pg" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
        </nav>
      </div>
    </>
  );
}
