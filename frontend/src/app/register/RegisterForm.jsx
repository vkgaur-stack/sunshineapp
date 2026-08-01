'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

const initialForm = {
  fullName: '',
  dateOfBirth: '',
  gender: 'Female',
  mobileNumber: '',
  email: '',
  addressLine: '',
  city: '',
  state: '',
  serviceInterest: '',
  problemNotes: '',
  preferredContact: 'WHATSAPP',
  consentGiven: false,
};

export default function RegisterForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [beneficiaryId, setBeneficiaryId] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const { beneficiary } = await api.registerBeneficiary(form);
      setBeneficiaryId(beneficiary.id);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-soft bg-teal-tint border border-teal/20 p-6 max-w-xl">
        <p className="font-display text-lg text-teal">Registration successful.</p>
        <p className="mt-2 text-sm text-ink/80">
          Please save your registered mobile number and date of birth — you
          will use these to book an appointment.
        </p>
        <p className="mt-2 text-xs text-ink/50">Reference ID: {beneficiaryId}</p>
        <Link
          href="/appointments"
          className="mt-4 inline-block px-6 py-3 rounded-full bg-clay text-white font-body hover:bg-clay-dark transition-colors"
        >
          Book an Appointment Now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-w-xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="fullName">Full Name</label>
          <input id="fullName" required value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="dateOfBirth">Date of Birth</label>
          <input id="dateOfBirth" type="date" required value={form.dateOfBirth}
            onChange={(e) => update('dateOfBirth', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="gender">Gender</label>
          <select id="gender" value={form.gender}
            onChange={(e) => update('gender', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5">
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
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
        <label className="block text-sm text-navy mb-1" htmlFor="addressLine">Address (optional)</label>
        <input id="addressLine" value={form.addressLine}
          onChange={(e) => update('addressLine', e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="city">City</label>
          <input id="city" required value={form.city}
            onChange={(e) => update('city', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="state">State</label>
          <input id="state" required value={form.state}
            onChange={(e) => update('state', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>
      </div>

      <div>
        <label className="block text-sm text-navy mb-1" htmlFor="serviceInterest">
          Service Interested In
        </label>
        <input id="serviceInterest" placeholder="e.g. Physiotherapy" value={form.serviceInterest}
          onChange={(e) => update('serviceInterest', e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
      </div>

      <div>
        <label className="block text-sm text-navy mb-1" htmlFor="problemNotes">
          Briefly describe the pain/problem (optional)
        </label>
        <textarea id="problemNotes" rows={3} value={form.problemNotes}
          onChange={(e) => update('problemNotes', e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
      </div>

      <div>
        <label className="block text-sm text-navy mb-1" htmlFor="preferredContact">
          Preferred Contact Method
        </label>
        <select id="preferredContact" value={form.preferredContact}
          onChange={(e) => update('preferredContact', e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-4 py-2.5">
          <option value="WHATSAPP">WhatsApp</option>
          <option value="PHONE">Phone Call</option>
          <option value="EMAIL">Email</option>
        </select>
      </div>

      <label className="flex items-start gap-3 text-sm text-ink/80">
        <input type="checkbox" required checked={form.consentGiven}
          onChange={(e) => update('consentGiven', e.target.checked)}
          className="mt-1" />
        I consent to Sunshine Social Foundation contacting me and storing my
        details to provide the requested services.
      </label>

      {status === 'error' && (
        <p className="text-clay-dark text-sm" role="alert">{errorMsg}</p>
      )}

      <button type="submit" disabled={status === 'submitting'}
        className="justify-self-start px-6 py-3 rounded-full bg-clay text-white font-body hover:bg-clay-dark transition-colors disabled:opacity-60">
        {status === 'submitting' ? 'Registering…' : 'Register'}
      </button>
    </form>
  );
}
