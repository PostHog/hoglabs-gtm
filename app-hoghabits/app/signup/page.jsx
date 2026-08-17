'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { saveUser } from '../../lib/store'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [workspace, setWorkspace] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, workspace }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error || 'Something went wrong')
      return
    }

    saveUser({ email, name, workspace })
    window.dispatchEvent(new Event('hh-auth-changed'))

    // ============================================================
    // NEEDS AN IMPORT: this file calls the SDK, so it needs
    //   import posthog from 'posthog-js'
    // at the top, alongside the other imports. Initialising in
    // instrumentation-client.js does not put `posthog` in scope here.
    // LAB 02, steps 2–3 — this is THE identification moment:
    //
    //   1. posthog.identify(email, { name, email })
    //      Links everything this visitor did anonymously (landing
    //      page, FAQ clicks) to the person they just became.
    //
    //   2. posthog.group('workspace', workspace, { name: workspace })
    //      Attaches this user's events to their company — the thing
    //      B2B customers pay group analytics for.
    //
    // Order matters, and Lab 02 explains why.
    // ============================================================

    router.push('/habits')
  }

  return (
    <>
      <h1>Create your workspace</h1>
      <p className="muted" style={{ margin: '0.5rem 0 1.5rem' }}>
        No password needed. This is a lab app — security theatre only.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="name">Your name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Max Hedgehog" required />
        </div>
        <div className="form-row">
          <label htmlFor="email">Work email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="max@hedgehogs.dev" required />
        </div>
        <div className="form-row">
          <label htmlFor="workspace">Workspace name</label>
          <input id="workspace" value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="Hedgehogs Inc" required />
        </div>
        {error && <p style={{ color: '#c00' }}>{error}</p>}
        <button className="btn" type="submit">Create workspace</button>
      </form>
    </>
  )
}
