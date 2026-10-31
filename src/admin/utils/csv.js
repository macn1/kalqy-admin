// CSV helpers. Cells starting with = + - @ are prefixed to stop spreadsheet formula injection.
const esc = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(columns, rows, preamble = []) {
  const head = columns.map((c) => esc(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(c.value ? c.value(r) : r[c.key])).join(','));
  const pre = preamble.map(([k, v]) => `${esc(k)},${esc(v)}`);
  return [...pre, ...(pre.length ? [''] : []), head, ...body].join('\r\n');
}

export function downloadCsv(filename, text) {
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
