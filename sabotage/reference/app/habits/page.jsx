'use client'

// Reference solution — end-of-Lab-01 state.

import Link from 'next/link'
import { useEffect, useState } from 'react'
import posthog from 'posthog-js'
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

    // Custom event, captured in the handler where the action happens.
    // lowercase snake_case verb — you'll build funnels from this name
    // in Lab 03, and `Clicked create habit button` makes terrible funnels.
    posthog.capture('habit_created', {
      habit_name: habit.name,
      total_habits: next.length,
    })
  }

  async function checkIn(habit) {
    const today = new Date().toDateString()
    if (habit.lastCheckin === today) return

    const next = habits.map((h) =>
      h.id === habit.id ? { ...h, streak: h.streak + 1, lastCheckin: today } : h
    )
    setHabits(next)
    saveHabits(next)

    // The check-in event itself is captured SERVER-side in
    // app/api/checkin/route.js — one action, one event, captured once.
    // Capturing it here too would double-count every check-in.
    await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user?.email, habit: habit.name, streak: habit.streak + 1, workspace: user?.workspace }),
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
