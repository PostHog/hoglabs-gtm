# Troubleshooting — Next.js quirks that are NOT PostHog problems

The lab app is a Next.js App Router app because that's what customers
actually run. The price is a handful of framework behaviours that look
like PostHog bugs and aren't. Check here before debugging analytics.

## Events fire twice in dev

**React StrictMode** double-invokes component renders and effects in
development to surface unsafe code. If you put a `capture()` in a
`useEffect`, you'll see it twice locally — and once in production.

- Not a bug. Don't "fix" it by removing StrictMode.
- The deeper lesson: capture in **event handlers** (where the user
  acted), not in effects that react to state. Handler captures don't
  double-fire.

## `ReferenceError: posthog is not defined`

Almost always a missing import in the file that makes the call. Add this
alongside the file's other imports:

```js
import posthog from 'posthog-js'
```

`instrumentation-client.js` initialises the SDK once for the whole app,
but it does not put `posthog` in scope in other modules. Every file that
calls `posthog.anything()` imports it separately. The error appears when
the handler runs rather than at page load, so the page renders fine and
then throws on click.

Less often, but check these if the import is already there:

- `'use client'` missing at the top of a component that uses posthog-js.
  Server components can't touch browser SDKs.
- The React hooks (`useFeatureFlagEnabled` and friends) throw a different
  error about a missing provider. They need the `PostHogProvider` from
  Lab 05 mounted in `app/providers.jsx`. Plain `posthog.capture()` in a
  client component works without it.

## Changed `.env.local` (or `next.config.js`, or `instrumentation-client.js`) and nothing happened

All three are read at **server start**, not hot-reloaded. Stop and
rerun `npm run dev`. This bites everyone at least twice.

## Hydration mismatch warnings

The app reads `localStorage` (auth, habits) — which doesn't exist
during server rendering. That's why components read it inside
`useEffect` after mount. If you add UI that reads storage during
render, you'll get hydration warnings: move the read into an effect.
Nothing to do with PostHog.

## No events at all

In rough order of likelihood:

1. `.env.local` doesn't exist or still has placeholder values (then:
   restart dev — see above).
2. Wrong key: you pasted the `phx_` personal key where the `phc_`
   project key goes.
3. An ad blocker on your own browser is eating the requests —
   check the Network tab for blocked `/e/` or `/ingest/` calls.
   (Congratulations, you've just reproduced drill 11 by accident.)
4. You opted yourself out earlier (cookie banner → Decline persists in
   PostHog's storage). Clear site data for localhost or use
   `posthog.opt_in_capturing()` in the console.
5. You're in the private window from Lab 02 with... any of the above.

## `[PostHog.js] Bad HTTP status: 404` with a wall of Next.js HTML

Your `api_host` points at the proxy path but the proxy isn't running, so
PostHog's requests hit Next.js as ordinary routes and get the 404 page
back. The giveaway is `/ingest` in the failing URL, or `"c":["","ingest",
"flags",...]` buried in the HTML.

The reverse proxy needs **two files to agree**, and there is nothing to
warn you when they don't:

- `instrumentation-client.js` must have `api_host: '/ingest'`
- `next.config.js` must have its `rewrites()` block **uncommented**

Set the first without the second and every event, flag check, and replay
upload 404s. Check both, and remember `next.config.js` is only read at
server start, so restart `npm run dev` after changing it.

Fastest fix if you're partway through Lab 08: `node
sabotage/sabotage.js heal` rewrites the whole reference set consistently.
To go back to no proxy at all, set `api_host` to your
`NEXT_PUBLIC_POSTHOG_HOST` and leave the rewrites commented.

## After a `git pull`, PostHog requests start failing

Same cause as above, reached a different way. If you pull changes while
your app is in a drill or reference state, git can merge one file from
your side and another from the incoming side, leaving `api_host` and the
rewrites disagreeing. Nothing is broken permanently: `heal` (or `restore`,
if you want your own lab work back) writes a complete consistent set and
undoes the mixing. Do that after any pull that touched `app-hoghabits/`.

## No Groups tab, or group breakdowns aren't offered

Not a bug and nothing to fix. Group analytics is a
[paid add-on](https://posthog.com/docs/product-analytics/group-analytics)
and these labs run on a free-tier project. Your `posthog.group()` and
`groupIdentify()` calls still run and the group still lands on your
events as a property, because billing starts when you enable the add-on
rather than when you deploy the code. What's gated is the group-level
analysis: the Groups tab, group breakdowns, group filters.

Verify at the event level instead. Activity, open an event, look for
`$group_0` or `$groups` in its properties. Lab 02 step 3 and Lab 03's
breakdown step both explain the free-tier path.

## Events arrive but the UI shows nothing yet

Ingestion isn't instant — Activity typically shows events within
seconds, but insights can lag a minute or two behind. Get coffee
before filing a bug against yourself.

## `npm run dev` port already in use

An earlier dev server is still running (maybe from before a
`sabotage.js` apply). `lsof -ti:3000 | xargs kill` and rerun.

## After `sabotage.js` apply/heal, the app behaves like before

Restart `npm run dev` — the runner changes files (sometimes
`package.json`), and dev servers don't always pick everything up,
especially `instrumentation-client.js` and config changes.

## Node version errors on `npm install`

Next 16 needs Node 18.18+. `node -v`, and if you use a version
manager, `nvm use 20` (or similar) before installing.
