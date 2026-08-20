# Lab 07: Self-driving (~35 min)

> Do this after Lab 06 and *before* Lab 08. `sabotage.js prepare` backs up
> your app and installs the reference solution, so any code the wizard
> writes into your tree gets set aside rather than kept live.

## Why a customer cares

Self-driving is PostHog's newest activation surface, and its onboarding
wizard makes a lot of decisions on the customer's behalf: which products
to enable, which signal sources to wire into the inbox, which scouts to
run, which session recordings to point an LLM at. Every one of those has
a cost or a noise consequence. The first question you'll get after a
customer runs it is some version of "what did that just turn on, and what
will it cost me?" Someone who has watched the wizard reason out loud once
can answer that. One who hasn't can only read the docs back.

This lab is deliberately thin. The goal is to *feel* the onboarding, the
same reason Lab 00 made you walk the self-serve signup instead of handing
you a project.

## 1. Run the wizard

From the app directory:

```bash
cd app-hoghabits
npx -y @posthog/wizard@latest self-driving
```

Point it at your `hoglab` project from Lab 00, and check the region it
picks matches the one you wrote down there.

Answer the prompts yourself instead of accepting everything. Declining a
proposal teaches you as much as accepting it, because the wizard explains
its reasoning either way, and that reasoning is what you'll be
paraphrasing to customers. Two things to read carefully rather than skim:

- **Scout run budget.** Scouts are in early access with a cap of 100 runs
  per project per day. Note how many the wizard enables and what it says
  about the ceiling.
- **Replay Vision credit spend.** Scanners are the only part of this setup
  that burns quota. Look at the per-scanner monthly estimate and the
  sampling rate it chose.

Those are the two cost questions that come back.

## 2. The GitHub dead end

The wizard asks you to authenticate with GitHub. Do it, and watch what
happens: OAuth completes, the integration is created, and then no
repositories show up. The GitHub Issues responder gets armed but stays
dormant with no source behind it.

That's expected here rather than broken. The PostHog GitHub App has to be
granted access to each repository separately, and this repo belongs to the
PostHog org, so you can't approve it for yourself.

Sit with that for a second, because it's the most common self-driving
onboarding stall on real accounts. The customer completes OAuth, assumes
they're done, and the App was never granted access to any repo — or it was
installed by someone who isn't an admin on the repos that matter. Note
what the wizard did and didn't tell you about that gap. The sentence you'd
write to a customer stuck here is the deliverable of this step.

## 3. Read the report

The wizard writes `app-hoghabits/posthog-self-driving-report.md`. Read it
end to end, and spend most of your time on **Follow-ups**, which is the
honest list of what the wizard couldn't finish itself. Some entries are
manual UI flips (enabling session replay, error tracking, Support). Some
are the GitHub gap from step 2. Some are optional suggestions.

Then triage it like a customer's: which of these would you actually chase,
and which would you tell them to ignore? A follow-up list nobody acts on
is the same as no follow-up list.

## 4. Check the inbox

Open **Inbox** in your project. Findings take roughly 30 minutes to appear
after the scout coordinator picks up the new configs, so this is a come
back later step rather than a wait here one.

When you do look, notice which scouts had nothing to work with. A fresh
project has no saved insights to watch for anomalies, no resolved reports
to validate against, no support tickets. That's a customer-shaped
observation worth keeping: self-driving gets better the more of PostHog
the customer already uses, which makes it a poor first thing to sell and a
good second thing.

## 5. Do it again via MCP

- *"Which scouts are enabled in this project, and what does each one watch?"*
- *"Show me the latest reports in my inbox."*
- *"What signal sources are configured, and are any of them dormant?"*

## Done when

- [ ] Wizard run against your `hoglab` project, prompts answered rather
      than rubber-stamped
- [ ] You can say what it enabled and roughly what that costs, in both
      scout runs and Replay Vision credits
- [ ] GitHub authenticated, and you can explain in a sentence why no
      repositories appeared
- [ ] Report read, follow-ups triaged into would-chase and would-ignore
- [ ] Inbox checked, and you noticed which scouts had no data to work with
- [ ] MCP answered the scout and inbox questions

Next: [Lab 08, the diagnosis drills](08-sabotage.md)
