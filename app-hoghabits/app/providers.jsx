'use client'

// ============================================================
// LAB 05, step 2 — this becomes a PostHogProvider.
//
// The React hooks (useFeatureFlagEnabled etc.) need a provider to
// read from. Important nuance: the provider must receive the client
// that instrumentation-client.js ALREADY initialised — passing
// `client={posthog}` does that. Never initialise twice.
// ============================================================

export default function Providers({ children }) {
  return children
}
