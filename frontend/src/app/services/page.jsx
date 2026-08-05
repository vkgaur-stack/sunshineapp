import ServicesContent from './ServicesContent';

export const metadata = {
  title: 'Our Services',
  description:
    'Physiotherapy, pain relief therapy, and health screening services at up to 75% subsidised cost.',
};

// Thin Server Component wrapper — keeps SEO metadata working (only
// available in Server Components) while delegating actual data fetching
// to the client component, which is what makes this compatible with
// static export.
export default function ServicesPage() {
  return <ServicesContent />;
}
