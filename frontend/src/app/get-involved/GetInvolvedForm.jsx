'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

const categories = [
  { value: 'CSR_PARTNER', label: 'CSR Partner' },
  { value: 'MEDICAL_PARTNER', label: 'Medical Partner' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
  { value: 'DONOR', label: 'Donor' },
  { value: 'COMMUNITY_PARTNER', label: 'Community Partner' },
];

const initialForm = {
  category: 'VOLUNTEER',
  orgOrName: '',
  contactName: '',
  mobileNumber: '',
  email: '',
  message: '',
};

export default function GetInvolvedForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      await api.submitPartnerRequest(form);
      setStatus('success');
      setForm(initialForm);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-soft bg-teal-tint border border-teal/20 p-6 text-teal">
        <p className="font-display text-lg">Thank you for reaching out.</p>
        <p className="mt-1 text-sm">
          Our team will contact you within 2–3 working days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-w-xl">
      <div>
        <label className="block text-sm text-navy mb-1" htmlFor="category">
          I want to
        </label>
        <select
          id="category"
          value={form.category}
          onChange={(e) => update('category', e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-4 py-2.5"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-navy mb-1" htmlFor="orgOrName">
          Organisation Name (or write &ldquo;Individual&rdquo;)
        </label>
        <input
          id="orgOrName"
          required
          value={form.orgOrName}
          onChange={(e) => update('orgOrName', e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-4 py-2.5"
        />
      </div>

      <div>
        <label className="block text-sm text-navy mb-1" htmlFor="contactName">
          Your Name
        </label>
        <input
          id="contactName"
          required
          value={form.contactName}
          onChange={(e) => update('contactName', e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-4 py-2.5"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="mobileNumber">
            Mobile Number
          </label>
          <input
            id="mobileNumber"
            required
            inputMode="numeric"
            value={form.mobileNumber}
            onChange={(e) => update('mobileNumber', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5"
          />
        </div>
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="email">
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-navy mb-1" htmlFor="message">
          How would you like to contribute?
        </label>
        <textarea
          id="message"
          rows={4}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-4 py-2.5"
        />
      </div>

      {status === 'error' && (
        <p className="text-clay-dark text-sm" role="alert">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="justify-self-start px-6 py-3 rounded-full bg-clay text-white font-body hover:bg-clay-dark transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit Request'}
      </button>
    </form>
  );
}
