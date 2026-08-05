'use client';

import { useState } from 'react';
import Script from 'next/script';
import { api } from '../../lib/api';

const presetAmounts = [500, 1000, 2500, 25000];
const purposes = [
  'General Fund — Where Most Needed',
  'Sponsor a Health Camp',
  'Fund Therapy Equipment',
  'Support Volunteer Transport',
  'Medicine & Health Kits',
];

export default function DonateForm() {
  const [amount, setAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    panNumber: '',
    purpose: purposes[0],
  });
  const [status, setStatus] = useState('idle'); // idle | processing | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const finalAmount = customAmount ? Number(customAmount) : amount;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleDonate(e) {
    e.preventDefault();
    setStatus('processing');
    setErrorMsg('');

    try {
      const order = await api.createDonationOrder({
        ...form,
        amountInRupees: finalAmount,
      });

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Sunshine Social Foundation',
        description: form.purpose,
        prefill: {
          name: form.fullName,
          contact: form.mobileNumber,
          email: form.email,
        },
        theme: { color: '#E0672F' },
        handler: async function (response) {
          try {
            await api.verifyDonation(response);
            setStatus('success');
          } catch (err) {
            setStatus('error');
            setErrorMsg(err.message);
          }
        },
        modal: {
          ondismiss: function () {
            setStatus('idle');
          },
        },
      };

      // Razorpay Checkout script is loaded via next/script below.
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-soft bg-teal-tint border border-teal/20 p-6 max-w-xl">
        <p className="font-display text-lg text-teal">Thank you for your generosity.</p>
        <p className="mt-2 text-sm text-ink/80">
          Your 80G tax receipt will be emailed within 7 working days.
        </p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <form onSubmit={handleDonate} className="grid gap-4 max-w-xl">
        <div>
          <p className="block text-sm text-navy mb-2">Select Amount (₹)</p>
          <div className="flex flex-wrap gap-2">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => { setAmount(amt); setCustomAmount(''); }}
                className={`px-4 py-2 rounded-full border text-sm ${
                  !customAmount && amount === amt
                    ? 'bg-clay text-white border-clay'
                    : 'border-navy/20 text-navy'
                }`}
              >
                ₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            placeholder="Or enter custom amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="mt-3 w-full rounded-lg border border-navy/20 px-4 py-2.5"
          />
        </div>

        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="fullName">Your Name</label>
          <input id="fullName" required value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-navy mb-1" htmlFor="mobileNumber">Mobile Number</label>
            <input id="mobileNumber" required inputMode="numeric" value={form.mobileNumber}
              onChange={(e) => update('mobileNumber', e.target.value)}
              className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
          </div>
          <div>
            <label className="block text-sm text-navy mb-1" htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="panNumber">
            PAN Number (for 80G receipt, optional)
          </label>
          <input id="panNumber" value={form.panNumber}
            onChange={(e) => update('panNumber', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5" />
        </div>

        <div>
          <label className="block text-sm text-navy mb-1" htmlFor="purpose">Donation Purpose</label>
          <select id="purpose" value={form.purpose}
            onChange={(e) => update('purpose', e.target.value)}
            className="w-full rounded-lg border border-navy/20 px-4 py-2.5">
            {purposes.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {status === 'error' && <p className="text-clay-dark text-sm" role="alert">{errorMsg}</p>}

        <button type="submit" disabled={status === 'processing'}
          className="justify-self-start px-6 py-3 rounded-full bg-clay text-white font-body hover:bg-clay-dark transition-colors disabled:opacity-60">
          {status === 'processing' ? 'Opening secure checkout…' : `Donate ₹${finalAmount || 0} Now`}
        </button>
        <p className="text-xs text-ink/50">
          🔒 Secured by Razorpay. PCI-DSS compliant. All amounts eligible for 80G tax deduction.
        </p>
      </form>
    </>
  );
}
