'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

// Client-side data fetching (matches the pattern used for Contact/Donate)
// so this works on static-export/PHP-only hosting.
export default function SocialContent() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.getOrgSettings()
      .then(({ settings }) => setSettings(settings))
      .catch(() => setSettings(null));
  }, []);

  const platforms = [
    {
      name: 'Facebook',
      href: settings?.facebookUrl || null,
      note: settings?.facebookUrl || '[ Add in Admin > Settings ]',
    },
    {
      name: 'Instagram',
      href: settings?.instagramUrl || null,
      note: settings?.instagramUrl || '[ Add in Admin > Settings ]',
    },
    {
      name: 'YouTube',
      href: settings?.youtubeUrl || null,
      note: settings?.youtubeUrl || '[ Add in Admin > Settings, if applicable ]',
    },
  ];

  return (
    <div>
      <section className="bg-navy text-cream py-16">
        <div className="container-page">
          <p className="text-sun-soft text-sm uppercase tracking-widest">Social Media</p>
          <h1 className="font-display text-3xl md:text-4xl mt-2 max-w-2xl">
            Follow the journey, camp by camp.
          </h1>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {platforms.map((p) => {
            const Wrapper = p.href ? 'a' : 'div';
            const linkProps = p.href
              ? { href: p.href, target: '_blank', rel: 'noopener noreferrer' }
              : {};
            return (
              <Wrapper
                key={p.name}
                {...linkProps}
                className="rounded-soft border border-sun-soft p-6 bg-white hover:border-clay transition-colors block"
              >
                <h2 className="font-display text-lg text-navy">{p.name}</h2>
                <p className="mt-2 text-sm text-ink/60 break-all">{p.note}</p>
                {p.href && (
                  <span className="mt-3 inline-block text-sm text-clay">Follow →</span>
                )}
              </Wrapper>
            );
          })}
        </div>

        <div className="mt-10">
          <p className="font-body text-sm uppercase tracking-widest text-teal">Trending Posts</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-soft bg-teal-tint border border-teal/15 aspect-square flex items-center justify-center text-teal/60 text-sm">
                [ Post {i} — connect Instagram/Facebook Graph API in a future phase ]
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
