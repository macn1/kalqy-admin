import React from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui.jsx';
import { toCsv, downloadCsv } from '../utils/csv.js';
import { useAdmin } from '../hooks/AdminContext.jsx';

export default function ExportButton({ filename, columns, rows, preamble, label = 'Export CSV' }) {
  const { toast } = useAdmin();
  return (
    <Button icon={Download} disabled={!rows.length} onClick={() => {
      downloadCsv(`${filename}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(columns, rows, preamble));
      toast(`Exported ${rows.length} sample record${rows.length === 1 ? '' : 's'} to CSV`);
    }}>{label}</Button>
  );
}
