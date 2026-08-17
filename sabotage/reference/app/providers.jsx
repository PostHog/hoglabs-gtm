'use client'

// Reference solution — end-of-Lab-05 state.
//
// The provider makes the React hooks (useFeatureFlagEnabled, etc.)
// work. Crucially it receives the client that instrumentation-client.js
// already initialised — `client={posthog}` — it does NOT initialise
// a second one. Double-initialisation is a classic customer bug.

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

export default function Providers({ children }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
