'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUser, clearUser } from '../lib/store'

export default function Nav() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  // Read auth state after mount (localStorage isn't available on the server).
  useEffect(() => {
    setUser(getUser())
    const onStorage = () => setUser(getUser())
    window.addEventListener('hh-auth-changed', onStorage)
    return () => window.removeEventListener('hh-auth-changed', onStorage)
  }, [])

  function handleLogout() {
    // ============================================================
    // NEEDS AN IMPORT: this file calls the SDK, so it needs
    //   import posthog from 'posthog-js'
    // at the top, alongside the other imports. Initialising in
    // instrumentation-client.js does not put `posthog` in scope here.
    // LAB 02, step 5 — logout is where posthog.reset() belongs.
    // (And ONLY here. Calling reset() anywhere before identify is
    // how customers end up with split users — see drill 3.)
    // ============================================================
    clearUser()
    window.dispatchEvent(new Event('hh-auth-changed'))
    router.push('/')
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">🦔 HogHabits</Link>
        <nav className="nav-links">
          {user && <Link href="/habits">Habits</Link>}
          {user && <Link href="/upgrade">Upgrade</Link>}
        </nav>
        <div className="nav-user">
          {user ? (
            <>
              <span>{user.email}</span>
              <button className="btn-secondary btn-small" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <Link href="/signup">Sign up</Link>
          )}
        </div>
      </div>
    </header>
  )
}
