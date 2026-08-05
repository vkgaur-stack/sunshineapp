'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

export default function ClinicDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [clinicLabel, setClinicLabel] = useState('');
  const [code, setCode] = useState('');
  const [checkStatus, setCheckStatus] = useState('idle'); // idle | checking | valid | invalid
  const [checkError, setCheckError] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [redeemStatus, setRedeemStatus] = useState('idle');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const t = sessionStorage.getItem('sunshine_clinic_token');
    if (!t) {
      router.push('/clinic');
      return;
    }
    setToken(t);
    setClinicLabel(sessionStorage.getItem('sunshine_clinic_name') || '');
  }, [router]);

  useEffect(() => {
    if (!token) return;
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const { coupons } = await api.clinicRedemptionHistory(token);
      setHistory(coupons);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleValidate(e) {
    e.preventDefault();
    setCheckStatus('checking');
    setCheckError('');
    setCoupon(null);
    try {
      const { coupon } = await api.clinicValidateCoupon(token, code.trim());
      setCoupon(coupon);
      setCheckStatus('valid');
    } catch (err) {
      setCheckStatus('invalid');
      setCheckError(err.message);
    }
  }

  async function handleRedeem() {
    if (!coupon) return;
    setRedeemStatus('submitting');
    try {
      await api.clinicRedeemCoupon(token, coupon.id);
      setRedeemStatus('success');
      setCode('');
      setCoupon(null);
      setCheckStatus('idle');
      loadHistory();
    } catch (err) {
      setRedeemStatus('error');
      alert(err.message);
    }
  }

  function logout() {
    sessionStorage.removeItem('sunshine_clinic_token');
    router.push('/clinic');
  }

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-teal text-sm uppercase tracking-widest">Partner Clinic Portal</p>
          <h1 className="font-display text-2xl text-navy">{clinicLabel}</h1>
        </div>
        <button onClick={logout} className="text-sm text-clay underline">Log out</button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-lg text-navy mb-3">Validate a Coupon</h2>
          <form onSubmit={handleValidate} className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter coupon code, e.g. SSF-2026-A1B2C3"
              className="flex-1 rounded-lg border border-navy/20 px-4 py-2.5 font-mono text-sm uppercase"
              required
            />
            <button type="submit" disabled={checkStatus === 'checking'}
              className="px-5 py-2.5 rounded-full bg-navy text-white text-sm hover:bg-navy-light transition-colors disabled:opacity-60">
              {checkStatus === 'checking' ? 'Checking…' : 'Check'}
            </button>
          </form>

          {checkStatus === 'invalid' && (
            <div className="mt-4 rounded-soft bg-clay/10 border border-clay/30 p-4 text-sm text-clay-dark">
              {checkError}
            </div>
          )}

          {checkStatus === 'valid' && coupon && (
            <div className="mt-4 rounded-soft bg-teal-tint border border-teal/20 p-5">
              <p className="font-display text-teal text-lg">Valid Coupon</p>
              <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-ink/60">Code</dt>
                <dd className="font-mono">{coupon.code}</dd>
                <dt className="text-ink/60">Service</dt>
                <dd>{coupon.service?.name}</dd>
                <dt className="text-ink/60">Subsidy</dt>
                <dd>{coupon.subsidyPercent}%</dd>
                <dt className="text-ink/60">Beneficiary</dt>
                <dd>{coupon.beneficiary?.fullName || 'Not yet assigned — verify patient ID manually'}</dd>
                <dt className="text-ink/60">Expires</dt>
                <dd>{new Date(coupon.expiresAt).toLocaleDateString('en-IN')}</dd>
              </dl>
              <button
                onClick={handleRedeem}
                disabled={redeemStatus === 'submitting'}
                className="mt-4 px-5 py-2.5 rounded-full bg-clay text-white text-sm hover:bg-clay-dark transition-colors disabled:opacity-60"
              >
                {redeemStatus === 'submitting' ? 'Redeeming…' : 'Confirm Service Delivered & Redeem'}
              </button>
              <p className="mt-2 text-xs text-ink/50">
                Redeeming marks this coupon as used and logs it against your
                clinic for the 75% subsidy reimbursement.
              </p>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg text-navy mb-3">Your Redemption History</h2>
          {historyLoading ? (
            <p className="text-sm text-ink/60">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-ink/60">No coupons redeemed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left border-b border-navy/10 text-navy/70">
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Service</th>
                    <th className="py-2 pr-3">Beneficiary</th>
                    <th className="py-2 pr-3">Redeemed</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((c) => (
                    <tr key={c.id} className="border-b border-navy/5">
                      <td className="py-2 pr-3 font-mono text-xs">{c.code}</td>
                      <td className="py-2 pr-3">{c.service?.name}</td>
                      <td className="py-2 pr-3">{c.beneficiary?.fullName || '—'}</td>
                      <td className="py-2 pr-3 text-xs">
                        {c.redeemedAt ? new Date(c.redeemedAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
