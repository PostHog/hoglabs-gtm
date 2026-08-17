// Reference solution — end-of-Lab-05 state (reverse proxy active).

// next.config.js can read .env.local in modern Next.js. The assets
// host is derived from the ingest host so EU projects work unchanged.
const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const PH_ASSETS = PH_HOST.replace('.i.posthog.com', '-assets.i.posthog.com')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The reverse proxy (Lab 05, step 6 / drill 9). PostHog traffic
  // now flows through localhost:3000/ingest — your own domain —
  // instead of *.i.posthog.com, which is what ad blockers target.
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: `${PH_ASSETS}/static/:path*`,
      },
      {
        source: '/ingest/:path*',
        destination: `${PH_HOST}/:path*`,
      },
    ]
  },

  // Required for PostHog trailing-slash API requests when proxying.
  skipTrailingSlashRedirect: true,
}

module.exports = nextConfig
