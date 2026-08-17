'use client'

import { useEffect, useState } from 'react'
import { getUser } from '../../lib/store'

export default function UpgradePage() {
  const [user, setUser] = useState(null)
  const [upgraded, setUpgraded] = useState(false)

  useEffect(() => {
    setUser(getUser())
  }, [])

  // ============================================================
  // LAB 05 — this page is where feature flags happen.
  //
  // Step 3: gate the "Annual billing (2 months free)" offer below
  // behind a `annual-offer` flag using useFeatureFlagEnabled().
  // The hook handles loading states for you — that's the point.
  //
  // You will ALSO need a `mounted` gate, because this page is
  // server-rendered and the server has no flags. Without it, React
  // compares a flagless server render against a flag-aware client
  // render and throws a hydration mismatch. Lab 05 step 3 has the
  // pattern and explains why.
  //
  // LAB 06: the CTA copy on the button below is your experiment
  // target (`upgrade-cta-copy`: "Upgrade to Pro" vs "Start your
  // Pro trial").
  // ============================================================

  const annualOfferEnabled = false // LAB 05, step 3: replace with the flag hook

  function handleUpgrade() {
    setUpgraded(true)

    // NEEDS AN IMPORT: this file calls the SDK, so it needs
    //   import posthog from 'posthog-js'
    // at the top, alongside the other imports. Initialising in
    // instrumentation-client.js does not put `posthog` in scope here.
    // LAB 01, step 4 — capture `upgrade_clicked` here (this is the
    // conversion event your Lab 03 funnel and Lab 06 experiment use).
  }

  return (
    <>
      <h1>HogHabits Pro</h1>
      <p className="muted" style={{ margin: '0.5rem 0 1.5rem' }}>
        Everything in Free, plus features {user?.name || 'you'} will feel obligated to use.
      </p>

      <div className="paywall">
        <p className="price">$8<span className="muted" style={{ fontSize: '1rem' }}>/user/month</span></p>
        <ul style={{ margin: '0.75rem 0 1.25rem 1.25rem' }}>
          <li>Unlimited habits (Free: 3)</li>
          <li>Workspace leaderboards</li>
          <li>Streak insurance — one guilt-free missed day per month</li>
        </ul>

        {annualOfferEnabled && (
          <p className="success" style={{ marginBottom: '1rem' }}>
            🎉 Annual billing now available — 2 months free!
          </p>
        )}

        {upgraded ? (
          <p className="success">You&apos;re Pro now! (Not really. Nothing was charged. This is a lab.)</p>
        ) : (
          <button className="btn" onClick={handleUpgrade}>Upgrade to Pro</button>
        )}
      </div>
    </>
  )
}
