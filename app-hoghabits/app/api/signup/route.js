import { NextResponse } from 'next/server'
import { getPostHogServer } from '../../../lib/posthog-server'

export async function POST(request) {
  const { email, name, workspace } = await request.json()

  if (!email || !name || !workspace) {
    return NextResponse.json({ error: 'email, name and workspace are required' }, { status: 400 })
  }

  // ============================================================
  // LAB 02, step 4 — server-side identification goes here.
  //
  // posthog-node has identify() too, but the shape differs from the
  // browser SDK — it takes an object, and there's no anonymous
  // session to merge (servers don't have one):
  //
  //   const posthog = getPostHogServer()
  //   posthog.identify({ distinctId: email, properties: { name, workspace } })
  //   posthog.groupIdentify({ groupType: 'workspace', groupKey: workspace,
  //                           properties: { name: workspace } })
  //
  // Lab 02 explains when to identify server-side vs client-side.
  // ============================================================
  void getPostHogServer // keeps the import "used" until you wire it up

  return NextResponse.json({ ok: true, user: { email, name, workspace } })
}
