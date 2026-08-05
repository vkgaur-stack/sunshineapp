import GetInvolvedForm from './GetInvolvedForm';

export const metadata = {
  title: 'Get Involved',
  description: 'Partner with, volunteer for, or support Sunshine Social Foundation.',
};

export default function GetInvolvedPage() {
  return (
    <div>
      <section className="bg-navy text-cream py-16">
        <div className="container-page">
          <p className="text-sun-soft text-sm uppercase tracking-widest">Get Involved</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2 max-w-2xl">
            This is a community effort. Be part of it.
          </h1>
          <p className="mt-3 text-cream/85 max-w-xl">
            We seek partnerships with hospitals, clinics, corporations, NGOs,
            and community groups — and volunteers who share our vision.
          </p>
        </div>
      </section>

      <section className="container-page py-14 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-xl text-navy">Ways to Contribute</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink/80">
            <li><strong className="text-navy">Volunteer</strong> — medical professionals, counselors, fitness instructors, and event organisers.</li>
            <li><strong className="text-navy">Partner</strong> — hospitals, clinics, corporations, and community groups to expand our reach.</li>
            <li><strong className="text-navy">CSR Partner</strong> — fund a health camp or sponsor equipment under Companies Act Schedule VII.</li>
            <li><strong className="text-navy">Donate</strong> — fund medical supplies, centres, and keep services accessible to all.</li>
          </ul>
        </div>
        <GetInvolvedForm />
      </section>
    </div>
  );
}
