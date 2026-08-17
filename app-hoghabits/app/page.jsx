import Link from 'next/link'

// The landing page is deliberately browsable while anonymous —
// PostHog will assign visitors an anonymous distinct_id here, which
// becomes the "merge on signup" lesson in Lab 02.
export default function LandingPage() {
  return (
    <>
      <section className="hero">
        <h1>Habits are a team sport.</h1>
        <p>
          HogHabits helps your whole workspace build habits together — daily
          check-ins, streaks, and just enough peer pressure.
        </p>
        <Link href="/signup" className="btn" style={{ textDecoration: 'none', padding: '0.7rem 1.4rem' }}>
          Get started — it&apos;s free
        </Link>
      </section>

      <div className="grid">
        <div className="card">
          <h3>📈 Streaks</h3>
          <p>Check in daily and watch the streak grow. Miss a day, feel the shame.</p>
        </div>
        <div className="card">
          <h3>🧑‍🤝‍🧑 Workspaces</h3>
          <p>Habits are shared with your team. Accountability is the product.</p>
        </div>
        <div className="card">
          <h3>🏆 Leaderboards</h3>
          <p>Coming soon. Allegedly.</p>
        </div>
      </div>

      <section className="section">
        <h2>Questions people ask</h2>
        <details>
          <summary>Is HogHabits really free?</summary>
          <p>The starter plan is. The Pro plan adds unlimited habits and costs money we will absolutely use responsibly.</p>
        </details>
        <details>
          <summary>Can I track hedgehog-related habits?</summary>
          <p>We legally cannot stop you.</p>
        </details>
        <details>
          <summary>Is this a real product?</summary>
          <p>No — it&apos;s a lab app for learning PostHog. But don&apos;t let that stop your personal growth.</p>
        </details>
      </section>
    </>
  )
}
