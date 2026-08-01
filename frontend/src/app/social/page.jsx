export const metadata = {
  title: 'Social Media',
  description: 'Follow Sunshine Social Foundation on Facebook and Instagram.',
};

const platforms = [
  { name: 'Facebook', href: '#', note: '[ Add final Facebook page link ]' },
  { name: 'Instagram', href: '#', note: '[ Add final Instagram profile link ]' },
  { name: 'YouTube', href: '#', note: '[ Add final YouTube channel link, if any ]' },
];

export default function SocialPage() {
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
          {platforms.map((p) => (
            <a key={p.name} href={p.href}
              className="rounded-soft border border-sun-soft p-6 bg-white hover:border-clay transition-colors block">
              <h2 className="font-display text-lg text-navy">{p.name}</h2>
              <p className="mt-2 text-sm text-ink/60">{p.note}</p>
              <span className="mt-3 inline-block text-sm text-clay">Follow →</span>
            </a>
          ))}
        </div>

        <div className="mt-10">
          <p className="font-body text-sm uppercase tracking-widest text-teal">Trending Posts</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-soft bg-teal-tint border border-teal/15 aspect-square flex items-center justify-center text-teal/60 text-sm">
                [ Post {i} — connect Instagram/Facebook Graph API in Phase 3 ]
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
