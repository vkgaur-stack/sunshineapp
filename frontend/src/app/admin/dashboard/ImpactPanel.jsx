'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function emptyForm() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    beneficiariesServed: 0,
    sessionsCompleted: 0,
    campsHeld: 0,
    subsidyDeliveredInRupees: 0,
    citiesServed: 0,
    couponsRedeemed: 0,
  };
}

export default function ImpactPanel({ token }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('idle');

  async function refresh() {
    setLoading(true);
    try {
      const { metrics } = await api.adminListImpactMetrics(token);
      setRows(metrics);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function numberField(key) {
    return {
      value: form[key],
      onChange: (e) => setForm((prev) => ({ ...prev, [key]: Number(e.target.value) })),
    };
  }

  async function handleSave(e) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await api.adminUpsertImpactMetrics(token, form);
      setStatus('idle');
      refresh();
    } catch (err) {
      setStatus('error');
      alert(err.message);
    }
  }

  function loadForEdit(row) {
    setForm({
      month: row.metric_month,
      year: row.metric_year,
      beneficiariesServed: row.beneficiaries_served,
      sessionsCompleted: row.sessions_completed,
      campsHeld: row.camps_held,
      subsidyDeliveredInRupees: row.subsidy_delivered_in_rupees,
      citiesServed: row.cities_served,
      couponsRedeemed: row.coupons_redeemed,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h2 className="font-display text-lg text-navy mb-3">Enter / Update Monthly Impact</h2>
        <p className="text-xs text-ink/50 mb-4">
          Saving a month that already has data overwrites those numbers in
          place — it never creates a duplicate entry for the same month.
        </p>
        <form onSubmit={handleSave} className="grid gap-3 bg-white border border-navy/10 rounded-soft p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-navy mb-1">Month</label>
              <select
                value={form.month}
                onChange={(e) => setForm((prev) => ({ ...prev, month: Number(e.target.value) }))}
                className="w-full rounded border border-navy/20 px-3 py-2 text-sm"
              >
                {monthNames.map((name, i) => (
                  <option key={name} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-navy mb-1">Year</label>
              <input type="number" {...numberField('year')}
                className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-navy mb-1">Beneficiaries Served</label>
            <input type="number" min="0" {...numberField('beneficiariesServed')}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-navy mb-1">Sessions Completed</label>
            <input type="number" min="0" {...numberField('sessionsCompleted')}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-navy mb-1">Health Camps Held</label>
            <input type="number" min="0" {...numberField('campsHeld')}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-navy mb-1">Subsidy Delivered (₹)</label>
            <input type="number" min="0" {...numberField('subsidyDeliveredInRupees')}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-navy mb-1">Cities Reached</label>
            <input type="number" min="0" {...numberField('citiesServed')}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-navy mb-1">Coupons Redeemed</label>
            <input type="number" min="0" {...numberField('couponsRedeemed')}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={status === 'submitting'}
            className="px-4 py-2 rounded-full bg-clay text-white text-sm hover:bg-clay-dark transition-colors disabled:opacity-60">
            {status === 'submitting' ? 'Saving…' : 'Save Month'}
          </button>
          <button type="button" onClick={() => setForm(emptyForm())}
            className="text-xs text-ink/50 underline justify-self-start">
            Clear form
          </button>
        </form>
      </div>

      <div className="lg:col-span-2">
        <h2 className="font-display text-lg text-navy mb-3">Months Entered</h2>
        <p className="text-xs text-ink/50 mb-4">
          The public Our Impact page shows a &quot;check back shortly&quot;
          message until at least one month is saved here.
        </p>
        {loading ? (
          <p className="text-sm text-ink/60">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink/60">No months entered yet.</p>
        ) : (
          <div className="grid gap-3">
            {rows.map((row) => (
              <div key={row.id} className="bg-white border border-navy/10 rounded-soft p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-navy">
                    {monthNames[row.metric_month - 1]} {row.metric_year}
                  </p>
                  <p className="mt-1 text-xs text-ink/60">
                    {row.beneficiaries_served} beneficiaries · {row.sessions_completed} sessions ·{' '}
                    {row.camps_held} camps · ₹{Number(row.subsidy_delivered_in_rupees).toLocaleString('en-IN')} subsidy ·{' '}
                    {row.cities_served} cities · {row.coupons_redeemed} coupons
                  </p>
                </div>
                <button onClick={() => loadForEdit(row)} className="text-xs text-teal underline flex-shrink-0">
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
