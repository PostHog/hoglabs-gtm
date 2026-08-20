# Lab 05: Feature flags (~80 min)

## Why a customer cares

Flags are where PostHog stops being a rear-view mirror and starts
controlling the product: ship dark, roll out gradually, kill a bad
release in one click, target a beta to twenty accounts. They're also
where a bad integration can break the customer's app, which is why
the [health check][health-checks] has a whole resilience section, and why this lab
spends as much time on failure modes as on the happy path.

## 1. Create the flag

Go to **Feature flags → New feature flag**:

- Key: **`annual-offer`**
- Release condition: 100% of users, no property filters for now
- Save, and note the flag's state: enabled, boolean, serving `true`.

## 2. The provider

The React hooks need a provider. Open `app/providers.jsx` (LAB 05 marker)
and replace the passthrough:

```jsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

export default function Providers({ children }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

The nuance that matters: `client={posthog}` hands the provider the
already-initialised client from `instrumentation-client.js`. The provider
must never initialise its own. Double-init, meaning a provider given an
`apiKey` prop while instrumentation-client.js also runs, is a real
customer bug with confusing symptoms, since events get sent under two
configs.

## 3. Gate the UI with the hook

In `app/upgrade/page.jsx` (LAB 05 marker), replace the hardcoded `false`:

```jsx
import { useFeatureFlagEnabled } from 'posthog-js/react'
// inside the component:
const annualOfferEnabled = useFeatureFlagEnabled('annual-offer')
```

Reload `/upgrade` and the annual-billing banner appears, maybe after a
blink. That blink is flags arriving over the network, and it's load-order
material for the drills.

**You will probably also get a hydration error in the console**, saying
the server-rendered HTML didn't match the client. That's not a mistake on
your part, it's the single most common real problem with flags in a
server-rendered app, and it's worth understanding before you fix it.

This page is a client component that Next.js still renders on the server
first. The server has no flags: no cookies, no localStorage, no `/flags`
call. So the server renders the page *without* the banner. Then the
browser hydrates, and posthog-js may already know the flag value from its
local cache, so the client's first render includes the banner. React
compares the two, finds a `<p>` where it expected a `<button>`, and
throws.

The fix is to make flag-dependent UI wait for hydration:

```jsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
```

Then gate the banner on it: `{mounted && annualOfferEnabled && (...)}`.
`useState(false)` guarantees the first client render matches the server
exactly, so there's nothing to mismatch.

Notice what you traded, because this is the part that matters on a call.
The hydration error is gone, but now the banner visibly pops in after the
page paints. You've converted a crash into a flicker. Step 7 is about
removing the flicker too, and this is why that step exists.

Why the hook and not `posthog.isFeatureEnabled()` at render time: the
hook subscribes, so it re-renders when flags finish loading and handles
the race for you. A synchronous read at first paint sees `undefined` and
never looks again, which is a real cause of "the flag never showed for
some users".

Also know that while flags load, the hook returns `undefined`, and
`undefined` is not `false`. "Flag not loaded", "flag off", and "flag
errored" are three states customers regularly collapse into one, and the
flags best-practices doc is explicit about falling back to *working code*
in all of them.

## 4. Targeting

Edit the flag to release to the person property `email contains
hoghabits.test` only, at 100%. Log in as a matching user and you get the
banner. Log out, browse anonymously, and you don't, because anonymous you
doesn't match.

This is the mechanic behind beta programs and staged enterprise
rollouts, since "can we enable it just for Acme?" is literally this
screen. Note the caveat that will bite in drill-land: targeting on person
properties only works if those properties exist *before* the flag is
evaluated, and a flag evaluated pre-identify sees an anonymous stranger.

Set it back to 100% with no filters before moving on.

## 5. Local evaluation

In `app/api/flags/route.js`, the LAB 05 marker sits **inside** the `GET`
function. Replace the placeholder return with the real thing, so the
whole function reads:

```js
export async function GET(request) {
  const email = new URL(request.url).searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'email query param is required' }, { status: 400 })
  }

  const posthog = getPostHogServer()
  const flags = await posthog.getAllFlags(email, { onlyEvaluateLocally: true })
  return NextResponse.json({ flags })
}
```

Inside `GET` matters. `email` is read from the request in that function,
so at the top of the file it isn't in scope and the module throws
`ReferenceError: email is not defined` before the route can run.

And in `lib/posthog-server.js`, add the personal API key to the client
options, since this is what it's for:

```js
personalApiKey: process.env.POSTHOG_PERSONAL_API_KEY,
```

Restart, then run
`curl "http://localhost:3000/api/flags?email=you@hoghabits.test"`.

What just happened: posthog-node fetched all flag *definitions* once
using the `phx_` key, and now evaluates any user against them in-process,
with no network round-trip per user. Three facts worth taking into a customer conversation follow.

Resilience: definitions are cached, so flags keep answering through a
flags-endpoint outage, which is the production answer to a page that
breaks when flag requests fail.

Billing: local evaluation is billed differently from per-request flag
calls, since it's request-cheap by design. This shows up in cost
conversations with high-traffic flag users.

Limits: flags that depend on server-side data (cohorts, some property
types) can't always evaluate locally, and definitions refresh on a poll
interval that defaults to 30s, so changes aren't instant.

## 6. The reverse proxy

Ad blockers block `*.i.posthog.com`, and they don't block your domain.

**Both edits are required, and doing one without the other breaks all
ingestion.** Point `api_host` at `/ingest` without a proxy behind it and
every event, flag check, and replay upload 404s against Next.js. So do
these together:

1. In `next.config.js`, uncomment the rewrites block at the LAB 05 and
   DRILL 9 marker, swapping `us` for `eu` if your project is in the EU.
2. In `instrumentation-client.js`:

```js
api_host: '/ingest',
ui_host: 'https://us.posthog.com',  // your region's UI host
```

3. Restart `npm run dev`. `next.config.js` is only read at server start,
   so an un-restarted server serves the old config and looks like the
   proxy silently doesn't work.

Then verify, and check for the failure before you check for success. Open
the console: if you see `[PostHog.js] Bad HTTP status: 404` you have
`api_host` set with no proxy behind it, so revisit step 1 and the restart.
If it's quiet, look at the network tab: requests go to
`localhost:3000/ingest/...`, and via the replay Doctor trick from Lab 04,
`api_host` now shows *your* domain. That before-and-after is exactly how
the [basic implementation review][foundation-check] tells you to check any
customer.

Worth keeping: this two-places-must-agree shape is why proxy setups are a
common support topic. A customer who changed `api_host` and shipped
without the server-side rewrite sees total ingestion loss that looks like
PostHog being down.

## 7. Bootstrapping

Both problems from step 3, the hydration error and the flicker you traded
it for, have one root cause: the server doesn't know the flag values. The
production fix is bootstrapping. The server evaluates flags, which it can
do locally per step 5, and embeds the values in the page it sends, so the
client's very first render already knows and matches. No mismatch, no
pop-in, and no `mounted` gate needed.

Read the
[bootstrapping docs](https://posthog.com/docs/feature-flags/bootstrapping);
implementing it here is optional stretch work. Two things are worth
carrying to a call. It's the answer to both "our page flashes the wrong
content" and "we get React hydration errors after adding flags", which
customers report as separate bugs. And PostHog has a pre-release
`@posthog/next` package that does server-side bootstrapping for you, so
check whether it has shipped before advising anyone to hand-roll it.

## 8. Do it again via MCP

- *"List the feature flags in this project and their rollout state."*
- *"Create a feature flag called beta-leaderboard, off by default."*
- *"Which users had annual-offer evaluate to true today?"*

## Done when

- [ ] Flag gates the banner via the hook, and you can explain hook versus
      sync read
- [ ] Targeting by person property demonstrated both ways
- [ ] Local evaluation returns flags via curl, three facts internalized
- [ ] Proxy live and verified via both the network tab and Doctor
- [ ] MCP created a flag

Next: [Lab 06, experiments](06-experiments.md)

[health-checks]: https://posthog.com/handbook/cs-and-onboarding/health-checks
[foundation-check]: https://posthog.com/handbook/cs-and-onboarding/foundation-check
