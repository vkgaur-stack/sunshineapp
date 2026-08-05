'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function CouponsPanel({ token }) {
  const [coupons, setCoupons] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ serviceId: '', quantity: 5, valueInPaise: '', expiresAt: '' });
  const [genStatus, setGenStatus] = useState('idle');
  const [genError, setGenError] = useState('');
  const [assignFor, setAssignFor] = useState(null); // coupon id currently assigning
  const [assignBeneficiaryId, setAssignBeneficiaryId] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      const { coupons } = await api.adminListCoupons(token);
      setCoupons(coupons);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.listServices().then(({ services }) => setServices(services || [])).catch(() => {});
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGenerate(e) {
    e.preventDefault();
    setGenStatus('submitting');
    setGenError('');
    try {
      await api.adminGenerateCoupons(token, {
        serviceId: form.serviceId,
        quantity: Number(form.quantity),
        valueInPaise: form.valueInPaise ? Math.round(Number(form.valueInPaise) * 100) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      setGenStatus('success');
      setForm({ serviceId: '', quantity: 5, valueInPaise: '', expiresAt: '' });
      refresh();
    } catch (err) {
      setGenStatus('error');
      setGenError(err.message);
    }
  }

  async function handleAssign(couponId) {
    if (!assignBeneficiaryId) return;
    try {
      await api.adminAssignCoupon(token, couponId, assignBeneficiaryId);
      setAssignFor(null);
      setAssignBeneficiaryId('');
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h2 className="font-display text-lg text-navy mb-3">Generate Coupons</h2>
        <form onSubmit={handleGenerate} className="grid gap-3 bg-white border border-navy/10 rounded-soft p-4">
          <div>
            <label className="block text-xs text-navy mb-1">Service</label>
            <select required value={form.serviceId}
              onChange={(e) => setForm((p) => ({ ...p, serviceId: e.target.value }))}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm">
              <option value="">Choose service</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-navy mb-1">Quantity</label>
            <input type="number" min="1" max="500" required value={form.quantity}
              onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-navy mb-1">Subsidised Value (₹, optional)</label>
            <input type="number" min="1" value={form.valueInPaise}
              onChange={(e) => setForm((p) => ({ ...p, valueInPaise: e.target.value }))}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-navy mb-1">Expires On (optional, default 6 months)</label>
            <input type="date" value={form.expiresAt}
              onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          </div>
          {genStatus === 'error' && <p className="text-clay-dark text-xs">{genError}</p>}
          <button type="submit" disabled={genStatus === 'submitting'}
            className="px-4 py-2 rounded-full bg-clay text-white text-sm hover:bg-clay-dark transition-colors disabled:opacity-60">
            {genStatus === 'submitting' ? 'Generating…' : 'Generate Batch'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2">
        <h2 className="font-display text-lg text-navy mb-3">All Coupons</h2>
        {loading ? (
          <p className="text-sm text-ink/60">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-ink/60">No coupons yet — generate a batch to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-navy/10 text-navy/70">
                  <th className="py-2 pr-3">QR</th>
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Service</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Beneficiary</th>
                  <th className="py-2 pr-3">Expires</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-navy/5">
                    <td className="py-2 pr-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={api.couponQrCodeUrl(c.code)} alt={`QR for ${c.code}`} className="h-10 w-10" />
                    </td>
                    <td className="py-2 pr-3 font-mono text-xs">{c.code}</td>
                    <td className="py-2 pr-3">{c.service?.name}</td>
                    <td className="py-2 pr-3">
                      <span className="px-2 py-0.5 rounded-full bg-teal-tint text-teal text-xs">{c.status}</span>
                    </td>
                    <td className="py-2 pr-3">
                      {c.beneficiary?.fullName || (
                        assignFor === c.id ? (
                          <div className="flex gap-1">
                            <input
                              placeholder="Beneficiary ID"
                              value={assignBeneficiaryId}
                              onChange={(e) => setAssignBeneficiaryId(e.target.value)}
                              className="border border-navy/20 rounded px-2 py-1 text-xs w-28"
                            />
                            <button onClick={() => handleAssign(c.id)} className="text-teal text-xs underline">Save</button>
                          </div>
                        ) : c.status === 'ISSUED' ? (
                          <button onClick={() => setAssignFor(c.id)} className="text-clay text-xs underline">
                            Assign
                          </button>
                        ) : (
                          '—'
                        )
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs">
                      {new Date(c.expiresAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2 pr-3 text-xs text-ink/50">
                      {c.status === 'REDEEMED' ? `at ${c.redeemedAtClinic?.name || 'clinic'}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-ink/40">
          To assign a coupon, paste a beneficiary&apos;s ID (shown in the Beneficiaries tab).
        </p>
      </div>
    </div>
  );
}
