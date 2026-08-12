'use client';

import { useEffect, useState } from 'react';
import DonateForm from './DonateForm';
import DonateButton from '../../components/DonateButton';
import { api } from '../../lib/api';

// Client-side data fetching (converted from a Server Component) so this
// works on static-export/PHP-only hosting.
export default function DonateContent() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.getOrgSettings()
      .then(({ settings }) => setSettings(settings))
      .catch(() => setSettings(null));
  }, []);

  return (
    <div>
      <section className="bg-clay text-white py-16">
        <div className="container-page">
          <p className="text-white/80 text-sm uppercase tracking-widest">Donate</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2 max-w-2xl">
            ₹500 funds a full health screening.
          </h1>
          <p className="mt-3 text-white/90 max-w-xl">
            ₹25,000 sponsors an entire health camp for 80 senior citizens.
            All donations are 80G tax-exempt.
          </p>
          <div className="mt-6">
            <p className="text-xs text-white/70 mb-2">Quick donate:</p>
            <DonateButton id="donate-page" />
          </div>
        </div>
      </section>
      <section className="container-page py-14 grid gap-10 md:grid-cols-2">
        <div>
          <p className="text-sm text-ink/60 mb-4">
            Prefer to choose an amount and purpose, or need a PAN-linked 80G
            receipt? Use the detailed form below.
          </p>
          <DonateForm />
        </div>
        <div className="space-y-6">
          <div className="rounded-soft border border-navy/15 p-6">
            <h2 className="font-display text-lg text-navy">UPI / Google Pay / PhonePe</h2>
            <p className="mt-2 text-sm text-ink/70">
              {settings?.upiId
                ? `UPI ID: ${settings.upiId}`
                : '[ Add UPI QR code image and UPI ID in Admin > Settings ]'}
            </p>
          </div>
          <div className="rounded-soft border border-navy/15 p-6">
            <h2 className="font-display text-lg text-navy">Bank Transfer / NEFT / RTGS</h2>
            {settings?.bankAccountNumber ? (
              <div className="mt-2 text-sm text-ink/70 space-y-1">
                <p>Account Name: {settings.bankAccountName}</p>
                <p>Account No.: {settings.bankAccountNumber}</p>
                <p>IFSC: {settings.bankIfsc}</p>
                <p>Bank: {settings.bankName}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink/70">
                [ Add bank account details in Admin &gt; Settings ]. WhatsApp your transfer receipt for quicker acknowledgement.
              </p>
            )}
          </div>
          <div className="rounded-soft border border-navy/15 p-6">
            <h2 className="font-display text-lg text-navy">Cheque / DD</h2>
            <p className="mt-2 text-sm text-ink/70">
              Make payable to: <strong>{settings?.organizationName || 'Sunshine Social Foundation'}</strong>.{' '}
              {settings?.registeredAddress || '[ Add courier address in Admin > Settings ]'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
