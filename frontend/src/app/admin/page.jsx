'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const { token, admin } = await api.adminLogin(form);
      // NOTE: for Phase 1 simplicity we store the token in sessionStorage.
      // Phase 2+ should move to an httpOnly cookie set by the backend.
      sessionStorage.setItem('sunshine_admin_token', token);
      sessionStorage.setItem('sunshine_admin_name', admin.fullName);
      router.push('/admin/dashboard');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="container-page py-20 max-w-md">
      <h1 className="font-display text-2xl text-navy">Admin Login</h1>
      <p className="mt-1 text-sm text-ink/60">Staff access only.</p>
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
          className="px-6 py-3 rounded-full bg-navy text-white font-body hover:bg-navy-light transition-colors disabled:opacity-60">
          {status === 'submitting' ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
