'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

const fields = [
  { key: 'organizationName', label: 'Organization Name' },
  { key: 'registrationNumber', label: 'Registration Number' },
  { key: 'ngoDarpanId', label: 'NGO Darpan ID' },
  { key: 'panNumber', label: 'PAN Number' },
  { key: 'tanNumber', label: 'TAN Number' },
  { key: 'eightyGNumber', label: '80G Number' },
  { key: 'phone', label: 'Phone' },
  { key: 'whatsappNumber', label: 'WhatsApp Number' },
  { key: 'email', label: 'Email' },
  { key: 'officeHours', label: 'Office Hours' },
  { key: 'bankAccountName', label: 'Bank Account Name' },
  { key: 'bankAccountNumber', label: 'Bank Account Number' },
  { key: 'bankIfsc', label: 'Bank IFSC' },
  { key: 'bankName', label: 'Bank Name' },
  { key: 'upiId', label: 'UPI ID' },
  { key: 'facebookUrl', label: 'Facebook URL' },
  { key: 'instagramUrl', label: 'Instagram URL' },
  { key: 'youtubeUrl', label: 'YouTube URL' },
];

const textareaFields = [
  { key: 'registeredAddress', label: 'Registered Address' },
  { key: 'officeAddress', label: 'Office Address' },
];

export default function SettingsPanel({ token }) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');

  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyForm, setNewKeyForm] = useState({ label: '', scopes: 'donations:read' });
  const [newKeyResult, setNewKeyResult] = useState(null);

  useEffect(() => {
    api.getOrgSettings().then(({ settings }) => setForm(settings || {})).finally(() => setLoading(false));
    refreshApiKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshApiKeys() {
    try {
      const { apiKeys } = await api.adminListApiKeys(token);
      setApiKeys(apiKeys);
    } catch {
      setApiKeys([]);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveStatus('submitting');
    try {
      await api.adminUpdateOrgSettings(token, form);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      alert(err.message);
    }
  }

  async function handleCreateKey(e) {
    e.preventDefault();
    try {
      const result = await api.adminCreateApiKey(token, newKeyForm);
      setNewKeyResult(result);
      setNewKeyForm({ label: '', scopes: 'donations:read' });
      refreshApiKeys();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRevoke(id) {
    if (!confirm('Revoke this API key? Any integration using it will stop working immediately.')) return;
    await api.adminRevokeApiKey(token, id);
    refreshApiKeys();
  }

  if (loading) return <p className="text-sm text-ink/60">Loading…</p>;

  return (
    <div className="grid gap-10">
      <div>
        <h2 className="font-display text-lg text-navy mb-1">Organization Settings</h2>
        <p className="text-xs text-ink/50 mb-4">
          This information powers the Footer, About, Contact, and Donate
          pages sitewide — edit it here once instead of in code.
        </p>
        <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2 bg-white border border-navy/10 rounded-soft p-5">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-navy mb-1">{f.label}</label>
              <input
                value={form[f.key] || ''}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                className="w-full rounded border border-navy/20 px-3 py-2 text-sm"
              />
            </div>
          ))}
          {textareaFields.map((f) => (
            <div key={f.key} className="sm:col-span-2">
              <label className="block text-xs text-navy mb-1">{f.label}</label>
              <textarea
                rows={2}
                value={form[f.key] || ''}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                className="w-full rounded border border-navy/20 px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <button type="submit" disabled={saveStatus === 'submitting'}
              className="px-5 py-2.5 rounded-full bg-clay text-white text-sm hover:bg-clay-dark transition-colors disabled:opacity-60">
              {saveStatus === 'submitting' ? 'Saving…' : saveStatus === 'success' ? 'Saved ✓' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="font-display text-lg text-navy mb-1">External Integration API Keys</h2>
        <p className="text-xs text-ink/50 mb-4">
          Issue scoped, revocable keys for external systems (accounting
          software, a CSR partner&apos;s dashboard) to pull read-only data
          via <code>X-API-Key</code>.
        </p>

        <form onSubmit={handleCreateKey} className="flex flex-wrap gap-2 mb-4">
          <input
            required
            placeholder="Label, e.g. Zoho Books sync"
            value={newKeyForm.label}
            onChange={(e) => setNewKeyForm((p) => ({ ...p, label: e.target.value }))}
            className="rounded border border-navy/20 px-3 py-2 text-sm flex-1 min-w-[200px]"
          />
          <select
            value={newKeyForm.scopes}
            onChange={(e) => setNewKeyForm((p) => ({ ...p, scopes: e.target.value }))}
            className="rounded border border-navy/20 px-3 py-2 text-sm"
          >
            <option value="donations:read">donations:read</option>
          </select>
          <button type="submit" className="px-4 py-2 rounded-full bg-navy text-white text-sm hover:bg-navy-light transition-colors">
            Generate Key
          </button>
        </form>

        {newKeyResult && (
          <div className="mb-4 rounded-soft bg-sun/10 border border-sun-soft p-4 text-sm">
            <p className="text-navy font-medium">{newKeyResult.warning}</p>
            <code className="block mt-2 p-2 bg-white rounded border border-navy/10 break-all text-xs">
              {newKeyResult.apiKey}
            </code>
          </div>
        )}

        <div className="grid gap-2">
          {apiKeys.map((k) => (
            <div key={k.id} className="flex items-center justify-between bg-white border border-navy/10 rounded-soft p-3 text-sm">
              <div>
                <p className="text-navy">{k.label} <span className="text-xs text-ink/40">({k.keyPrefix}…)</span></p>
                <p className="text-xs text-ink/50">
                  Scopes: {k.scopes} · {k.isActive ? 'Active' : 'Revoked'}
                  {k.lastUsedAt ? ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString('en-IN')}` : ' · Never used'}
                </p>
              </div>
              {k.isActive && (
                <button onClick={() => handleRevoke(k.id)} className="text-xs text-clay underline">Revoke</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
