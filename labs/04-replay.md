# Lab 04: Session replay (~35 min)

> Replay can't be simulated, so everything in this lab uses your own real
> sessions. That's a feature: you'll generate the exact frustration
> signal you then find in the tool.

## Why a customer cares

Numbers say *what* happened, and replay shows *why*. The funnel says 40%
drop at step 2, and the replay shows them hunting for a button that's
below the fold. Replay is also PostHog's most emotionally persuasive
demo, since watching a real user struggle sells itself, while being its
most common source of cost and privacy questions. A CSM needs both
halves, the wow and the settings page.

## 1. Turn it on and read the settings

Go to **Project settings → Session replay** and enable recording. Before
you leave the page, actually read it.

Masking: input masking is on by default, and note the options for masking
all text versus inputs only. For a fintech or health customer this page
is the first conversation rather than an afterthought.

Minimum duration: set it to 2 seconds. The [health check][health-checks]
recommends at least this, because every recording counts toward the 5K
free allowance and toward billing on paid accounts, and sub-2-second
bounces are billable noise.

Sampling and conditional recording (by feature flag or URL): know these
exist, because they're the cost-control levers for high-traffic
customers.

## 2. Record a session

In the app, in a regular window rather than a private one so it's one
clean session:

1. Land on `/` and browse a little.
2. Go to Habits, write something in Notes, and click **Save notes**. It
   ignores you. Click it again. And again. It swallows the first three
   clicks, because it's broken on purpose. Be honest about your
   irritation, since that's the point.
3. Create a habit, check in, sign up if you weren't, and visit Upgrade.
4. Fill in the signup form fields while you're at it, because you'll
   check masking against exactly this.

Wait a minute or two, then open **Session replay** in PostHog.

## 3. Watch the recording

Open your recording and work through four things.

The rage-click: the activity timeline flags it as `$rageclick`, so jump
straight there. This is the workflow for "users say the checkout is
broken": filter recordings by rageclick, watch three, know the answer.

The masking check: scrub to your signup form typing. The email field
should show masked input, so confirm it. That screenshot-able moment is
your answer to "does replay see passwords?"

The Inspector's Doctor tab, reached via Activity or Inspector on the
recording: search `config` and expand `api_host`. Right now it shows your
direct PostHog host, either `us.i.posthog.com` or the EU equivalent.
Remember this exact click-path, because the
[basic implementation review][foundation-check] uses it to check whether
a customer has a reverse proxy, and so will you in the drills.

Network and console capture: note the recording includes console logs and
network timing, which is the debugging context most customers don't
realize they're getting.

## 4. Filter recordings

In the replay list, filter by recordings containing a rageclick, then by
person property `email` equals your fake signup email. Two filters, and
you found one specific user's bad moment among everything else. That's
the skill, and it transfers to any account.

## 5. Do it again via MCP

- *"List session recordings from today that contain a rage click."*
- *"Summarize what happened in my most recent session recording."*

## Done when

- [ ] Replay enabled with a 2s minimum duration, and you know the other levers
- [ ] Your rage-click found via the timeline flag
- [ ] Masking verified on your own typed input
- [ ] Doctor and api_host path performed, and memorized
- [ ] MCP surfaced your recording

Next: [Lab 05, feature flags](05-flags.md)

[health-checks]: https://posthog.com/handbook/cs-and-onboarding/health-checks
[foundation-check]: https://posthog.com/handbook/cs-and-onboarding/foundation-check
