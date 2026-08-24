# Lab 00: Setup (~45 min)

> **The rule that governs everything in these labs:** every event, every
> sabotage, every piece of junk data goes into **your own free-tier
> organization**, the one you create in this lab. Never a customer's
> project. Never PostHog's own internal production project (which holds
> live data people report off). If you're ever unsure which project
> you're pointed at, stop and check.

## Why this matters

You're about to do, step by step, exactly what every customer in your
book once did: sign up self-serve, pick a region, create a project, walk
the onboarding wizard, and find the billing page. Most new starters never see
this flow because someone else set their access up. Pay attention to how
it *feels*, and to where you hesitated, what was obvious, and what
wasn't. That first-hand memory is worth more than any doc when a
customer describes being stuck "somewhere in setup."

## 1. Create your organization

1. Go to [posthog.com](https://posthog.com) and sign up with your
   `@posthog.com` email. If you are already a member of the PostHog org,
   just create a new org for you.
2. **Pick a region deliberately, US or EU.** Write down which you chose.
   This single choice decides the `api_host` every SDK will send events
   to (`us.i.posthog.com` versus `eu.i.posthog.com`), where the data
   physically lives, and it cannot be changed later. Customers who get
   this wrong have to migrate. It comes back in drill 9.
3. Name the organization and project **`hoglab`**.
4. Walk the onboarding wizard. Don't rush it, because this is the
   activation flow your customers experienced. When it asks how you'll
   install PostHog, look at the options a customer sees.

## 2. Billing

Still in your new org:

1. Open **Settings → Billing** (or the Billing page from the sidebar).
2. Find the current free monthly allowances per product. At time of
   writing that's 1M events, 5K session recordings, and 1M feature-flag
   requests, but read what's on your screen rather than trusting that.
   Allowances change, which is why this is a page you look up rather
   than a number you memorize.
3. Look for the billing limit control on product analytics. You won't
   find one, and that's the lesson: limits only appear once a product is
   on a paid subscription, because on free tier there's nothing to cap.
   Your free allowance *is* the limit, and once you exceed it we stop
   ingesting until the period resets. Read
   [billing limits and alerts](https://posthog.com/docs/billing/limits-alerts)
   so you know what a paying customer sees on this page: a "Set billing
   limit" control per product, and alert emails at 80% and 100% of both
   the limit and the free allotment. A customer panicking about a bill
   is on a paid plan, so this is the page you send them to.
4. Skim the add-ons (group analytics, platform packages). Note which
   things are usage-priced versus flat add-ons. You don't need to
   memorize any of it. You need to know where the page is. Note group
   analytics in particular: it's a paid add-on, so Lab 02 teaches the
   instrumentation but you won't get the Groups tab on this project.

## 3. Get the app running

You need Node 18.18+ (`node -v`, and if you have Claude Code running you
almost certainly have it) and this repo on your machine, cloned or
downloaded.

```bash
cd app-hoghabits
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

- `NEXT_PUBLIC_POSTHOG_KEY` is your project API key, from **Settings →
  Project → General**. Note it starts with `phc_`. This key is public by
  design, since it can only ingest and never read. Hold that thought
  until drill 12.
- `NEXT_PUBLIC_POSTHOG_HOST` should match the region you chose in step 1.
- `POSTHOG_PERSONAL_API_KEY`: create one at **Settings → User → Personal
  API keys** with *feature flags read* scope. It starts with `phx_`, and
  this one is a secret. Lab 05 uses it.

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click through the
whole app. Browse the landing page, sign up with any fake email, create a
habit, check in, poke the Save notes button until it works (it's broken
on purpose, and you'll meet it again in Lab 04), and visit Upgrade.

Nothing appears in PostHog yet, and that's correct. The app ships
uninstrumented, and instrumenting it from zero is Lab 01. If you see
events already, you're pointed at the wrong project, so stop and check.

## 4. Connect your agent

The handbook says to get your AI investigation setup running early, and
this project is the safe place to practise with it.

1. Connect the PostHog MCP in Claude Code (the `posthog` plugin), using
   a personal API key from your **hoglab** org.
2. Sanity-check it by asking your agent *"which PostHog project are you
   connected to?"* The answer must be `hoglab`. This check matters,
   because an agent pointed at the wrong project is how junk data ends
   up somewhere it shouldn't.
3. Ask it *"list the event definitions in this project"*. The empty
   answer is your baseline, and you'll ask again after Lab 01.

## Done when

- [ ] Your own org and `hoglab` project exist, region chosen on purpose
- [ ] You know where the allowances page is, and why free tier has no
      billing limit control
- [ ] App runs at localhost:3000, fully clickable, zero events in PostHog
- [ ] MCP connected and verified to point at `hoglab`

Next: [Lab 01, instrument from zero](01-instrument.md)
