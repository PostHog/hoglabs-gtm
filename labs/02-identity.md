# Lab 02: Identity (~50 min)

## Why a customer cares

Identity is the highest-stakes part of any PostHog implementation. Get it
right and one human equals one person, with their whole journey attached,
across devices and across client and server. Get it wrong and you
inflate event bills, split users into fragments, or count 400k "users"
for 3k customers. More entries in the [health check][health-checks] trace back to
identity than to anything else, and this lab is where you earn the right
to debug it.

## 1. Watch a merge happen

Do this deliberately, in order, in a private browser window so you have
a clean slate:

1. Browse the landing page and FAQ for a bit. In PostHog **Activity**,
   find your `$pageview`s and note the random anonymous `distinct_id`.
2. Now wire the identify call. In `app/signup/page.jsx` (LAB 02 marker),
   after successful signup. Add `import posthog from 'posthog-js'` at the
   top of the file first, the same as in Lab 01, and do the same for
   `components/Nav.jsx` when you get to step 4:

```js
posthog.identify(email, { email, name })
```

3. Sign up in the app as, say, `you@hoghabits.test`.
4. In PostHog, open **Data → People → Persons** and find `you@hoghabits.test`.
   Look at their event timeline: your anonymous landing-page browsing is
   there, attached to the person, from before they signed up.

That retroactive stitching is the payoff of calling `identify()` at the
right moment, which is the moment you learn who someone is and, to a
first approximation, only then. It answers "which marketing pages did
this paying customer read before converting?", a question customers
assume is impossible.

The rules, worth reciting:

Where: signup and login. Not on every page, not on an interval, and not
in a render path. Drill 1 exists because customers do all three.

What id: something stable and unique, like an email or your DB user id.
Never a timestamp, never a random value (drill 2), never a
device-specific value.

Anonymous to identified is also a billing event, since identified events
cost more than anonymous ones. Over-identifying is literally
over-paying.

## 2. Server-side identify

In `app/api/signup/route.js` (LAB 02 marker), add the server-side
identify:

```js
const posthog = getPostHogServer()
posthog.identify({
  distinctId: email,
  properties: { email, name, workspace },
})
```

Note the different shape, an object rather than `(id, props)`, and the
deeper difference: there's no anonymous session to merge, because servers
don't have one. Server-side identify is for setting person properties
from things only the backend knows.

Sign up again with a new email. Check the person in PostHog: one person,
properties set, client and server events both on their timeline, because
both sides used the same distinct_id (the email). That agreement is the
entire trick, and drill 3 is what happens without it.

## 3. Groups

HogHabits is B2B, so the customer isn't Max, it's Max's workspace. Group
analytics answers "how many *companies* used this feature?", and it only
works if the SDKs are told about the group. Three wires, all needed.

