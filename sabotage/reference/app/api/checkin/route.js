import { NextResponse } from 'next/server'
import { getPostHogServer } from '../../../lib/posthog-server'

// Reference solution — end-of-Lab-01 state.

export async function POST(request) {
  const { email, habit, streak, workspace } = await request.json()

  if (!email || !habit) {
    return NextResponse.json({ error: 'email and habit are required' }, { status: 400 })
  }

  // Server-side capture. distinctId is REQUIRED here — there is no
  // cookie to fall back on. It must be the SAME id the browser SDK
  // identifies with (the email), or client and server events land on
  // different persons — that's drill 3.
  const posthog = getPostHogServer()
  posthog.capture({
    distinctId: email,
    event: 'habit_checked_in',
    properties: { habit, streak, source: 'api' },
    // Groups are per-event server-side (Lab 02): the browser SDK
    // remembers the group from posthog.group(), but posthog-node has
    // no memory — omit this and the event won't count toward the
    // workspace in group analytics.
    groups: workspace ? { workspace } : undefined,
  })

  return NextResponse.json({ ok: true })
}
