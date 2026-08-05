'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

const emptyForm = {
  title: '', city: '', locality: '', venueDetails: '',
  startAt: '', endAt: '', capacity: '', isPublished: true,
};

export default function CampsPanel({ token }) {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('idle');
  const [announcing, setAnnouncing] = useState(null);
  const [announceResult, setAnnounceResult] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      const { camps } = await api.adminListAllCamps(token);
      setCamps(camps);
    } catch {
      setCamps([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setStatus('submitting');
    try {
      await api.adminCreateCamp(token, {
        ...form,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      });
      setStatus('idle');
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setStatus('error');
      alert(err.message);
    }
  }

  async function handleAnnounce(campId) {
    setAnnouncing(campId);
    setAnnounceResult(null);
    try {
      const result = await api.adminAnnounceCamp(token, campId);
      setAnnounceResult({ campId, ...result });
    } catch (err) {
      alert(err.message);
    } finally {
      setAnnouncing(null);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h2 className="font-display text-lg text-navy mb-3">Create Camp</h2>
        <form onSubmit={handleCreate} className="grid gap-3 bg-white border border-navy/10 rounded-soft p-4">
          <input required placeholder="Camp title" value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          <input required placeholder="City" value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          <input placeholder="Locality" value={form.locality}
            onChange={(e) => setForm((p) => ({ ...p, locality: e.target.value }))}
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          <input placeholder="Venue details" value={form.venueDetails}
            onChange={(e) => setForm((p) => ({ ...p, venueDetails: e.target.value }))}
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-navy mb-1">Starts</label>
              <input type="datetime-local" required value={form.startAt}
                onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))}
                className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-navy mb-1">Ends</label>
              <input type="datetime-local" required value={form.endAt}
                onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))}
                className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
            </div>
          </div>
          <input type="number" placeholder="Capacity (optional)" value={form.capacity}
            onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.isPublished}
              onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} />
            Publish immediately (visible on public site)
          </label>
          <button type="submit" disabled={status === 'submitting'}
            className="px-4 py-2 rounded-full bg-clay text-white text-sm hover:bg-clay-dark transition-colors disabled:opacity-60">
            {status === 'submitting' ? 'Creating…' : 'Create Camp'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2">
        <h2 className="font-display text-lg text-navy mb-3">All Camps</h2>
        {loading ? (
          <p className="text-sm text-ink/60">Loading…</p>
        ) : camps.length === 0 ? (
          <p className="text-sm text-ink/60">No camps yet.</p>
        ) : (
          <div className="grid gap-3">
            {camps.map((camp) => (
              <div key={camp.id} className="bg-white border border-navy/10 rounded-soft p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-navy">{camp.title}</p>
                    <p className="text-xs text-ink/60">
                      {camp.city} · {new Date(camp.startAt).toLocaleDateString('en-IN')}
                      {' · '}
                      <span className={camp.isPublished ? 'text-teal' : 'text-clay'}>
                        {camp.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleAnnounce(camp.id)}
                    disabled={announcing === camp.id}
                    className="px-4 py-2 rounded-full border border-teal text-teal text-xs hover:bg-teal hover:text-white transition-colors disabled:opacity-60"
                  >
                    {announcing === camp.id ? 'Sending…' : 'Announce to Nearby Beneficiaries'}
                  </button>
                </div>
                {announceResult?.campId === camp.id && (
                  <p className="mt-2 text-xs text-teal">
                    Notified {announceResult.notificationsSent} of {announceResult.targetedBeneficiaries} beneficiaries in {camp.city}.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-ink/40">
          &ldquo;Announce&rdquo; sends a WhatsApp/SMS message to every registered
          beneficiary whose city matches this camp&apos;s city.
        </p>
      </div>
    </div>
  );
}
