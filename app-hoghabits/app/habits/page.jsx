'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getUser, getHabits, saveHabits } from '../../lib/store'
import InviteForm from '../../components/InviteForm'
import BrokenSaveButton from '../../components/BrokenSaveButton'

export default function HabitsPage() {
  const [user, setUser] = useState(null)
  const [habits, setHabits] = useState([])
  const [newHabit, setNewHabit] = useState('')
  const [invitedOnce, setInvitedOnce] = useState(false)
  const [notes, setNotes] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setUser(getUser())
    setHabits(getHabits())
    setLoaded(true)
  }, [])

  function addHabit(e) {
    e.preventDefault()
    if (!newHabit.trim()) return
    const habit = { id: Date.now(), name: newHabit.trim(), streak: 0, lastCheckin: null }
    const next = [...habits, habit]
    setHabits(next)
    saveHabits(next)
    setNewHabit('')

    // ============================================================
    // NEEDS AN IMPORT: this file calls the SDK, so it needs
    //   import posthog from 'posthog-js'
    // at the top, alongside the other imports. Initialising in
    // instrumentation-client.js does not put `posthog` in scope here.
    // LAB 01, step 4 — capture a custom `habit_created` event here,
    // with properties: { habit_name, total_habits }.
    // Event names: lowercase snake_case verbs. `habit_created`, not
    // `Clicked create habit button` — Lab 03 shows you why when you
    // build funnels out of these.
    // ============================================================
  }

  async function checkIn(habit) {
    const today = new Date().toDateString()
    if (habit.lastCheckin === today) return

    const next = habits.map((h) =>
      h.id === habit.id ? { ...h, streak: h.streak + 1, lastCheckin: today } : h
    )
    setHabits(next)
    saveHabits(next)

    // The check-in also hits the server — Lab 01 step 5 instruments
    // the server side of this same action, and Lab 02 explains how
    // the two events end up on the same person.
    await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user?.email, habit: habit.name, streak: habit.streak + 1 }),
    }).catch(() => {})
  }

  if (loaded && !user) {
    return (
      <p>
        You need a workspace first — <Link href="/signup">create one</Link>.
      </p>
    )
  }

  const checkedInToday = habits.some((h) => h.lastCheckin === new Date().toDateString())

  return (
    <>
      <h1>Your habits</h1>
      {user && <p className="muted">Workspace: {user.workspace}</p>}

      <div className="card section">
        <h3>Getting started</h3>
        <ul className="checklist">
          <li className={habits.length > 0 ? 'done' : ''}>1. Create your first habit</li>
          <li className={checkedInToday ? 'done' : ''}>2. Do a daily check-in</li>
          <li className={invitedOnce ? 'done' : ''}>3. Invite a teammate</li>
        </ul>
      </div>

      <div className="card section">
        <h3>New habit</h3>
        <form onSubmit={addHabit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            style={{ flex: 1, font: 'inherit', padding: '0.45rem 0.7rem', border: '1px solid var(--line)', borderRadius: 8 }}
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Ship something every day"
          />
          <button className="btn btn-small" type="submit">Add habit</button>
        </form>
      </div>

      <div className="card section">
        <h3>Today</h3>
        {habits.length === 0 && <p className="muted">No habits yet. Future you is disappointed.</p>}
        {habits.map((h) => (
          <div key={h.id} className="habit-row">
            <span>{h.name}</span>
            <span className="streak">🔥 {h.streak}</span>
            <button
              className="btn btn-small"
              disabled={h.lastCheckin === new Date().toDateString()}
              onClick={() => checkIn(h)}
            >
              {h.lastCheckin === new Date().toDateString() ? 'Done today' : 'Check in'}
            </button>
          </div>
        ))}
      </div>

      <div className="card section">
        <h3>Notes</h3>
        <textarea
          className="notes-area"
          placeholder="Reflections, excuses, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <BrokenSaveButton onSave={() => {}} />
      </div>

      <div className="card section">
        <h3>Invite a teammate</h3>
        <div onSubmitCapture={() => setInvitedOnce(true)}>
          <InviteForm workspace={user?.workspace || 'your workspace'} />
        </div>
      </div>
    </>
  )
}
