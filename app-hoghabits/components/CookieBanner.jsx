'use client'

import { useEffect, useState } from 'react'
import { getConsent, saveConsent } from '../lib/store'

// A classic cookie banner. In the pristine app it only stores the
// visitor's choice. Lab 01 (step 6) discusses wiring it to PostHog —
// and drill 6 shows the subtle way customers get that wiring wrong.
export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(getConsent() === null)
  }, [])

  if (!visible) return null

  function choose(value) {
    saveConsent(value)
    setVisible(false)
    // NEEDS AN IMPORT: this file calls the SDK, so it needs
    //   import posthog from 'posthog-js'
    // at the top, alongside the other imports. Initialising in
    // instrumentation-client.js does not put `posthog` in scope here.
    // LAB 01, step 6: tell PostHog about the visitor's choice here.
  }

  return (
    <div className="cookie-banner">
      <span>🍪 We use analytics cookies to improve HogHabits.</span>
      <button className="btn" onClick={() => choose('accepted')}>Accept</button>
      <button className="btn-secondary" onClick={() => choose('declined')}>Decline</button>
    </div>
  )
}
