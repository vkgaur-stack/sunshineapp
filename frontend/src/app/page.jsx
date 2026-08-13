'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SunriseArc from '../components/SunriseArc';
import HeroMediaCarousel from '../components/HeroMediaCarousel';
import DonateButton from '../components/DonateButton';
import { api } from '../lib/api';

// Registration now happens entirely inside the Beneficiary module.
const BENEFICIARY_URL = 'https://www.sunshinesocial.org/Beneficiary/views/shared/login.php';

const problems = [
  '70% of elderly Indians have never had a professional health screening.',
  'Middle-class seniors fall between BPL subsidies and private healthcare costs.',
  'Chronic pain, isolation, and medication errors often go unaddressed for years.',
];

// Converted from an async Server Component to client-side fetching for
// static export (no Node.js server to run this at request time). Starts
// with sensible fallback values so the hero never looks broken while data
// loads in the browser.
export default function HomePage() {
  const [camps, setCamps] = useState([]);
  const [feed, setFeed] = useState(null);
  const [impactTotals, setImpactTotals] = useState(null);

  useEffect(() => {
    api.listUpcomingCamps()
      .then(({ camps }) => setCamps(camps || []))
      .catch(() => setCamps([]));

    api.getSocialFeed()
      .then(setFeed)
      .catch(() => setFeed({ facebook: [], instagram: [] }));

    api.getImpactTotals()
      .then(({ totals }) => setImpactTotals(totals))
      .catch(() => setImpactTotals(null));
  }, []);

  const impactSnapshot = impactTotals
    ? [
        { label: 'Beneficiaries Served', value: `${impactTotals.beneficiariesServed}+` },
        { label: 'Sessions Completed', value: String(impactTotals.sessionsCompleted) },
        { label: 'Subsidy Delivered', value: `₹${impactTotals.subsidyDeliveredInRupees.toLocaleString('en-IN')}` },
      ]
    : [];

  const mediaPosts = feed
    ? [...feed.facebook.map((p) => ({ ...p, platform: 'Facebook' })), ...feed.instagram.map((p) => ({ ...p, platform: 'Instagram' }))]
        .filter((p) => p.imageUrl)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2)
    : [];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-cream">
        <div className="container-page pt-16 pb-28 md:pt-24 md:pb-36 grid gap-10 md:grid-cols-2 items-center">
          <div>
            <p className="text-sun-soft font-body text-sm uppercase tracking-widest">
              Project Aashirwad &middot; Sunshine Social Foundation
            </p>
            <h1 className="mt-4 font-display text-4xl md:text-5xl leading-tight">
              Affordable, dignified care for India&apos;s hardworking middle class.
            </h1>
            <p className="mt-5 text-cream/85 text-lg leading-relaxed max-w-xl">
              We deliver up to <strong className="text-sun-soft">75% subsidised</strong>{' '}
              pain relief and physiotherapy — making quality care reachable,
              compassionate, and respectful for every senior who deserves to
              live with comfort and confidence.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={BENEFICIARY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-full bg-clay text-white font-body hover:bg-clay-dark transition-colors"
              >
                Register as Beneficiary
              </a>
              <Link
                href="/donate"
                className="px-6 py-3 rounded-full border border-cream/40 text-cream font-body hover:bg-cream/10 transition-colors"
              >
                Support / Donate
              </Link>
            </div>

            <p className="mt-6 text-xs text-cream/60">
              ✅ Govt. Registered NGO &nbsp;&middot;&nbsp; 📋 80G Tax Exemption
            </p>
          </div>

          <HeroMediaCarousel />
        </div>

        <SunriseArc className="absolute -bottom-1 left-0 w-full h-16 text-cream" />
      </section>

      {/* IMPACT SNAPSHOT — all-time totals, kept compact (3 headline metrics,
          not the full 6 from the Impact page) so it doesn't compete with
          the rest of the home page for space. Only renders once an admin
          has entered at least one month via /admin > Impact. */}
      {impactTotals && impactTotals.monthsRecorded > 0 && (
        <section className="container-page py-12">
          <div className="flex items-end justify-between flex-wrap gap-2">
            <div>
              <p className="font-body text-sm uppercase tracking-widest text-teal">Our Impact</p>
              <h2 className="font-display text-2xl text-navy mt-1">Our Impact So Far</h2>
            </div>
            <Link href="/impact" className="text-sm text-teal hover:underline flex-shrink-0">
              See full impact →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {impactSnapshot.map((metric) => (
              <div key={metric.label} className="rounded-soft border border-sun-soft bg-white p-5 text-center">
                <p className="font-display text-2xl md:text-3xl text-clay">{metric.value}</p>
                <p className="mt-1 text-sm text-ink/70">{metric.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* UPCOMING CAMPS */}
      {camps.length > 0 && (
        <section className="container-page py-14">
          <p className="font-body text-sm uppercase tracking-widest text-teal">
            Upcoming
          </p>
          <h2 className="font-display text-2xl md:text-3xl text-navy mt-2">
            Health Camps Near You
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {camps.map((camp) => (
              <div key={camp.id} className="rounded-soft border border-sun-soft bg-white p-5">
                <p className="font-display text-lg text-navy">{camp.title}</p>
                <p className="text-sm text-ink/70 mt-1">
                  {camp.city}{camp.locality ? ` — ${camp.locality}` : ''}
                </p>
                <p className="text-sm text-teal mt-2">
                  {new Date(camp.startAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* THE PROBLEM */}
      <section className="bg-teal-tint py-16">
        <div className="container-page grid gap-10 md:grid-cols-2 items-start">
          <div>
            <p className="font-body text-sm uppercase tracking-widest text-teal">
              The Problem We Solve
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-navy mt-2 leading-snug">
              India&apos;s middle-class elderly are the &ldquo;Missing Middle.&rdquo;
            </h2>
            <p className="mt-4 text-ink/80 leading-relaxed">
              Too well-off for government aid, not wealthy enough for private
              specialist care — India&apos;s 140 million+ senior citizens are
              often left to manage pain and chronic conditions alone.
            </p>
          </div>
          <ul className="space-y-4">
            {problems.map((point) => (
              <li key={point} className="flex gap-3 bg-white rounded-soft p-4 border border-teal/15">
                <span className="text-clay font-display text-xl leading-none">&bull;</span>
                <span className="text-ink/85 text-sm leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SERVICES SNAPSHOT */}
      <section className="container-page py-16">
        <p className="font-body text-sm uppercase tracking-widest text-teal">What We Offer</p>
        <h2 className="font-display text-2xl md:text-3xl text-navy mt-2">
          Care Delivered Where You Live
        </h2>
        <p className="mt-3 text-ink/75 max-w-2xl">
          All services are provided at up to 75% subsidised cost to the
          middle-class population, through community health camps and
          partner physiotherapy clinics.
        </p>
        <div className="mt-8">
          <Link
            href="/services"
            className="inline-block px-6 py-3 rounded-full bg-navy text-white font-body hover:bg-navy-light transition-colors"
          >
            View All Services →
          </Link>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="bg-clay text-white py-14">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">
              Your donation makes a real difference.
            </h2>
            <p className="mt-2 text-white/90">
              ₹500 funds a full health screening. ₹25,000 sponsors an entire
              health camp for 80 senior citizens. All donations are 80G tax-exempt.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            <DonateButton id="home-cta" />
            <Link
              href="/get-involved"
              className="px-6 py-3 rounded-full border border-white/70 text-white font-body hover:bg-white/10 transition-colors"
            >
              Partner With Us
            </Link>
          </div>
        </div>
      </section>

      {/* MEDIA / SOCIAL PLACEHOLDER */}
      <section className="container-page py-16">
        <p className="font-body text-sm uppercase tracking-widest text-teal">
          From the Field
        </p>
        <h2 className="font-display text-2xl md:text-3xl text-navy mt-2">
          Latest Photos &amp; Videos
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {mediaPosts.length > 0 ? (
            mediaPosts.map((post) => (
              <a
                key={post.id}
                href={post.permalink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-soft border border-teal/15 overflow-hidden bg-teal-tint block aspect-video relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt={post.message ? post.message.slice(0, 80) : `${post.platform} post`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute top-2 left-2 text-xs bg-navy/80 text-cream px-2 py-1 rounded-full">
                  {post.platform}
                </span>
              </a>
            ))
          ) : (
            <>
              <div className="rounded-soft bg-teal-tint border border-teal/15 aspect-video flex items-center justify-center text-teal/60 text-sm">
                [ Latest camp photos will appear here once Facebook/Instagram are connected ]
              </div>
              <div className="rounded-soft bg-teal-tint border border-teal/15 aspect-video flex items-center justify-center text-teal/60 text-sm">
                [ Latest camp video will appear here once Facebook/Instagram are connected ]
              </div>
            </>
          )}
        </div>
        <div className="mt-4">
          <Link href="/social" className="text-teal hover:underline text-sm">
            Follow our social media →
          </Link>
        </div>
      </section>
    </div>
  );
}
