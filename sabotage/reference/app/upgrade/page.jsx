'use client'

// Reference solution — end-of-Lab-06 state.

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'
import { useFeatureFlagEnabled, useFeatureFlagVariantKey } from 'posthog-js/react'
import { getUser } from '../../lib/store'

export default function UpgradePage() {
  const [user, setUser] = useState(null)
  const [upgraded, setUpgraded] = useState(false)

  // Flag-gated UI is client-only. The server has no flags, so anything
  // that depends on one must not render until after hydration: otherwise
  // React compares a flagless server render against a flag-aware client
  // render and throws a hydration mismatch. useState(false) guarantees
  // the first client render matches the server exactly. The visible swap
  // once this flips is the flicker that bootstrapping removes (Lab 05,
  // step 7).
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setUser(getUser())
  }, [])

  useEffect(() => setMounted(true), [])

  // Lab 05: the hook re-renders when flags finish loading — no race,
  // no manual loading state.
  const annualOfferEnabled = useFeatureFlagEnabled('annual-offer')

  // Lab 06: the experiment. Variant key is `control` or `trial-copy`;
  // undefined while flags load, so default to control copy.
  const ctaVariant = useFeatureFlagVariantKey('upgrade-cta-copy')
  const ctaLabel = mounted && ctaVariant === 'trial-copy' ? 'Start your free Pro trial' : 'Upgrade to Pro'

  function handleUpgrade() {
    setUpgraded(true)

    // The conversion event — Lab 03's funnel ends here and Lab 06's
    // experiment counts it as the primary metric.
    posthog.capture('upgrade_clicked', {
      cta_variant: ctaVariant ?? 'control',
      annual_offer_shown: !!annualOfferEnabled,
    })
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

        {mounted && annualOfferEnabled && (
          <p className="success" style={{ marginBottom: '1rem' }}>
            🎉 Annual billing now available — 2 months free!
          </p>
        )}

        {upgraded ? (
          <p className="success">You&apos;re Pro now! (Not really. Nothing was charged. This is a lab.)</p>
        ) : (
          <button className="btn" onClick={handleUpgrade}>{ctaLabel}</button>
        )}
      </div>
    </>
  )
}
