'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const placeholderMetrics = [
  { label: 'Beneficiaries Served', value: '—' },
  { label: 'Sessions Completed', value: '—' },
  { label: 'Health Camps Held', value: '—' },
  { label: 'Subsidy Delivered', value: '—' },
  { label: 'Cities Reached', value: '—' },
  { label: 'Coupons Redeemed', value: '—' },
];

// Client-side data fetching (converted from a Server Component) so this
// works on static-export/PHP-only hosting.
export default function ImpactContent() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getImpactStats().then(setStats).catch(() => setStats(null));
  }, []);

  const metrics = stats
    ? [
        { label: 'Beneficiaries Served', value: `${stats.beneficiariesServed}+` },
        { label: 'Sessions Completed', value: String(stats.sessionsCompleted) },
        { label: 'Health Camps Held', value: String(stats.campsHeld) },
        { label: 'Subsidy Delivered', value: `₹${stats.subsidyDeliveredInRupees.toLocaleString('en-IN')}` },
        { label: 'Cities Reached', value: String(stats.citiesServed) },
        { label: 'Coupons Redeemed', value: String(stats.couponsRedeemed) },
      ]
    : placeholderMetrics;

  return (
    <div>
      <section className="bg-navy text-cream py-16">
        <div className="container-page">
          <p className="text-sun-soft text-sm uppercase tracking-widest">Our Impact</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2 max-w-2xl">
            Measured in healthier, happier elderly lives.
          </h1>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="flex items-center gap-2 mb-6">
          <span className="h-2 w-2 rounded-full bg-teal animate-pulse" aria-hidden="true" />
          <p className="text-xs text-teal uppercase tracking-widest">
            Live data — updates automatically as camps and donations happen
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-soft border border-sun-soft p-6 text-center bg-white">
              <p className="font-display text-3xl text-clay">{metric.value}</p>
              <p className="mt-2 text-sm text-ink/70">{metric.label}</p>
            </div>
          ))}
        </div>
        {!stats && (
          <p className="mt-6 text-xs text-ink/50">
            [ Live stats loading — or check that the backend API is running. ]
          </p>
        )}
        {stats && (
          <p className="mt-6 text-xs text-ink/40">
            Last updated: {new Date(stats.lastUpdated).toLocaleString('en-IN')}
          </p>
        )}
      </section>

      <section className="bg-teal-tint py-14">
        <div className="container-page max-w-2xl">
          <h2 className="font-display text-2xl text-navy">Measuring What Matters</h2>
          <p className="mt-3 text-sm text-ink/80 leading-relaxed">
            We track health outcomes (blood pressure and blood sugar control,
            mobility improvement), well-being metrics (loneliness and quality
            of life scores), and engagement (attendance and satisfaction) —
            not attendance numbers alone.
          </p>
        </div>
      </section>
    </div>
  );
}
