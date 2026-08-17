// Reference solution — end-of-Lab-05 state.
// Client-side PostHog initialisation (official App Router pattern).

import posthog from 'posthog-js'

const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  // Lab 05 step 6 switched this from the direct host to the reverse
  // proxy configured in next.config.js. Ad blockers block
  // *.i.posthog.com; they don't block your own domain.
  api_host: '/ingest',

  // The proxy hides the real host from the browser, so posthog-js
  // needs to be told where the PostHog UI lives (toolbar, surveys).
  ui_host: host.replace('.i.posthog.com', '.posthog.com'),

  // Pins the modern behaviour bundle. Among other things this makes
  // $pageview fire on client-side route changes (history API), which
  // an App Router app navigates with. Removing it is drill 11.
  defaults: '2026-01-30',

  // Loud in dev, quiet in prod.
  debug: process.env.NODE_ENV === 'development',
})

// Lab convenience (added in Lab 02, step 5): posthog-js imported as a
// module stays out of global scope, so expose it for console poking.
// Snippet-installed sites get window.posthog for free, which is why the
// basic implementation review can tell you to type `posthog.config` in a
// customer's console. Not a practice to recommend in production.
if (typeof window !== 'undefined') window.posthog = posthog
