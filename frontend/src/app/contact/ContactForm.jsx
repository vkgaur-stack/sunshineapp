'use client';

import { useState } from 'react';
import { api } from '../../lib/api';

const initialForm = { fullName: '', mobileNumber: '', email: '', subject: '', message: '' };

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      await api.submitContactMessage(form);
      setStatus('success');
      setForm(initialForm);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-soft bg-teal-tint border border-teal/20 p-6">
        <p className="font-display text-lg text-teal">Message sent.</p>
        <p className="mt-1 text-sm text-ink/80">We&apos;ll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="fullName">Full Name</label>
          <input id="fullName" required value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="mobileNumber">Mobile Number</label>
          <input id="mobileNumber" required inputMode="numeric" value={form.mobileNumber}
            onChange={(e) => update('mobileNumber', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>
      </div>
      <div>
        <label className="block text-sm text-navy mb-1" htmlFor="email">Email (optional)</label>
        <input id="email" type="email" value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
      </div>
      <div>
        <label className="block text-sm text-navy mb-1" htmlFor="subject">Subject (optional)</label>
        <input id="subject" value={form.subject}
          onChange={(e) => update('subject', e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
      </div>
      <div>
        <label className="block text-sm text-navy mb-1" htmlFor="message">Message</label>
        <textarea id="message" rows={4} required value={form.message}
          onChange={(e) => update('message', e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
      </div>
      {status === 'error' && <p className="text-clay-dark text-sm" role="alert">{errorMsg}</p>}
      <button type="submit" disabled={status === 'submitting'}
        className="justify-self-start px-6 py-3 rounded-full bg-clay text-white font-body hover:bg-clay-dark transition-colors disabled:opacity-60">
        {status === 'submitting' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
