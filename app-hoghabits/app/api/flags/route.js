import { NextResponse } from 'next/server'
import { getPostHogServer } from '../../../lib/posthog-server'

export async function GET(request) {
  const email = new URL(request.url).searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'email query param is required' }, { status: 400 })
  }

  // ============================================================
  // LAB 05, step 5 — server-side LOCAL flag evaluation.
  //
  // Replace the placeholder return below with:
  //
  //   const posthog = getPostHogServer()
  //   const flags = await posthog.getAllFlags(email, { onlyEvaluateLocally: true })
  //   return NextResponse.json({ flags })
  //
  // It belongs HERE, inside GET, because `email` is read from the
  // request a few lines up. At the top of the file it isn't in scope,
  // and the module throws `ReferenceError: email is not defined`
  // before the route ever runs.
  //
  // Why customers care: resilience (flags keep answering even when the
  // flags endpoint is slow) and latency. Local evaluation
  // is also billed differently from client-side flag requests, which
  // Lab 05 covers.
  // ============================================================
  void getPostHogServer // keeps the import "used" until you wire it up

  return NextResponse.json({ flags: {}, note: 'Not implemented yet — this is Lab 05, step 5.' })
}
