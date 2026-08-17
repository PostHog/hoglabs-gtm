'use client'

import { useRef, useState } from 'react'

// This button is broken ON PURPOSE: it silently ignores the first
// three clicks, with no feedback. Real users respond by clicking it
// furiously — which is exactly the $rageclick pattern you'll hunt
// down in session replay (Lab 04). Do not fix it. It is the lesson.
export default function BrokenSaveButton({ onSave }) {
  const clicks = useRef(0)
  const [saved, setSaved] = useState(false)

  function handleClick() {
    clicks.current += 1
    if (clicks.current < 4) {
      // Swallow the click. Say nothing. Feel nothing.
      return
    }
    clicks.current = 0
    onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <span>
      <button className="btn-secondary btn-small" onClick={handleClick}>
        Save notes
      </button>
      {saved && <span className="success" style={{ marginLeft: '0.6rem' }}>Saved!</span>}
    </span>
  )
}