**Read this before you start.** Group analytics is a
[paid add-on](https://posthog.com/docs/product-analytics/group-analytics),
so on your free-tier project you will not get the Groups tab, group
breakdowns, or group filters. You can still do every part of this
section, because the docs are explicit that "billing starts when you
enable group analytics from your billing page, not when you add group
analytics code to your application." The SDK calls run, the
`$groupidentify` events ingest, and the group lands on your events as a
property. What you can't do is the group-level *analysis*.

That split is worth knowing precisely, because it's the shape of a real
conversation. A customer can have perfect group instrumentation and an
empty Groups tab because they never bought the add-on, or the add-on and
no instrumentation (that's drill 5). Telling those two apart is the job,
and you do it by looking at the events rather than the tab.

First, client, in `app/signup/page.jsx`, after identify:

```js
posthog.group('workspace', workspace, { name: workspace })
```

From now on this browser's events carry the workspace group.

Second, server properties, in `app/api/signup/route.js`:

```js
posthog.groupIdentify({
  groupType: 'workspace',
  groupKey: workspace,
  properties: { name: workspace, plan: 'free' },
})
```

Third, server per-event, in `app/api/checkin/route.js`. posthog-node has
no memory between requests, so groups ride on each capture:

```js
posthog.capture({
  distinctId: email,
  event: 'habit_checked_in',
  properties: { habit, streak, source: 'api' },
  groups: workspace ? { workspace } : undefined,
})
```

The client already sends `workspace` in the fetch body, so check that.

Sign up and check in, then verify at the event level, which works on any
plan. In **Activity**, open your newest `habit_checked_in` and look at
its properties for `$group_0` (or a `$groups` entry) carrying your
workspace name. Do the same for a client-side event such as
`habit_created`, and confirm a `$groupidentify` event arrived when you
signed up. Three wires, three pieces of evidence.

If you want to see the Groups tab itself, that's what a customer with
the add-on gets: **Data → People → Groups**, one row per workspace, with
group-level insights and breakdowns. Have a teammate with a paid project
show you once, or look at a customer's project when you next have reason
to. You don't need it to finish this lab.

An empty Groups tab on a paying B2B account is a health-check item
precisely because one of these three wires is usually missing (drill 5).
Also worth knowing: group types are limited to five per project, so
customers must choose them deliberately.

## 4. Logout and reset()

`components/Nav.jsx` (LAB 02 marker), in `handleLogout`:

```js
posthog.capture('user_logged_out')  // BEFORE reset, or it belongs to a stranger
posthog.reset()
```

`reset()` throws away the identity and mints a fresh anonymous id. On a
shared computer that's essential, since otherwise the next user's events
pile onto the previous person. Anywhere else, though, whether on page
load or before identify or "to be safe", it shreds one human into many
anonymous fragments. The [health check][health-checks] calls this out,
and you'll meet its cousin in the drills.

Log out, browse, and check Activity: you're a fresh anonymous id. Log
back in by signing up again with the same email, and you're the same
person again.

## 5. Person properties, $set versus $set_once

Person properties are how customers segment: plan tier, signup source,
lifecycle stage. There are two ways to write them, and the difference
only becomes visible on the *second* write, so that's how we'll test it.

First you need the SDK reachable from the browser console. Add this to
the end of `instrumentation-client.js`:

```js
// Lab convenience: expose the SDK so we can poke at it from the console.
if (typeof window !== 'undefined') window.posthog = posthog
```

Why that's necessary here and not everywhere: this app imports posthog-js
as a module, which keeps it out of global scope. Sites installed with the
HTML snippet get `window.posthog` for free, which is why
[the basic implementation review][foundation-check] can tell you to open
a customer's site and type `posthog.config` in the console. Knowing which
install style a customer used tells you whether that trick is available
to you. It's also worth knowing this line is a lab convenience rather
than a practice to recommend, since exposing the SDK globally lets
anything on the page call it.

Restart `npm run dev`, reload the app while logged in, then run this in
the console:

```js
posthog.capture('prefs_updated', {
  $set: { theme: 'dark' },
  $set_once: { first_seen_plan: 'free' },
})
```

Now run it again with both values changed. This second call is the one
that teaches:

```js
posthog.capture('prefs_updated', {
  $set: { theme: 'light' },
  $set_once: { first_seen_plan: 'enterprise' },
})
```

Open your person in **Data → People → Persons** and look at the
properties. `theme` is now `light`, because `$set` overwrites. But
`first_seen_plan` is still `free`, because `$set_once` declined to touch
a property that already had a value. The `enterprise` you just sent was
silently ignored.

That's the whole distinction. Use `$set` for things that change over
time, like current plan or last-seen date. Use `$set_once` for things
that describe a beginning and must never drift, like signup source,
first plan, or acquisition campaign. A customer who uses `$set` where
they meant `$set_once` overwrites their own attribution data the first
time a user does anything, and they usually discover it months later when
a report stops making sense.

## 6. Do it again via MCP

- *"Find the person with email you@hoghabits.test and list their
  properties and most recent 10 events."*
- *"How many persons were created this week, and how many are identified
  versus anonymous?"*
- *"Show me recent events that carry a workspace group property."* Ask
  for the groups themselves and you'll hit the same add-on wall as the
  UI, which is a useful thing to have seen once.

## Done when

- [ ] You watched anonymous history merge into an identified person
- [ ] Client and server events land on the same person, and you can say why
- [ ] Client and server events both carry the workspace group, and you
      can explain why the Groups tab needs the paid add-on
- [ ] Logout resets, and you can explain what reset() misuse does
- [ ] MCP answered the identity questions

Next: [Lab 03, insights](03-insights.md)

[health-checks]: https://posthog.com/handbook/cs-and-onboarding/health-checks
[foundation-check]: https://posthog.com/handbook/cs-and-onboarding/foundation-check
