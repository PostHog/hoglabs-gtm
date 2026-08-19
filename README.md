# PostHog CSM labs

> ## The one rule
>
> These labs deliberately generate junk data and broken implementations.
> Everything runs against your own free-tier PostHog org, which Lab 00
> has you create and name `hoglab`. Never a customer's project. Never
> PostHog's internal project 2 (`🎉 PostHog App + Website`), which holds
> live production data. If you're ever unsure which project you're
> pointed at, stop and check.

## What this is

The [Learning PostHog](https://posthog.com/handbook/cs-and-onboarding/new-hire-onboarding#learning-posthog)
section of the handbook tells you *what* to know about each product and
hands you a reading list. This repo is the *how*. You instrument a
realistic app from zero, use every core product on data you created,
and then diagnose twelve real customer failure modes taken straight
out of [health-checks](https://posthog.com/handbook/cs-and-onboarding/health-checks)
and [foundation-check](https://posthog.com/handbook/cs-and-onboarding/foundation-check).
The failure modes get applied to your app without you seeing the change.

By the end you'll have a project you instrumented yourself and twelve
written customer replies, which become a snippet library for the real
tickets that rhyme with them.

## The path (~1.5 days)

| Lab | What | Time |
|---|---|---|
| [00](labs/00-setup.md) | Your own PostHog org (the customer path), app running, MCP wired | 45 min |
| [01](labs/01-instrument.md) | Instrument from zero: init, autocapture, custom and server events | 80 min |
| [02](labs/02-identity.md) | Identity: identify, the merge, groups, reset | 50 min |
| [03](labs/03-insights.md) | Insights: trends, funnels, retention, lifecycle, paths | 80 min |
| [04](labs/04-replay.md) | Session replay: rage-clicks, masking, cost levers, Doctor | 35 min |
| [05](labs/05-flags.md) | Feature flags: gating, targeting, local evaluation, proxy | 80 min |
| [06](labs/06-experiments.md) | Experiments: run one, read it honestly | 50 min |
| [07](labs/07-self-driving.md) | Self-driving: run the onboarding wizard, read what it turned on | 35 min |
| [08](labs/08-sabotage.md) | The diagnosis drills: 12 blind failure modes | 90 min+ |

Labs 00 to 02 are the foundation, so do them in order. Labs 03 to 07
can flex toward what your book uses. Lab 08 is the point of the whole
thing.

Timings are honest estimates for someone new to PostHog. Going deep is
better than going fast.

## Prerequisites

- Node 18.18+ (`node -v`)
- This repo, cloned or downloaded, either is fine
- A browser, a `@posthog.com` email, and no PostHog knowledge at all

## Quick start

```bash
git clone https://github.com/PostHog/onboarding-csm-lab.git
cd onboarding-csm-lab
# then open labs/00-setup.md and follow it
```

## Repo layout

```
app-hoghabits/    the app: a fake B2B habit tracker, ships UNinstrumented
labs/             the nine labs
answers/          answer keys (per-drill spoilers, read the rules)
notes/            your output: the twelve drill replies
sabotage/         the drill runner + encoded failure modes (don't peek)
scripts/          simulate.js, a bounded synthetic population (~1k events)
TROUBLESHOOTING.md  Next.js quirks that are NOT PostHog problems
```

## Honesty contract

Three things could spoil your own training: `sabotage/patches/` (which
is why it's encoded), `answers/08-sabotage.md`, and running `git diff`
during a drill. The drills only work if you sit in the not-knowing
until your customer reply is written. Nobody is checking up on you
here, but the customer conversations in month 2 will.

## Scope

Covered: implementation, product analytics, identity and persons and
groups, session replay, feature flags, experiments, self-driving,
billing basics, and MCP throughout.

Not covered as instrumentation: error tracking, LLM and AI observability,
surveys, data pipelines and CDP, logs, warehouse. The app carries hook
points for each, so they're straightforward to add if your book needs
them. Lab 07's wizard does turn some of these on as products, which is a
different thing from writing the code that feeds them.

## Found a problem?

Handbook rules apply here too: the person who finds the gap fixes it
for the next person. If a step is broken, a drill won't reproduce, or
a timing turns out to be fantasy, fix it or flag it.

The thing most likely to rot here is UI navigation paths. PostHog ships
constantly, so a "Settings → X → Y" instruction can be stale within
months while everything around it still works. If a path doesn't match
what you see, you've almost certainly found drift rather than made a
mistake: fix the path and move on.
