'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

const emptyForm = { name: '', description: '' };

export default function ServicesPanel({ token }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('idle');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  async function refresh() {
    setLoading(true);
    try {
      const { services } = await api.adminListServices(token);
      setServices(services);
    } catch {
      setServices([]);
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
      await api.adminCreateService(token, form);
      setStatus('idle');
      setForm(emptyForm);
      refresh();
    } catch (err) {
      setStatus('error');
      alert(err.message);
    }
  }

  function startEdit(service) {
    setEditingId(service.id);
    setEditForm({ name: service.name, description: service.description });
  }

  async function saveEdit(id) {
    try {
      await api.adminUpdateService(token, id, editForm);
      setEditingId(null);
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleActive(service) {
    try {
      await api.adminUpdateService(token, service.id, { isActive: !service.is_active });
      refresh();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h2 className="font-display text-lg text-navy mb-3">Add Service</h2>
        <form onSubmit={handleCreate} className="grid gap-3 bg-white border border-navy/10 rounded-soft p-4">
          <div>
            <label className="block text-xs text-navy mb-1">Service Name</label>
            <input required value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-navy mb-1">Description</label>
            <textarea required rows={4} value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={status === 'submitting'}
            className="px-4 py-2 rounded-full bg-clay text-white text-sm hover:bg-clay-dark transition-colors disabled:opacity-60">
            {status === 'submitting' ? 'Adding…' : 'Add Service'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2">
        <h2 className="font-display text-lg text-navy mb-3">All Services</h2>
        <p className="text-xs text-ink/50 mb-4">
          Inactive services stay in the system (appointments/coupons may
          reference them) but no longer show on the public Services page.
        </p>
        {loading ? (
          <p className="text-sm text-ink/60">Loading…</p>
        ) : services.length === 0 ? (
          <p className="text-sm text-ink/60">No services yet.</p>
        ) : (
          <div className="grid gap-3">
            {services.map((service) => (
              <div key={service.id} className="bg-white border border-navy/10 rounded-soft p-4">
                {editingId === service.id ? (
                  <div className="grid gap-2">
                    <input value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full rounded border border-navy/20 px-3 py-2 text-sm font-display" />
                    <textarea rows={3} value={editForm.description}
                      onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                      className="w-full rounded border border-navy/20 px-3 py-2 text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(service.id)}
                        className="px-4 py-1.5 rounded-full bg-teal text-white text-xs hover:bg-teal-light transition-colors">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-ink/60 underline">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-display text-navy">
                        {service.name}
                        {!service.is_active && (
                          <span className="ml-2 text-xs text-clay align-middle">(Inactive)</span>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-ink/70">{service.description}</p>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0 text-xs">
                      <button onClick={() => startEdit(service)} className="text-teal underline">Edit</button>
                      <button onClick={() => toggleActive(service)} className="text-clay underline">
                        {service.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
