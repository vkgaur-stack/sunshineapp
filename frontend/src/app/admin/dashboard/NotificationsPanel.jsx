'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

const statusColors = {
  SENT: 'bg-teal-tint text-teal',
  FAILED: 'bg-clay/10 text-clay-dark',
  QUEUED: 'bg-sun/10 text-sun',
};

export default function NotificationsPanel({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const filters = {};
      if (channelFilter) filters.channel = channelFilter;
      if (statusFilter) filters.status = statusFilter;
      const { notifications } = await api.adminListNotifications(token, filters);
      setNotifications(notifications);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelFilter, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)}
          className="rounded border border-navy/20 px-3 py-1.5 text-sm">
          <option value="">All Channels</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="SMS">SMS</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded border border-navy/20 px-3 py-1.5 text-sm">
          <option value="">All Statuses</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
          <option value="QUEUED">Queued</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-ink/60">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-ink/60">No notifications logged yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-navy/10 text-navy/70">
                <th className="py-2 pr-3">Channel</th>
                <th className="py-2 pr-3">To</th>
                <th className="py-2 pr-3">Template</th>
                <th className="py-2 pr-3">Related</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">When</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className="border-b border-navy/5">
                  <td className="py-2 pr-3">{n.channel}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{n.toAddress}</td>
                  <td className="py-2 pr-3 text-xs">{n.templateType}</td>
                  <td className="py-2 pr-3 text-xs text-ink/60">
                    {n.relatedType ? `${n.relatedType}` : '—'}
                  </td>
                  <td className="py-2 pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[n.status] || ''}`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-xs text-ink/50">
                    {new Date(n.createdAt).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-ink/40">
        Without WhatsApp/SMS provider credentials configured on the backend,
        messages are logged here as &ldquo;SENT&rdquo; in dev-fallback mode
        (printed to the server console) rather than actually delivered —
        see <code>backend/.env.example</code>.
      </p>
    </div>
  );
}
