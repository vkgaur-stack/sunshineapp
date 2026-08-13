'use client';

import { useEffect, useRef } from 'react';

// Deliberately no charting library — this project avoids extra
// dependencies where a plain component will do (see README/DEPLOYMENT
// notes on hosting-compatible, no-dependency choices). Each metric gets
// its own small horizontally-scrollable bar chart rather than one
// combined chart, since the six metrics live on very different scales
// (subsidy in rupees vs. cities reached) and would drown each other out
// on a shared axis.
const metricsConfig = [
  { key: 'beneficiariesServed', label: 'Beneficiaries Served', format: (v) => `${v}` },
  { key: 'sessionsCompleted', label: 'Sessions Completed', format: (v) => `${v}` },
  { key: 'campsHeld', label: 'Health Camps Held', format: (v) => `${v}` },
  { key: 'subsidyDeliveredInRupees', label: 'Subsidy Delivered', format: (v) => `₹${v.toLocaleString('en-IN')}` },
  { key: 'citiesServed', label: 'Cities Reached', format: (v) => `${v}` },
  { key: 'couponsRedeemed', label: 'Coupons Redeemed', format: (v) => `${v}` },
];

const monthAbbr = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function MetricTrend({ metric, history, selected, totals }) {
  const barRefs = useRef({});

  // Selecting a different month/year on the left (cards) side scrolls
  // and highlights that same month here, rather than replacing the
  // chart — the trend itself always shows the full history.
  useEffect(() => {
    if (!selected) return;
    const key = `${selected.year}-${selected.month}`;
    const el = barRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selected]);

  const max = Math.max(1, ...history.map((h) => h[metric.key]));

  return (
    <div className="bg-white rounded-soft border border-sun-soft p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-display text-navy">{metric.label}</p>
        {totals && (
          <p className="text-xs text-ink/50 flex-shrink-0">
            All-time: <span className="text-clay font-medium">{metric.format(totals[metric.key])}</span>
          </p>
        )}
      </div>
      <div className="mt-3 flex items-end gap-2 overflow-x-auto pb-1">
        {history.map((h) => {
          const key = `${h.year}-${h.month}`;
          const isSelected = selected && selected.month === h.month && selected.year === h.year;
          const heightPct = Math.max(8, (h[metric.key] / max) * 100);
          return (
            <div key={key} ref={(el) => { barRefs.current[key] = el; }} className="flex flex-col items-center flex-shrink-0 w-7">
              <div className="h-16 w-full flex items-end" title={`${monthAbbr[h.month - 1]} ${h.year}: ${metric.format(h[metric.key])}`}>
                <div
                  className={`w-full rounded-t transition-colors ${isSelected ? 'bg-clay' : 'bg-teal/30'}`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <p className={`mt-1 text-[10px] leading-tight ${isSelected ? 'text-clay font-semibold' : 'text-ink/40'}`}>
                {monthAbbr[h.month - 1]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ImpactTrends({ history, selected, totals }) {
  if (!history || history.length === 0) {
    return (
      <div className="bg-white rounded-soft border border-sun-soft p-6 text-center text-sm text-ink/60">
        No history yet — trends will appear here once more than one month is entered in /admin &gt; Impact.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {metricsConfig.map((metric) => (
        <MetricTrend key={metric.key} metric={metric} history={history} selected={selected} totals={totals} />
      ))}
    </div>
  );
}
