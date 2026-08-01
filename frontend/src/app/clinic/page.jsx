'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function ClinicLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const { token, clinicUser, clinic } = await api.clinicLogin(form);
      sessionStorage.setItem('sunshine_clinic_token', token);
      sessionStorage.setItem('sunshine_clinic_name', `${clinicUser.fullName} · ${clinic.name}`);
      router.push('/clinic/dashboard');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="container-page py-20 max-w-md">
      <p className="text-teal text-sm uppercase tracking-widest">Partner Clinic Portal</p>
      <h1 className="font-display text-2xl text-navy mt-1">Clinic Staff Login</h1>
      <p className="mt-1 text-sm text-ink/60">
        Validate and redeem Sunshine subsidy coupons for your patients.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>
        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="password">Password</label>
          <input id="password" type="password" required value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>
        {status === 'error' && <p className="text-clay-dark text-sm" role="alert">{errorMsg}</p>}
        <button type="submit" disabled={status === 'submitting'}
          className="px-6 py-3 rounded-full bg-teal text-white font-body hover:bg-teal-light transition-colors disabled:opacity-60">
          {status === 'submitting' ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="mt-6 text-xs text-ink/40">
        Don&apos;t have a login? Ask your Sunshine Social Foundation coordinator
        to create one from the admin dashboard.
      </p>
    </div>
  );
}
