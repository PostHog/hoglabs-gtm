'use client'

// Reference solution — end-of-Lab-01 state.

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'
import { getConsent, saveConsent } from '../lib/store'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(getConsent() === null)
  }, [])

  if (!visible) return null

  function choose(value) {
    saveConsent(value)
    setVisible(false)

    // Honour the visitor's choice. opt_out persists in PostHog's own
    // storage, so this survives reloads. The subtle failure mode —
    // initialising opted-out and never successfully opting anyone in —
    // is drill 6, and the fully cookieless alternative is in the
    // cookieless-tracking tutorial linked from Lab 01.
    if (value === 'declined') {
      posthog.opt_out_capturing()
    } else {
      posthog.opt_in_capturing()
    }
  }

  return (
    <div className="cookie-banner">
      <span>🍪 We use analytics cookies to improve HogHabits.</span>
      <button className="btn" onClick={() => choose('accepted')}>Accept</button>
      <button className="btn-secondary" onClick={() => choose('declined')}>Decline</button>
    </div>
  )
}
