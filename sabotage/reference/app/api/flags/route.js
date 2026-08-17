import { NextResponse } from 'next/server'
import { getPostHogServer } from '../../../lib/posthog-server'

// Reference solution — end-of-Lab-05 state.

export async function GET(request) {
  const email = new URL(request.url).searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'email query param is required' }, { status: 400 })
  }

  // LOCAL evaluation: posthog-node has already fetched the flag
  // definitions (using the personal API key) and evaluates them
  // in-process — no network round-trip per request, and flags keep
  // answering even when the flags endpoint is having a bad day.
  // Trade-offs the lab covers: definitions refresh on a poll interval
  // (default 30s), flags that need DB-side data can't evaluate
  // locally, and local evaluation is billed differently.
  const posthog = getPostHogServer()
  const flags = await posthog.getAllFlags(email, { onlyEvaluateLocally: true })

  return NextResponse.json({ flags })
}
