# Lab 03: Insights (~80 min)

> Needs the simulated population from Lab 01 (`node scripts/simulate.js`),
> because one person's clicks can't draw a retention curve.

## Why a customer cares

Events are cost, and insights are the value. A customer who captures
everything and analyses nothing is a churn risk with a big bill, and
"help me see X" is the most common genuinely technical ask you'll get.
This lab makes you fast at the six core insight types, on data whose
true shape you already know, since you generated it: 8 power users, 14
regulars, 10 churned, 8 who never activated. Knowing the right answer in
advance is the fastest way to learn whether you're reading a chart
correctly.

## 1. Filter out internal and test users

Your project contains you, from testing, and `sim_user_*`, which is
synthetic. A real customer project contains their employees, their
staging environment, and their test users. Every number is a lie until
those are handled.

1. Go to **Settings → Customization** and find the internal and test user
   filtering section. If it isn't there, append
   `/settings/project-product-analytics#internal-user-filtering` to your
   PostHog host, which jumps straight to it regardless of where the nav
   has moved it to.
2. Add a filter: person property `email` does not contain
   `hoghabits.test`, or `is_simulated is not set`. Look at both, pick
   one, and note that it only applies to insights where the "filter out
   internal and test users" toggle is on, not globally.
3. For this lab you usually want the simulated users in, since they're
   your dataset. The point is knowing the mechanism and its default.


## 2. Actions

**Data management → Actions → New action.** Create the action "Clicked
upgrade CTA" from the autocaptured click on the upgrade button, using
"select element on site" via the toolbar if you enabled it, or matching
by element and text.

Why this matters beyond tidiness: the
[basic implementation review][foundation-check] treats "autocapture on,
zero actions defined" as a red flag, because it means the customer is
paying for events they've given no meaning to. Actions
are also retroactive, since they match *historical* autocapture, so a
customer can name things after the fact. That retroactivity is a
genuinely loved feature, so mention it on calls.

## 3. Trends

**New insight → Trends.**

Start with `habit_checked_in`, unique users, last 21 days, daily. See
the shape, where your power users' plateau and the churn decay are both
visible.

Add a breakdown. Breaking down *by group* is the natural B2B move
("which workspace is healthiest?"), but that needs the paid group
analytics add-on, so on free tier break down by the **person property**
`workspace` instead. That property exists because the server-side
identify you wired in Lab 02 sets it, and the simulator does the same for
its users. You get the same per-workspace comparison from a person
property rather than a group.

Worth holding onto: this is the workaround you'd offer a customer who
wants company-level numbers but isn't ready to buy the add-on. It covers
breakdowns and filters, and it stops working the moment they want
group-level aggregation, properties that live on the company rather than
on each person, or a company whose members change over time (person
properties follow the person, so someone who switches employers carries
the old value until something overwrites it). That boundary is the upsell
conversation, and you've now seen both sides of it.

Either way the workspaces should look similar, since the simulator
assigns them round-robin. If one looks wildly off, you're reading a
small-numbers artifact, which is also a lesson.

Then switch the measure between total count, unique users, and weekly
active. Know the difference cold, because customers routinely confuse
them.

## 4. Funnels

**New insight → Funnel**, with these steps:

1. `workspace_created`
2. `habit_created`
3. `habit_checked_in`
4. `upgrade_clicked`

Conversion window: 14 days. Read it like a customer conversation rather than a dashboard.

The step-1-to-2 drop is the activation gap: those are the 8 "browser"
archetypes who signed up and never created a habit. In a real account,
that number is where an onboarding-improvement conversation starts.

Then click into the step-2-to-3 drop-off and view the persons who
dropped. That list, with actual names and actual companies, is what
turns an insight into an outreach.

## 5. Retention

**New insight → Retention**: users who did `habit_created` and came back
to do `habit_checked_in`, weekly. The simulated data gives you a
recognisable curve, with a strong week 1, a decaying tail, and power
users holding a floor. Ask yourself what a *good* curve looks like for a
habit product, then notice the honest answer is "flattens above zero"
rather than "stays at 100%". Retention reads are about the flattening
point.

## 6. Lifecycle and stickiness

Run **Lifecycle** on `habit_checked_in` to see new, returning,
resurrecting, and dormant. Find the churned cohort going dormant
mid-window, since you know they're there.

Then **Stickiness**, which shows how many distinct days users checked in.
Power users pile up on the right.

## 7. Paths

**New insight → Paths**, from `$pageview`, starting at `/`. Watch
simulated users flow from `/` to `/signup` to `/habits` to `/upgrade`.
Note the controls for wildcards and path cleaning, because real products
have `/project/12345/dashboard` URLs that need cleaning rules before
paths are readable. File that away, since it's in the handbook's reading
list for a reason.

## 8. Assemble the dashboard

Create the dashboard "HogHabits health" and pin the check-in trend, the
funnel, retention, and lifecycle. This is a miniature of what you'll
build or review in every implementation review: acquisition, activation,
retention, and a revenue proxy on one screen.

## 9. Do it again via MCP

- *"Create a trends insight for daily unique users doing
  habit_checked_in over the last 3 weeks."*
- *"What's the conversion rate from workspace_created to upgrade_clicked
  in the last 21 days?"*
- *"Which users did habit_created but never habit_checked_in?"*, which
  gets you the activation-gap list conversationally.

Note what the MCP is good at (fast answers, one-off queries) versus the
UI (exploration, sharing, dashboards). Which tool you reach for on a
live call is worth knowing before you're on one.

## Done when

- [ ] Internal and test-user filtering configured and understood
- [ ] One action defined from autocapture, retroactivity understood
- [ ] Funnel built, and you clicked into a drop-off and saw the persons
- [ ] Retention curve read correctly, meaning the flattening point rather
      than the top-left cell
- [ ] Dashboard assembled
- [ ] MCP produced the activation-gap list

Next: [Lab 04, session replay](04-replay.md)

[foundation-check]: https://posthog.com/handbook/cs-and-onboarding/foundation-check
