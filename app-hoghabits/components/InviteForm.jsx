'use client'

import { useState } from 'react'

export default function InviteForm({ workspace }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  function handleInvite(e) {
    e.preventDefault()
    if (!email.includes('@')) return
    // (No email is actually sent. This is a lab app; your colleagues are safe.)

    // ============================================================
    // NEEDS AN IMPORT: this file calls the SDK, so it needs
    //   import posthog from 'posthog-js'
    // at the top, alongside the other imports. Initialising in
    // instrumentation-client.js does not put `posthog` in scope here.
    // LAB 01, step 4 — capture a custom `teammate_invited` event here,
    // with properties: { invitee_domain, workspace }.
    // Send the domain, not the raw email — event properties shouldn't
    // collect more PII than the question needs.
    // ============================================================

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
