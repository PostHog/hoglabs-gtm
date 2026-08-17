import { NextResponse } from 'next/server'
import { getPostHogServer } from '../../../lib/posthog-server'

export async function POST(request) {
  const { email, habit, streak } = await request.json()

  if (!email || !habit) {
    return NextResponse.json({ error: 'email and habit are required' }, { status: 400 })
  }

  // ============================================================
  // LAB 01, step 5 — capture the server-side event here:
  //
  //   const posthog = getPostHogServer()
  //   posthog.capture({
  //     distinctId: email,
  //     event: 'habit_checked_in',
  //     properties: { habit, streak, source: 'api' },
  //   })
  //
  // Two things the lab digs into:
  //   • distinctId is REQUIRED server-side — there's no cookie to
  //     fall back on. Get it wrong and you mint a brand-new person
  //     per event (that's drill 3).
  //   • posthog-node batches events in memory. If nothing flushes
  //     before the process idles, events vanish — the singleton in
  //     lib/posthog-server.js is configured to flush eagerly in dev.
  // ============================================================
  void getPostHogServer // keeps the import "used" until you wire it up

  return NextResponse.json({ ok: true })
}
