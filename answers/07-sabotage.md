# Answer key — Lab 07 diagnosis drills

> ⚠️ **Spoilers for all twelve drills.** Open per-drill, only after
> your customer reply is written. Each entry: root cause → the evidence
> trail in the UI → the give-away → a model reply. Your reply doesn't
> need to match the model — it needs the same root cause, a fix, a doc
> link, and a tone you'd be happy to see quoted back.

---

## Drill 1 — "Our bill tripled, nothing changed"

**Root cause:** `posthog.identify()` placed in the component body of the
habits page, so it fires on *every render*, each time with a changing
`last_active` timestamp. A live "active now" ticker re-renders the page
several times a second, so every render becomes another event.

**Evidence trail:** Trends → total event count, breakdown by event name,
last 24h. [Health check][health-checks] threshold: `$identify` or `$set`
above ~5% of volume means something is wrong. Open a person and you'll
see dozens of them seconds apart, all on the same distinct_id.

**The event is `$set`, not `$identify`, and that surprise is the lesson.**
posthog-js only emits `$identify` when the distinct ID actually *changes*
from an anonymous one. Re-identifying a user who is already identified
falls through to `setPersonProperties`, which emits `$set`. There's a
second dedup behind that: identical properties are dropped with a console
note about a duplicate call. What defeats it here is the changing
timestamp, which makes every call look like new information. So a
customer who puts `last_active: Date.now()` in their identify properties
converts a harmless no-op into one event per render. Both layers of dedup
exist precisely to protect people from this, and a timestamp walks
straight through both.

**Give-away:** the events carry the *same* distinct_id over and over,
which is re-identification churn rather than new users. If you went
looking for `$identify` and found almost none, that's the trail, not a
dead end.

