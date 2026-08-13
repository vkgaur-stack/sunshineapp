'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import ImpactTrends from '../../components/ImpactTrends';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Impact numbers are entered manually by an admin each month (see
// /admin > Impact) rather than live-computed, so what's shown here is
// always a deliberate, reviewed snapshot. Visitors can browse past months
// via the selector below — the cards on the left update to that month,
// and the trend charts on the right (which always show full history)
// scroll to and highlight the same month.
export default function ImpactContent() {
  const [months, setMonths] = useState([]); // [{month, year}, ...] newest first
  const [selected, setSelected] = useState(null); // {month, year}
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | empty
  const [history, setHistory] = useState([]);
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    api.getImpactMonths()
      .then(({ months }) => {
        setMonths(months || []);
        if (months && months.length > 0) {
          setSelected({ month: months[0].month, year: months[0].year });
        } else {
          setStatus('empty');
        }
      })
      .catch(() => setStatus('empty'));

    api.getImpactHistory()
      .then(({ history }) => setHistory(history || []))
      .catch(() => setHistory([]));

    api.getImpactTotals()
      .then(({ totals }) => setTotals(totals))
      .catch(() => setTotals(null));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setStatus('loading');
    api.getImpactStats(selected.month, selected.year)
      .then(({ found, metrics }) => {
        if (found) {
          setData(metrics);
          setStatus('ready');
        } else {
          setData(null);
          setStatus('empty');
        }
      })
      .catch(() => {
        setData(null);
        setStatus('empty');
      });
  }, [selected]);

  const metrics = data
    ? [
        { label: 'Beneficiaries Served', value: `${data.beneficiariesServed}+` },
        { label: 'Sessions Completed', value: String(data.sessionsCompleted) },
        { label: 'Health Camps Held', value: String(data.campsHeld) },
        { label: 'Subsidy Delivered', value: `₹${data.subsidyDeliveredInRupees.toLocaleString('en-IN')}` },
        { label: 'Cities Reached', value: String(data.citiesServed) },
        { label: 'Coupons Redeemed', value: String(data.couponsRedeemed) },
      ]
    : [];

  const years = [...new Set(months.map((m) => m.year))].sort((a, b) => b - a);
  const monthsForSelectedYear = selected
    ? months.filter((m) => m.year === selected.year).map((m) => m.month).sort((a, b) => b - a)
    : [];

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
        {months.length > 0 && selected && (
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <label className="text-sm text-navy" htmlFor="impact-month">Showing:</label>
            <select
              id="impact-month"
              value={selected.month}
              onChange={(e) => setSelected((prev) => ({ ...prev, month: Number(e.target.value) }))}
              className="rounded-lg border border-navy/20 px-3 py-2 text-sm"
            >
              {monthsForSelectedYear.map((m) => (
                <option key={m} value={m}>{monthNames[m - 1]}</option>
              ))}
            </select>
            <select
              value={selected.year}
              onChange={(e) => {
                const year = Number(e.target.value);
                const firstMonthForYear = months.find((m) => m.year === year)?.month;
                setSelected({ year, month: firstMonthForYear });
              }}
              className="rounded-lg border border-navy/20 px-3 py-2 text-sm"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* LEFT: selected month's cards */}
          <div>
            {status === 'ready' && data && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-soft border border-sun-soft p-6 text-center bg-white">
                      <p className="font-display text-3xl text-clay">{metric.value}</p>
                      <p className="mt-2 text-sm text-ink/70">{metric.label}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-xs text-ink/40">
                  {monthNames[data.month - 1]} {data.year} · Last updated:{' '}
                  {new Date(data.updatedAt).toLocaleString('en-IN')}
                </p>
              </>
            )}

            {status === 'loading' && (
              <p className="text-sm text-ink/60">Loading impact data…</p>
            )}

            {status === 'empty' && (
              <p className="text-sm text-ink/60">
                Impact data for this period will be updated soon — check back shortly.
              </p>
            )}
          </div>

          {/* RIGHT: all-time trend, one mini chart per metric */}
          <div>
            <p className="font-display text-lg text-navy mb-3">All-Time Trend</p>
            <ImpactTrends history={history} selected={selected} totals={totals} />
          </div>
        </div>
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
