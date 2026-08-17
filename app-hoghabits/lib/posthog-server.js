// ============================================================
// LAB 01 — the server-side PostHog client (posthog-node) is
// created in this file, as a singleton shared by all API routes.
//
// Why a singleton: posthog-node batches events in memory before
// sending. A new client per request would lose events that were
// still sitting in the batch when the request ended — which is
// exactly the "my server events never show up" customer ticket.
//
// See labs/01-instrument.md, step 5.
// ============================================================

export function getPostHogServer() {
  // LAB 01: replace this with a real posthog-node singleton.
  return null
}
