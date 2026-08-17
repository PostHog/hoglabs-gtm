'use client'

// Reference solution — end-of-Lab-02 state.

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import posthog from 'posthog-js'
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
    // Capture BEFORE reset — after reset the event would belong to a
    // brand-new anonymous person.
    posthog.capture('user_logged_out')

    // reset() ends the identified session: new anonymous distinct_id
    // from here on. Logout is the ONLY place it belongs. Calling it
    // before identify (or on page load) splits one human into many
    // anonymous persons — see drill 3's cousin in health-checks.md.
    posthog.reset()

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
