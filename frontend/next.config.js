/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export — produces plain HTML/CSS/JS in `out/` that any static
  // file host (including plain Apache/PHP hosting) can serve directly, no
  // Node.js server required. See DEPLOYMENT.md Section 4.2.
  output: 'export',
  images: {
    // next/image's built-in optimization needs a Node.js server to run at
    // request time — unavailable on static hosting, so images are served
    // as-is instead.
    unoptimized: true,
  },
  // Set NEXT_BASE_PATH at build time if deploying into a subdirectory
  // (e.g. https://yourdomain.com/New_Portal/) rather than the domain
  // root. Without this, all asset URLs are generated as root-relative
  // (/_next/...) and will 404 under a subdirectory — this was the actual
  // cause of the blank-page issue when testing under /New_Portal.
  // Example: NEXT_BASE_PATH=/New_Portal npm run build
  basePath: process.env.NEXT_BASE_PATH || '',
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api',
  },
};

module.exports = nextConfig;
