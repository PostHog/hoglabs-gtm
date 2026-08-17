import './globals.css'
import Nav from '../components/Nav'
import CookieBanner from '../components/CookieBanner'
import Providers from './providers'

export const metadata = {
  title: 'HogHabits — team habit tracking',
  description: 'Build habits together. The B2B habit tracker nobody asked for.',
}

// Note for Lab 01: nothing PostHog-related belongs in this file.
// Client-side init lives in instrumentation-client.js at the app root.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Nav />
          <main>{children}</main>
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
