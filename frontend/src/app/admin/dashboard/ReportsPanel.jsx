'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';

const reports = [
  {
    key: 'csv',
    title: 'Donations CSV',
    description: 'Plain CSV of all successful donations — importable into Tally, Zoho Books, or Excel.',
    path: (from, to) => `/admin/reports/donations-csv.php?${new URLSearchParams({ from, to })}`,
    filename: (from, to) => `donations-${from || 'all'}-to-${to || 'now'}.csv`,
  },
  {
    key: 'tally',
    title: 'Tally XML',
    description: 'Simplified Tally-importable voucher XML for donations received.',
    path: (from, to) => `/admin/reports/donations-tally-xml.php?${new URLSearchParams({ from, to })}`,
    filename: (from, to) => `tally-donations-${from || 'all'}-to-${to || 'now'}.xml`,
  },
  {
    key: 'csr',
    title: 'CSR Summary (Excel)',
    description: 'Impact summary + donation and coupon-redemption detail sheets, ready to share with a CSR partner.',
    path: (from, to) => `/admin/reports/csr-summary-xlsx.php?${new URLSearchParams({ from, to })}`,
    filename: (from, to) => `csr-summary-${from || 'all'}-to-${to || 'now'}.xlsx`,
  },
];

export default function ReportsPanel({ token }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [downloading, setDownloading] = useState(null);

  async function handleDownload(report) {
    setDownloading(report.key);
    try {
      const blob = await api.downloadReport(token, report.path(from, to));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.filename(from, to);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="block text-xs text-navy mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded border border-navy/20 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-navy mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded border border-navy/20 px-3 py-2 text-sm" />
        </div>
        <p className="self-end text-xs text-ink/40 pb-2">Leave blank for all-time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reports.map((report) => (
          <div key={report.key} className="bg-white border border-navy/10 rounded-soft p-5">
            <h3 className="font-display text-navy">{report.title}</h3>
            <p className="mt-2 text-xs text-ink/60 leading-relaxed">{report.description}</p>
            <button
              onClick={() => handleDownload(report)}
              disabled={downloading === report.key}
              className="mt-4 px-4 py-2 rounded-full bg-teal text-white text-sm hover:bg-teal-light transition-colors disabled:opacity-60"
            >
              {downloading === report.key ? 'Preparing…' : 'Download'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
