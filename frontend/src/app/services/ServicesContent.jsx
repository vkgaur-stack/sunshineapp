'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

// Registration now happens entirely inside the Beneficiary module.
const BENEFICIARY_URL = 'https://www.sunshinesocial.org/Beneficiary/views/shared/login.php';

const placeholderServices = [
  {
    id: 'placeholder-1',
    name: 'Physiotherapy Session',
    description: 'One-on-one physiotherapy for pain relief and mobility. [ Connect to backend to load live services ]',
  },
  {
    id: 'placeholder-2',
    name: 'Body Pain Relief Therapy',
    description: 'Automated massage therapy for aches and improved circulation.',
  },
  {
    id: 'placeholder-3',
    name: 'Health Parameter Screening',
    description: 'Free BP, blood sugar, and basic health metric screening.',
  },
];

// Client-side data fetching (converted from a Server Component) so this
// works on static-export/PHP-only hosting with no Node.js server.
export default function ServicesContent() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.listServices()
      .then(({ services }) => setServices(services || []))
      .catch(() => setServices([]));
  }, []);

  const displayServices = services.length > 0 ? services : placeholderServices;

  return (
    <div>
      <section className="bg-navy text-cream py-16">
        <div className="container-page">
          <p className="text-sun-soft text-sm uppercase tracking-widest">Our Services</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2 max-w-2xl">
            No more sidelined by pain.
          </h1>
          <p className="mt-3 text-cream/85 max-w-xl">
            Quality care, accessible at up to 75% subsidised cost — restoring
            mobility, independence, and joy.
          </p>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {displayServices.map((service) => (
            <div key={service.id} className="rounded-soft border border-sun-soft p-6 bg-white">
              <h2 className="font-display text-lg text-navy">{service.name}</h2>
              <p className="mt-2 text-sm text-ink/75 leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href={BENEFICIARY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-full bg-clay text-white font-body hover:bg-clay-dark transition-colors"
          >
            Register as Beneficiary
          </a>
        </div>
      </section>

      <section className="bg-teal-tint py-14">
        <div className="container-page">
          <h2 className="font-display text-xl text-navy">How to Access Our Services</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3 text-sm text-ink/80">
            <li className="bg-white rounded-soft p-5 border border-teal/15">
              <strong className="text-navy">1. Register</strong> — Share your
              basic details and the service you need.
            </li>
            <li className="bg-white rounded-soft p-5 border border-teal/15">
              <strong className="text-navy">2. Book</strong> — Choose a
              service, date, and available time slot.
            </li>
            <li className="bg-white rounded-soft p-5 border border-teal/15">
              <strong className="text-navy">3. Attend</strong> — Visit the
              camp or partner clinic and receive subsidised care.
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
