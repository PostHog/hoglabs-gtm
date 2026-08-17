'use client'

// Reference solution — end-of-Lab-02 state.

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import posthog from 'posthog-js'
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

    // The identification moment (Lab 02).
    // identify() links the anonymous browsing that happened before
    // signup to the person this visitor just became — one call, at
    // the moment you learn who they are. Never in a loop, never on
    // every page (drill 1).
    posthog.identify(email, { email, name })

    // Group: attach this user's events to their company. This is
    // what group analytics is — without this call the workspace tab
    // stays empty no matter what the customer pays (drill 5).
    posthog.group('workspace', workspace, { name: workspace })

    posthog.capture('workspace_created', { workspace })

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
