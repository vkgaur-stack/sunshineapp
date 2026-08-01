'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SunriseArc from './SunriseArc';
import { api } from '../lib/api';

// Converted from an async Server Component to client-side fetching for
// static export (no Node.js server available to run this at request
// time). Settings load in the browser after the page paints — a brief
// fallback-text flash on first load is the tradeoff for working on
// static/PHP-only hosting.
export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.getOrgSettings()
      .then(({ settings }) => setSettings(settings))
      .catch(() => setSettings(null));
  }, []);

  return (
    <footer className="relative bg-navy text-cream mt-24">
      <SunriseArc className="absolute -top-16 left-0 w-full h-16 text-navy" />

      <div className="container-page py-14 grid gap-10 md:grid-cols-4">
        <div>
          <p className="font-display text-xl">
            {settings?.organizationName || 'Sunshine Social Foundation'}
          </p>
          <p className="mt-3 text-sm text-cream/80 leading-relaxed">
            Delivering up to 75% subsidised pain relief and physiotherapy to
            India&apos;s hardworking middle class — with dignity.
          </p>
          <p className="mt-4 text-xs text-cream/60">
            Govt. Registered NGO
            {settings?.eightyGNumber ? ` · 80G: ${settings.eightyGNumber}` : ' · 80G Tax Exemption'}
          </p>
        </div>

        <div>
          <p className="font-body text-sm uppercase tracking-wide text-sun-soft">
            Quick Links
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/about" className="hover:underline">About Us</Link></li>
            <li><Link href="/services" className="hover:underline">Our Services</Link></li>
            <li><Link href="/impact" className="hover:underline">Our Impact</Link></li>
            <li><Link href="/register" className="hover:underline">Register as Beneficiary</Link></li>
            <li><Link href="/appointments" className="hover:underline">Book an Appointment</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-body text-sm uppercase tracking-wide text-sun-soft">
            Get Involved
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/get-involved" className="hover:underline">Partner With Us</Link></li>
            <li><Link href="/donate" className="hover:underline">Donate</Link></li>
            <li><Link href="/social" className="hover:underline">Social Media</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-body text-sm uppercase tracking-wide text-sun-soft">
            Reach Us
          </p>
          <ul className="mt-4 space-y-2 text-sm text-cream/90">
            <li>{settings?.phone || '[ Phone number — add in Admin > Settings ]'}</li>
            <li>
              <a href={`mailto:${settings?.email || 'contact@sunshinesocial.org'}`} className="hover:underline">
                {settings?.email || 'contact@sunshinesocial.org'}
              </a>
            </li>
            <li>{settings?.officeAddress || '[ Office address — add in Admin > Settings ]'}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-5 text-xs text-cream/60 flex flex-col md:flex-row justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} {settings?.organizationName || 'Sunshine Social Foundation'}. All rights reserved.</p>
          <p>
            {settings?.registrationNumber ? `Reg. No. ${settings.registrationNumber} · ` : ''}
            Verifiable on NGO Darpan (ngodarpan.gov.in)
            {settings?.ngoDarpanId ? ` · ID: ${settings.ngoDarpanId}` : ''}
          </p>
        </div>
      </div>
    </footer>
  );
}
