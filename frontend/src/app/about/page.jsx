export const metadata = {
  title: 'About Us',
  description: "Sunshine Social Foundation's mission, vision, and story.",
};

export default function AboutPage() {
  return (
    <div>
      <section className="bg-navy text-cream py-16">
        <div className="container-page">
          <p className="text-sun-soft text-sm uppercase tracking-widest">About Us</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2 max-w-2xl">
            The engine behind affordable, dignified elderly care in India.
          </h1>
        </div>
      </section>

      <section className="container-page py-14 grid gap-8 md:grid-cols-3">
        <div className="rounded-soft border border-sun-soft p-6">
          <h2 className="font-display text-xl text-navy">Our Mission</h2>
          <p className="mt-3 text-sm text-ink/80 leading-relaxed">
            To deliver accessible, technology-driven preventive healthcare
            and wellness services to middle-class elderly populations across
            India — at up to 75% subsidised cost — improving quality of life
            and reducing preventable disease burden.
          </p>
        </div>
        <div className="rounded-soft border border-sun-soft p-6">
          <h2 className="font-display text-xl text-navy">Our Vision</h2>
          <p className="mt-3 text-sm text-ink/80 leading-relaxed">
            A future where every Indian senior citizen — regardless of
            income — has access to regular health screenings, pain relief,
            and preventive wellness care in the dignity of their own community.
          </p>
        </div>
        <div className="rounded-soft border border-sun-soft p-6">
          <h2 className="font-display text-xl text-navy">Our Values</h2>
          <p className="mt-3 text-sm text-ink/80 leading-relaxed">
            Dignity &middot; Transparency &middot; Accessibility &middot;
            Technology for Good &middot; Community First. We measure success
            in healthier, happier elderly lives — not numbers alone.
          </p>
        </div>
      </section>

      <section className="bg-teal-tint py-14">
        <div className="container-page max-w-3xl">
          <p className="font-body text-sm uppercase tracking-widest text-teal">Our Story</p>
          <h2 className="font-display text-2xl text-navy mt-2">
            Reaching the &ldquo;Missing Middle&rdquo;
          </h2>
          <p className="mt-4 text-ink/80 leading-relaxed">
            In the Indian context, the &ldquo;Missing Middle&rdquo; — those
            too well-off for government aid, yet not wealthy enough for
            high-cost private healthcare — is a critical and often
            overlooked demographic. Sunshine Social Foundation exists to
            close that gap with technology-driven, scalable, subsidised care.
          </p>
          <blockquote className="mt-6 border-l-4 border-clay pl-4 italic text-navy">
            &ldquo;Every elder deserves to age with dignity, health, and
            happiness — not helplessness.&rdquo;
            <footer className="mt-1 text-sm text-ink/60">— Team Sunshine</footer>
          </blockquote>
        </div>
      </section>

      <section className="container-page py-14 grid gap-6 md:grid-cols-2">
        <div className="rounded-soft border border-navy/15 p-6">
          <h2 className="font-display text-lg text-navy">80G Tax Exemption</h2>
          <p className="mt-2 text-sm text-ink/75">
            All donations to Sunshine Social Foundation are eligible for tax
            deduction under Section 80G of the Income Tax Act. Digital
            receipts are issued within 7 working days.
          </p>
        </div>
        <div className="rounded-soft border border-navy/15 p-6">
          <h2 className="font-display text-lg text-navy">Verify Us</h2>
          <p className="mt-2 text-sm text-ink/75">
            Our NGO credentials are publicly verifiable on the Government of
            India&apos;s NGO Darpan portal at{' '}
            <span className="text-teal">ngodarpan.gov.in</span>.
            [ Registration number — add final ]
          </p>
        </div>
      </section>
    </div>
  );
}
