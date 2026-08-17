// Tiny localStorage-backed store. This is fake auth for a lab app —
// it exists so logging out is a real state change (which matters for
// the posthog.reset() lesson in Lab 02).

const USER_KEY = 'hh_user'
const HABITS_KEY = 'hh_habits'
const CONSENT_KEY = 'hh_cookie_consent'

function isBrowser() {
  return typeof window !== 'undefined'
}

export function getUser() {
  if (!isBrowser()) return null
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem(USER_KEY)
}

export function getHabits() {
  if (!isBrowser()) return []
  try {
    return JSON.parse(localStorage.getItem(HABITS_KEY)) || []
  } catch {
    return []
  }
}

export function saveHabits(habits) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits))
}

export function getConsent() {
  if (!isBrowser()) return null
  return localStorage.getItem(CONSENT_KEY)
}

export function saveConsent(value) {
  localStorage.setItem(CONSENT_KEY, value)
}
