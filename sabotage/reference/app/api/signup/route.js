import { NextResponse } from 'next/server'
import { getPostHogServer } from '../../../lib/posthog-server'

// Reference solution — end-of-Lab-02 state.

export async function POST(request) {
  const { email, name, workspace } = await request.json()

  if (!email || !name || !workspace) {
    return NextResponse.json({ error: 'email, name and workspace are required' }, { status: 400 })
  }

  const posthog = getPostHogServer()

  // Server-side identify. Note the shape: an object, not positional
  // args — and unlike the browser there is no anonymous session to
  // merge, because servers don't have one. Use it to set person
  // properties from data only the backend knows.
  posthog.identify({
    distinctId: email,
    properties: { email, name, workspace },
  })

  // Group properties, set server-side for the same reason.
  posthog.groupIdentify({
    groupType: 'workspace',
    groupKey: workspace,
    properties: { name: workspace, plan: 'free' },
  })

  return NextResponse.json({ ok: true, user: { email, name, workspace } })
}
