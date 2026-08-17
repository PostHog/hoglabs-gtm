# Lab 01: Instrument from zero (~80 min)

## Why a customer cares

Everything PostHog does, every insight and replay and flag and
experiment, stands on events arriving correctly. Most implementation
problems you'll ever diagnose for customers were born in the twenty
minutes someone spent doing what you're about to do. Do it once with
your own hands and "signs of poor implementation" stops being a
checklist and becomes pattern recognition.

## 1. Initialise the client SDK

Open `instrumentation-client.js` (app root, where the LAB 01 marker is
waiting). This file is the official home for client-side init in a
Next.js App Router app (15.3+), because Next runs it once in the browser
before the app hydrates. Write:

```js
import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
  debug: process.env.NODE_ENV === 'development',
})
```

Restart `npm run dev`, since env and instrumentation files are read at
start.

Three things worth understanding rather than just typing:

`defaults: '2026-01-30'` pins the modern behaviour bundle. The part
you'll care about most is that `$pageview` fires on client-side route
changes via the history API. This app navigates like an SPA, so without
`defaults` you'd get one pageview per hard reload and nothing else.
Customers who integrated years ago and never revisited their snippet
live in that world. Remember this.

`debug: true` in dev logs every capture to the browser console, which is
your ground truth for the whole lab.

The key comes from env, never hardcoded. The `NEXT_PUBLIC_` prefix is a
*Next.js* mechanism meaning "expose to the browser", which is fine for
the `phc_` project key and catastrophic for anything secret.

## 2. Verify in PostHog

Browse the app for a minute (landing, then signup, then habits), then in
PostHog open **Activity**. You should see:

- `$pageview` events, including ones for in-app navigations rather than
  only reloads. Click one and check `$pathname`.
- `$autocapture` events for your clicks. Open one and look at the
  element chain. This is what autocapture gives you for free, and also
  why it gets noisy: the event is named after DOM structure, not intent.
- `$pageleave`, and maybe `$rageclick` if the Save button already got to
  you.

Watch for the double-fire. In dev, React StrictMode mounts components
twice, so you may see some events duplicated. Production doesn't do
this, but "why is my dev volume double?" is a real ticket you now know
the answer to.

## 3. Anonymous events

In Activity, note the `distinct_id` on your events. It's a random
string, and that's you, anonymous, with PostHog building a person from a
cookie. Anonymous events are also billed differently (more cheaply) than
identified ones, which is a fact that matters in cost conversations.
Lab 02 is entirely about what happens when this anonymous person gets a
name.

## 4. Custom events

Autocapture tells you *that* someone clicked. Custom events say *what it
meant*. Three LAB 01 markers are waiting.

First, though: every file that calls the SDK has to import it. Add this
line to each of the three files below, alongside their existing imports:

```js
import posthog from 'posthog-js'
```

`instrumentation-client.js` initialises PostHog once for the whole app,
but that doesn't put `posthog` in scope inside other modules. Miss the
import and you get `ReferenceError: posthog is not defined` at the moment
the handler runs rather than at page load, so the app looks fine until
someone clicks. Worth remembering: it's the same mistake customers make,
and it's why "it works on my machine" reports are often really "I never
clicked that button."

Now the three markers:

1. `app/habits/page.jsx`: in `addHabit`, capture **`habit_created`**
   with `{ habit_name, total_habits }`.
2. `components/InviteForm.jsx`: capture **`teammate_invited`** with
   `{ invitee_domain, workspace }`. Send the domain rather than the raw
   email, because properties shouldn't collect more PII than the
   question needs.
3. `app/upgrade/page.jsx`: in `handleUpgrade`, capture
   **`upgrade_clicked`**, your conversion event for Labs 03 and 06.

Conventions that pay off later: lowercase `snake_case`, verb in past
tense, named after intent (`habit_created`, not `Clicked add button`).
You'll feel why in Lab 03 when you build funnels from these names.

Notice these all go in the event handler where the action happens,
rather than in a `useEffect` watching state. Effect-based capture is
where double-fires and phantom events come from.

Trigger each one in the app, then confirm all three in Activity.

## 5. The server side

Check-ins hit `/api/checkin`, and the server should capture them,
because some truths (payments, background jobs) are only known to the
backend.

First, `lib/posthog-server.js`, where you build the singleton. The
marker explains why a singleton matters, which is batching:

```js
import { PostHog } from 'posthog-node'

let client = null

export function getPostHogServer() {
  if (!client) {
    client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,      // dev: send immediately
      flushInterval: 0,
    })
  }
  return client
}
```

Then `app/api/checkin/route.js`, where you capture
**`habit_checked_in`** with `{ habit, streak, source: 'api' }` and
`distinctId: email`.

The two rules of server-side capture, both future drill material.
`distinctId` is required, because there's no cookie to fall back on and
it must match what the browser will identify as. And events batch in
memory, so un-flushed events die with the process. `flushAt: 1` ducks
this in dev, and `shutdown()` handles it in production.

Do a check-in, then find `habit_checked_in` in Activity. Note `$lib`
says `posthog-node`, so the event came from your server.

## 6. The cookie banner

`components/CookieBanner.jsx` stores a consent choice. The
straightforward wiring is `posthog.opt_out_capturing()` on decline and
`opt_in_capturing()` on accept, so add it, plus the same
`import posthog from 'posthog-js'` line as step 4. Then read the
[cookieless tracking tutorial](https://posthog.com/tutorials/cookieless-tracking)
for what EU-heavy customers should do instead. The subtle ways this
wiring goes wrong feed one of the nastier drills.

## 7. Populate your project

Your own clicking can't produce retention curves. Now that *your*
instrumentation works, backfill a small synthetic population of about 40
users over 21 days and roughly 1k events, bounded and namespaced:

```bash
node scripts/simulate.js --dry-run   # see what it will send
node scripts/simulate.js             # send it
```

Note it emits the same event names you just implemented. If you named
yours differently, you've just experienced schema drift, the thing data
teams fight constantly. Fix yours to match.

## 8. Do it again via MCP

Ask your agent, which should be connected to `hoglab`:

- *"What events has this project received in the last hour, by name?"*
- *"Show me the properties of the most recent habit_checked_in event."*
- *"How many distinct users sent events today?"*

Same answers as the UI, without the clicking. This is how you'll answer
quick customer questions mid-call.

## Done when

- [ ] `$pageview` fires on in-app navigation, not just reloads, and you know why
- [ ] Three custom client events plus one server event verified in Activity
- [ ] You can explain the two server-side capture rules from memory
- [ ] `simulate.js` has run, and Activity shows `sim_user_*` traffic
- [ ] MCP answered the three questions above

Next: [Lab 02, identity](02-identity.md)
