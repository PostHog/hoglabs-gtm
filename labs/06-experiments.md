# Lab 06: Experiments (~50 min)

> Needs the simulated population from Lab 01, which already contains
> exposure and conversion events for this experiment's flag key.

## Why a customer cares

An experiment is a flag plus discipline: a hypothesis, a primary metric,
a variant split, and the statistics to say whether the difference is
real. Customers get enormous value from experiments, and they also
p-hack, peek early, change splits mid-flight, and ship on noise. Someone
who can read results honestly, including "this isn't significant and
here's what that means", is worth more than one who can only click
Create.

## 1. Create the experiment

Go to **Experiments → New experiment**:

- Name: **Upgrade CTA copy**
- Feature flag key: **`upgrade-cta-copy`**, exactly, since the simulated
  exposures reference this key
- Variants: `control` and **`trial-copy`**
- Variant split: **80% control, 20% trial-copy**. The default is an even
  split, so you have to change this. Uneven splits are common when a
  customer wants to limit exposure to a change they're unsure about, and
  the drills come back to what happens when the observed split doesn't
  match this number.
- Hypothesis, and write a real one: "Trial-framed CTA copy will increase
  upgrade clicks, because 'start a trial' feels lower-commitment than
  'upgrade'."
- Primary metric: count of **`upgrade_clicked`**, unique users.
- Look at the minimum detectable effect (MDE) and sample-size estimate
  the UI shows you. Read it now, before launch, because this is the "how
  long must this run?" answer customers always ask *after* launching.
  Note what it says for a population your size. Spoiler: weeks you don't
  have, which is today's lesson rather than a bug.

Launch it.

## 2. Wire the variant into the app

In `app/upgrade/page.jsx` (LAB 06 marker):

```jsx
import { useFeatureFlagEnabled, useFeatureFlagVariantKey } from 'posthog-js/react'
// inside the component:
const ctaVariant = useFeatureFlagVariantKey('upgrade-cta-copy')
const ctaLabel = mounted && ctaVariant === 'trial-copy' ? 'Start your free Pro trial' : 'Upgrade to Pro'
```

The `mounted &&` is the same hydration gate you added in Lab 05 step 3,
and it's needed here for the same reason. Without it the server renders
"Upgrade to Pro" while a client with cached flags renders "Start your
free Pro trial", and React throws on the mismatched text.

Use `ctaLabel` as the button text, and add the variant to the conversion
event so results can attribute it:

```js
posthog.capture('upgrade_clicked', {
  cta_variant: ctaVariant ?? 'control',
  annual_offer_shown: !!annualOfferEnabled,
})
```

That `?? 'control'` is the fallback discipline from Lab 05 applied to
experiments: while flags load the variant is `undefined`, and undefined
users see and get counted as control.

Visit `/upgrade` and see which variant you drew. Click the button either
way, since you're one more exposure in your own experiment.

## 3. Read the results

Open the experiment's results view. The simulated data gives you about 70
exposures and a small real effect, where trial-copy converts a bit better
because the simulator is built that way. Now read it like it's a
customer's.

Exposure counts per variant: do they roughly match the split? This sanity
check is drill 8's whole subject.

Credible intervals and win probability: at about 70 exposures they will be
wide and inconclusive, and that's correct. The most valuable sentence in
this lab is that there's a difference in the data and it is not yet
evidence.

Then cross-check against the MDE from step 1. To detect an effect this
small you'd need a sample this data can't provide. Underpowered
experiments don't fail loudly, they tempt you with noise.

What you'd tell a real customer in this position: keep it running until
the pre-registered sample size, don't peek and ship, and if traffic can
never reach the sample size, test bigger swings with a higher MDE
instead.

## 4. Two mid-flight mistakes

Changing the split mid-experiment, say from 50/50 to 80/20: existing
users re-bucket or stay, and stats assumptions break. The handbook's own
reading list flags it, and the answer is reset or restart rather than
edit.

Multi-variant re-exposure, where the same user sees both variants because
of device changes or pre-identify evaluation. PostHog's exposure handling
has settings for this, and the failure smells like drill 8.

## 5. Do it again via MCP

- *"Show me the current results of the upgrade-cta-copy experiment."*
- *"How many users were exposed to each variant this week?"*
- *"Has any user been exposed to more than one variant?"*

## Done when

- [ ] Experiment live on `upgrade-cta-copy` with a written hypothesis
- [ ] Variant wired with the `?? 'control'` fallback, and you know why
- [ ] Results read correctly (wide intervals, no verdict) and you can say
      what you'd tell the customer
- [ ] MDE versus sample size cross-check done
- [ ] MCP answered the exposure questions

Next: [Lab 07, self-driving](07-self-driving.md), and then
[Lab 08, the diagnosis drills](08-sabotage.md), where all of this becomes
muscle.
