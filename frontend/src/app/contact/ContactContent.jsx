'use client';

import { useEffect, useState } from 'react';
import ContactForm from './ContactForm';
import { api } from '../../lib/api';

// Client-side data fetching (converted from a Server Component) so this
// works on static-export/PHP-only hosting.
export default function ContactContent() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.getOrgSettings()
      .then(({ settings }) => setSettings(settings))
      .catch(() => setSettings(null));
  }, []);

  return (
    <div>
      <section className="bg-navy text-cream py-16">
        <div className="container-page">
          <p className="text-sun-soft text-sm uppercase tracking-widest">Contact Us</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2 max-w-2xl">
            We&apos;re easy to reach — from your phone.
          </h1>
        </div>
      </section>
      <section className="container-page py-14 grid gap-10 md:grid-cols-2">
        <ContactForm />
        <div className="space-y-6 text-sm text-ink/80">
          <div>
            <h2 className="font-display text-lg text-navy">Office Address</h2>
            <p className="mt-1">{settings?.officeAddress || '[ Add final office address here ]'}</p>
          </div>
          <div>
            <h2 className="font-display text-lg text-navy">Phone / WhatsApp</h2>
            <p className="mt-1">
              {settings?.phone || settings?.whatsappNumber || '[ Add final phone / WhatsApp number here ]'}
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg text-navy">Email</h2>
            <p className="mt-1">
              <a href={`mailto:${settings?.email || 'contact@sunshinesocial.org'}`} className="text-teal underline">
                {settings?.email || 'contact@sunshinesocial.org'}
              </a>
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg text-navy">Office Hours</h2>
            <p className="mt-1">{settings?.officeHours || '[ Add office/centre hours here ]'}</p>
          </div>
          <div className="rounded-soft bg-teal-tint border border-teal/15 aspect-video flex items-center justify-center text-teal/60">
            [ Map embed placeholder ]
          </div>
        </div>
      </section>
    </div>
  );
}
