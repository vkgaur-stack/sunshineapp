import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: {
    default: 'Sunshine Social Foundation — Subsidised Physiotherapy & Pain Relief',
    template: '%s | Sunshine Social Foundation',
  },
  description:
    'Sunshine Social Foundation delivers up to 75% subsidised pain relief and physiotherapy services to India\u2019s middle-class families, with dignity and technology-driven care.',
  openGraph: {
    title: 'Sunshine Social Foundation',
    description:
      'Up to 75% subsidised pain relief and physiotherapy for India\u2019s middle-class elderly.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-body">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
