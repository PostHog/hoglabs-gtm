// Reference solution — end-of-Lab-05 state.
// Server-side PostHog client (posthog-node), as a singleton.

import { PostHog } from 'posthog-node'

let client = null

export function getPostHogServer() {
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      // Server events go DIRECT to PostHog, not through the /ingest
      // proxy — ad blockers live in browsers, not on your server.
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,

      // Lab 05, step 5: the project secret API key (phs_, scope
      // feature_flag:read) lets posthog-node fetch flag definitions and
      // evaluate them locally, in-process. `secretKey` needs
      // posthog-node 5.40.0+; older versions call it personalApiKey.
      // Server-only secret — never NEXT_PUBLIC_ (drill 12).
      secretKey: process.env.POSTHOG_SECRET_API_KEY,

      // Dev-friendly: send every event immediately instead of
      // batching. In production you'd let batching work and call
      // shutdown() on process exit — posthog-node buffers events in
      // memory, and un-flushed events die with the process. That is
      // the classic "my server events never arrived" ticket.
      flushAt: 1,
      flushInterval: 0,
    })
  }
  return client
}
