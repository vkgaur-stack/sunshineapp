import Link from 'next/link';
import Image from 'next/image';
import DonateButton from './DonateButton';

const navLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/services', label: 'Our Services' },
  { href: '/impact', label: 'Our Impact' },
  { href: '/get-involved', label: 'Get Involved' },
  { href: '/contact', label: 'Contact' },
];

// External tools — different systems entirely (webmail, ERP, and now the
// Beneficiary module's registration/login), not part of the Next.js app,
// so these are plain <a> tags rather than next/link, and open in a new tab
// since navigating away from the site to a login page isn't something a
// visitor wants to do in the same tab.
const externalLinks = [
  { href: 'https://webmail.sunshinesocial.org/', label: 'Email' },
  { href: 'https://www.sunshinesocial.org/erp/login.html', label: 'ERP' },
];

// Registration now happens entirely inside the Beneficiary module — it has
// its own database and its own registration/login flow, so this points
// there directly instead of to an internal /register page.
const BENEFICIARY_URL = 'https://www.sunshinesocial.org/Beneficiary/views/shared/login.php';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-sun-soft">
      <div className="container-page flex items-center justify-between h-20">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Sunshine Social Foundation logo"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
          <span className="font-display text-xl text-navy leading-none">
            Sunshine Social<br />
            <span className="text-sm font-body font-normal text-teal tracking-wide">
              Foundation
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 font-body text-sm text-ink">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-clay transition-colors">
              {link.label}
            </Link>
          ))}
          {externalLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-clay transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href={BENEFICIARY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full border border-navy text-navy text-sm font-body hover:bg-navy hover:text-white transition-colors"
          >
            Register
          </a>
          <DonateButton id="header" />
        </div>
      </div>
    </header>
  );
}
