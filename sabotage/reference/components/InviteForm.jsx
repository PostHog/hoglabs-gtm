'use client'

// Reference solution — end-of-Lab-01 state.

import { useState } from 'react'
import posthog from 'posthog-js'

export default function InviteForm({ workspace }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleInvite(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    // (No email is actually sent. This is a lab app; your colleagues are safe.)

    // Capture in the event handler, where the action happens.
    // Domain only — event properties shouldn't collect more PII than
    // the question ("which companies invite teammates?") needs.
    posthog.capture('teammate_invited', {
      invitee_domain: email.split('@')[1],
      workspace,
    })

    setSent(true)
    setEmail('')
    setTimeout(() => setSent(false), 2500)
  }

  return (
    <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <input
        style={{ flex: 1, font: 'inherit', padding: '0.45rem 0.7rem', border: '1px solid var(--line)', borderRadius: 8 }}
        type="email"
        placeholder="teammate@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="btn btn-small" type="submit">Invite to {workspace}</button>
      {sent && <span className="success">Invited!</span>}
    </form>
  )
}