**Model reply:**
> Found it — your app calls `identify()` in the render path rather than
> once at login, so every re-render emits another event. That's the
> volume; nothing else changed. Two details worth knowing. The events are
> `$set` rather than `$identify`, because PostHog recognises the user is
> already identified and treats the call as a person-property update. And
> normally we'd dedupe identical property updates for you, but the
> `last_active` timestamp in the call makes each one look new, so it slips
> past that protection. Moving the call into your login handler fixes both
> immediately, and dropping the timestamp (person properties aren't a good
> place for one) means the dedupe protects you if it ever regresses:
> [identify best practices]
> (https://posthog.com/docs/product-analytics/identify#best-practices-when-using-identify).

---

## Drill 2 — "400k users, 3k customers"

**Root cause:** init code calls `identify('visitor-' + random)` on every
page load — every visit mints a brand-new "identified" person.

**Evidence trail:** People → Persons, sort newest: a wall of
`visitor-x7f3k2…` persons with a handful of events each and no email.
Trends on `$identify`: one per pageload.

**Give-away:** person count grows with *visits*, and the distinct_ids
are obviously generated (random suffixes, no stable key).

**Model reply:**
> Your user count is inflated because the site identifies every visit
> with a random ID (`visitor-<random>`), so each visit becomes a new
> "user" — PostHog is faithfully counting what it's told. The fix is to
> only call `identify()` when someone actually authenticates, using a
> stable ID like their account email or your DB user ID, and let
> anonymous visitors stay anonymous (they're cheaper, too). Docs:
> [identifying users](https://posthog.com/docs/product-analytics/identify).
> Your real number is the ~3k — once fixed, new data will reflect it.

---

## Drill 3 — "Backend and website events don't reconcile"

**Root cause:** the server captures all check-ins under a single service
identity (`distinctId: 'hoghabits-backend'`) instead of the acting
user's ID — so no user's timeline contains their own check-ins.

**Evidence trail:** open a person you know checked in → no
`habit_checked_in` on their timeline. Search Persons for where the event
went → one person named `hoghabits-backend` owns *all* of them.

**Give-away:** a single person with thousands of events from `$lib:
posthog-node`, while real persons have the client half of the journey
only.

**Model reply:**
> Your events are all arriving — they're just landing on the wrong
> person. Server-side captures pass `distinctId: 'hoghabits-backend'`
> (a service account) instead of the acting user's ID, so check-ins
> pile up on one synthetic person instead of the people doing them. If
> the backend passes the same ID the browser identifies with (the
> user's email/ID), both halves stitch into one timeline. Docs:
> [server-side capture](https://posthog.com/docs/libraries/node). The
> historical events can't be re-attributed, so worth fixing soon.

---

## Drill 4 — "$groupidentify is half our volume"

**Root cause:** `posthog.group()` with properties in the habits page
component body — a `$groupidentify` per render.

**Evidence trail:** Trends breakdown by event name confirms the share.
The [health check][health-checks] has the exact SQL for finding sessions with
duplicate `$groupidentify` (>1 per session = wrong). Threshold: >5% of
volume.

**Give-away:** the group properties being "updated" every few seconds
are identical except a timestamp — nothing is actually changing.

**Model reply:**
> The `$groupidentify` flood comes from calling `posthog.group()` with
> properties on every page render — it only needs to run once per
> session, or when the group's properties genuinely change. Since the
> group is already remembered for the session, the per-render calls
> add volume without adding information. One-line move into your login
> flow: [group analytics docs]
> (https://posthog.com/docs/product-analytics/group-analytics#how-to-create-groups).

---

## Drill 5 — "Group analytics shows nothing"

**Root cause:** none of the three group wires exist: no client
`group()` at signup, no server `groupIdentify()`, no per-event `groups`
on server captures.

**Evidence trail:** on your free-tier project you can't open the Groups
tab, so diagnose it the way that works on any plan: Activity → open any
recent event → no `$group_0` or `$groups` in its properties. Compare
against a healed run, where the same events carry the workspace. Also
check Data management → Properties for whether the group type was ever
seen at all, and confirm no `$groupidentify` events exist.

This is the better habit anyway. On a paying customer's project the
Groups tab tells you the outcome ("empty") but not the cause, and the
cause is always in the events.

**Give-away:** *zero* events carry group information, so this isn't
partial breakage, the calls were never made. ([Health check][health-checks]:
the classic "paying for group analytics but not using it" indicator.)

**The distinction to get right before replying:** an empty Groups tab has
two very different causes. Either the customer has the add-on and no
instrumentation, which is this drill and a support fix, or they have
instrumentation and no add-on, which is a billing conversation and not a
bug. The events tell you which: group data present means they're
instrumented and need the add-on enabled; group data absent means the
code never ran. Diagnosing the second as the first is how you end up
telling a customer to write code they don't need.

**Model reply:**
> Group analytics is enabled on the account but the SDKs are never told
> about groups, so there's nothing for the workspace view to show. It
> needs two small additions: `posthog.group('workspace', <id>)` in the
> browser when a user logs in, and a `groups:` field on your
> server-side captures (the server SDK doesn't remember groups between
> requests). Here's the guide:
> [group analytics](https://posthog.com/docs/product-analytics/group-analytics).
> Happy to pair on it — it's ~20 minutes — and afterwards the
> company-level questions you asked about become one-click breakdowns.

---

## Drill 6 — "Volume fell off a cliff after our consent update"

**Root cause:** init sets `opt_out_capturing_by_default: true`, and the
re-consent code checks `localStorage` for `'accept'` — but the banner
stores `'accepted'`. The strings never match; nobody is ever opted in.

**Evidence trail:** private window → accept the banner → click around →
Network tab: *no* PostHog requests at all. Activity: nothing new
arrives. Then read the consent path slowly: what the banner writes vs
what init reads.

**Give-away:** total silence from new visitors *even after accepting* —
a working opt-out setup would still capture the accepters.

**Model reply:**
> Found it, and it's subtle: your new consent code initialises PostHog
> opted-out (correct) and re-opts users in by checking for a stored
> `'accept'` value — but the banner saves `'accepted'`. The strings
> never match, so no visitor is ever opted back in, including the ones
> who consent. One-word fix, and worth adding a test that asserts an
> accepted visitor produces events. Also worth a look for the longer
> term: [cookieless tracking](https://posthog.com/tutorials/cookieless-tracking)
> avoids the banner race entirely for analytics. The missing weeks of
> data unfortunately can't be recovered — flagging that so you can
> annotate dashboards.

---

## Drill 7 — "The event feed is just noise"

**Root cause:** nothing is *broken* — autocapture is on and all custom
events were removed. There's data, but no meaning: no named events, no
actions, nothing a funnel can be built from.

**Evidence trail:** Activity: ~100% `$autocapture`/`$pageview`. Data
management → Actions: zero. Try building the Lab 03 funnel: there are
no events to select. Per the
[basic implementation review][foundation-check], customers with
autocapture and no actions "often aren't using PostHog effectively."

**Give-away:** the absence — this drill is diagnosed by what's missing,
which is why it's easy to walk past.

**Model reply:**
> Nothing's misconfigured — what's missing is a layer of meaning on top
> of the raw capture. Right now everything arrives as autocapture
> ("clicked a button") with no named events or actions ("started a
> trial"), so there's nothing to build funnels or dashboards from. Two
> cheap wins: define Actions on your key clicks (retroactive — they
> apply to data you already have), and add custom events at your 3–4
> moments of truth (signup, activation, conversion). I'd start with
> [the event tracking guide](https://posthog.com/tutorials/event-tracking-guide)
> — happy to workshop your event schema on a call; it's ~5 events, not
> 50.

---

## Drill 8 — "Our 80/20 split isn't 80/20"

**Root cause (of the data):** exposure events whose observed split is
~65/35 against a configured 80/20, plus a cohort of users exposed to
*both* variants — the signature of the flag being evaluated with
different distinct_ids for the same human (before vs after identify,
or across devices), then merged.

**Evidence trail:** the experiment's own results view shows the exposure
counts per variant, and they won't be 80/20. Then confirm it independently
in Trends → `$feature_flag_called`, filter
`$feature_flag = upgrade-cta-copy`, breakdown by
`$feature_flag_response`, unique users. Then the tell: find persons with
**two distinct** `$feature_flag_response` values (HogQL or a quick
breakdown per person) — every 8th sim user has both.

Worth knowing why both views are named. Experiment results only count
events inside the experiment's run window, so an exposure timestamped
before you launched is invisible there while showing up perfectly in
Trends. On a real account that asymmetry explains a lot of "the numbers
don't match" confusion: the experiment view and an insight over the same
event can legitimately disagree, and the difference is usually the window.

**Give-away:** double-exposed users. A healthy experiment has (almost)
none; identity-timing bugs produce them in batches.

**Model reply:**
> Your allocation isn't broken — the flag is being evaluated before
> users are identified. A visitor gets bucketed anonymously (one ID),
> then identified (another ID), and post-merge some users carry
> exposures to *both* variants; aggregate that and the observed split
> drifts from the configured 80/20. We found a batch of users with two
> variant exposures, which is the fingerprint. Fixes: evaluate the flag
> after identify (or bootstrap flags server-side so IDs are consistent),
> and consider the experiment's handling for multi-variant users
> ("exclude" is the safe default). Docs: [experiment exposures]
> (https://posthog.com/docs/experiments/exposures).

---

## Drill 9 — "Ad blockers eat a third of our traffic"

**Root cause:** no reverse proxy — the SDK sends directly to
`us.i.posthog.com` (or EU), which ad-blocker lists block.

**Evidence trail:** the [basic implementation review][foundation-check]
procedure: open a session replay → Activity → Inspector → **Doctor** →
search `config` → expand
`api_host` → it's a `*.i.posthog.com` domain, not the customer's. (No
replay? `?__posthog_debug=true` + `posthog.config` in the console.)

**Give-away:** `api_host` pointing at PostHog's domain is the entire
diagnosis. The agency's ~30% number is plausible for a technical
audience.

**Model reply:**
> The audit is right, and it's fixable: your SDK sends events directly
> to PostHog's domain, which most ad blockers block on sight. Routing
> events through your own domain with a reverse proxy makes the traffic
> first-party — for Next.js it's a few lines of rewrites config, and we
> also offer a [managed reverse proxy]
> (https://posthog.com/docs/advanced/proxy/managed-reverse-proxy) if
> you'd rather not run it. Setup guide:
> [proxy docs](https://posthog.com/docs/advanced/proxy). Expect a
> visible step up in captured traffic once it ships — worth annotating
> in PostHog so the jump doesn't read as organic growth.

---

## Drill 10 — "We hit bugs you fixed ages ago"

**Root cause:** `posthog-js` pinned to `1.200.0` — many months of
fixes, features, and default improvements behind.

**Evidence trail:** Activity → Configure columns → add **Library** and
**Library Version** → `1.200.0` everywhere. Compare with the latest
release on the posthog-js GitHub. [Health check][health-checks] bar: the SDK
carrying most volume shouldn't be >3 months behind; monthly updates
are the habit to encourage.

**Give-away:** `$lib_version` on any event. Thirty seconds, once you
know to look.

**Model reply:**
> You're on posthog-js 1.200.0 — the fixes you're hitting shipped in
> later releases, so this is a version gap rather than a rollout
> question. We'd suggest updating to latest (changelog attached) and
> then adopting a monthly SDK-bump habit — outdated SDKs quietly miss
> fixes, performance work, and newer defaults. One heads-up: check the
> [changelog](https://github.com/PostHog/posthog-js/blob/main/packages/browser/CHANGELOG.md)
> for notes between your pin and latest before the jump; happy to
> sanity-check the diff with you.

---

## Drill 11 — "Only one pageview per visit"

**Root cause:** the init config lost its `defaults` option — the
old-snippet behaviour captures `$pageview` only on full page loads, and
an App Router app navigates via the history API, so in-app navigation
produces nothing.

**Evidence trail:** click Home → Habits → Upgrade, then Activity: one
`$pageview` (the initial load). Hard-reload each page: pageviews for
each. Compare the running config (`posthog.config` in console, or the
code) against the current docs snippet — `defaults` is missing.

**Give-away:** pageviews correlate with *reloads*, not *navigation* —
the SPA signature.

**Model reply:**
> Your site is a single-page app: after the first load, navigation
> happens via the history API without full page loads, and your PostHog
> snippet predates SPA-aware pageview capture — so only that first load
> registers. Current posthog-js handles this automatically when
> initialised with the `defaults` option from the modern snippet
> ([config docs](https://posthog.com/docs/libraries/js/config)); one
> config addition and history-API navigations produce pageviews. Your
> traffic didn't change — your measurement did, so expect pageview
> counts to step up when this ships (worth an annotation).

---

## Drill 12 — "Our personal API key is in the JS bundle"

**Root cause:** a personal API key (`phx_…`) sitting in a client component
and used in a browser-side fetch. Anything a client component references
is compiled into the JavaScript sent to every visitor.

**Evidence trail:** DevTools → Sources → search all files for `phx_`. It's
in a `.next/static/chunks/…` file, which is the shipped bundle. That
evidence is unconditional: it's there whether or not the app ever sends
the key anywhere, and it's what the researcher would have found.

The page does also make a request carrying the key, and watching it leave
is a satisfying confirmation. It's the weaker evidence though, because it
only appears if the request actually fires. Leftover DevTools request
blocking from an earlier drill will suppress it, since a pattern like
`*/flags*` also matches `feature_flags`, and the code swallows the error,
so nothing tells you the request never happened. When you have two ways to
prove something, prefer the one that can't be silently switched off.

**Two leak routes, and the second is the trap.** Here the key is a literal
in the component. The Next.js-specific version is prefixing a secret with
`NEXT_PUBLIC_`, which tells the bundler to inline it into client code. That
matters because the obvious fix, "move it out of the code into an
environment variable", achieves nothing if the variable keeps that prefix.
The fix is that the key must never reach the browser at all: keep it in
server-only env and make the call from an API route.

(The value in this drill is a stand-in, not a real key, so the exercise
doesn't expose anything of yours.)

**Give-away:** the key prefix. `phc_` (project key) is public by design
— ingest-only, can't read anything. `phx_` (personal key) can read and
*change* the project with the key-owner's permissions. The severity
question is entirely "which prefix?"

**Model reply:**
> The researcher is right and this one's worth acting on today. Two
> different keys are in play: the `phc_` project key is public by
> design (ingest-only — fine in the browser), but what's in your bundle
> is a `phx_` *personal* API key, which can read and modify your
> PostHog project with the owner's permissions. Please [rotate it now]
> (https://posthog.com/docs/api#private-endpoint-authentication)
> (Settings → Personal API keys), then move the server-side call that
> needed it into an API route where the key stays in server env — the
> `NEXT_PUBLIC_` prefix is what inlined it into the client bundle.
> We can also scope the replacement key to only the permissions that
> call needs.

---

## Pattern debrief (read after all twelve)

Four moves solved almost everything:

1. **Breakdown by event name** — drills 1, 4, 7 (volume anomalies)
2. **Open the person / follow the distinct_id** — 2, 3, 8 (identity)
3. **Doctor / config inspection** — 9, 11, 12 (integration config)
4. **Reproduce as the affected user** — 6, plus every drill whose note
   tells you to clear state before looking

And every good reply had the same skeleton: *here's what's happening,
here's why it's an easy mistake to make, here's the one-line fix, here's
the doc, here's what history can/can't be recovered.* No blame, no
defensiveness — reread the tone section in the
[health check][health-checks]; it's the best writing in the handbook on
this.

[health-checks]: https://posthog.com/handbook/cs-and-onboarding/health-checks
[foundation-check]: https://posthog.com/handbook/cs-and-onboarding/foundation-check
