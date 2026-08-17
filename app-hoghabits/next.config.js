/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================
  // LAB 05 / DRILL 9 — reverse proxy.
  //
  // Uncommenting the rewrites below routes all PostHog traffic
  // through YOUR domain (localhost:3000/ingest) instead of
  // *.i.posthog.com — which is what defeats ad blockers.
  // If your project is in the EU region, swap us → eu below.
  //
  // BOTH EDITS OR NEITHER: if instrumentation-client.js says
  // `api_host: '/ingest'` while these rewrites are still commented out,
  // every PostHog request 404s against Next.js and you get a console
  // full of "Bad HTTP status: 404" plus HTML. Restart `npm run dev`
  // after changing this file; it is only read at server start.
  //
  // See labs/05-flags.md (step 6) and the drill 9 answer key.
  // ============================================================
  // async rewrites() {
  //   return [
  //     {
  //       source: '/ingest/static/:path*',
  //       destination: 'https://us-assets.i.posthog.com/static/:path*',
  //     },
  //     {
  //       source: '/ingest/:path*',
  //       destination: 'https://us.i.posthog.com/:path*',
  //     },
  //   ]
  // },

  // Required for PostHog trailing-slash API requests when proxying.
  skipTrailingSlashRedirect: true,
}

module.exports = nextConfig
