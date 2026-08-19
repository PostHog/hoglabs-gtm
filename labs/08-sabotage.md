# Lab 08: The diagnosis drills (~90 min)

## Why a customer cares

By month two you're expected to solve tricky technical problems across
your book with minimal help. Customers won't hand you a diff, they'll
hand you a symptom: *"our bill tripled"*, *"your outage broke our page"*,
*"we have 400k users and 3k customers"*. Every drill below is a real
failure mode from the [health check][health-checks] or the
[basic implementation review][foundation-check], applied to your app
without you seeing the change. Your job each time is to
reproduce it, diagnose it from the PostHog UI, and write the reply you'd
actually send. Twelve times. This is the lab that builds the muscle,
and everything before it was learning the instruments.

## How it works

The runner applies sabotage sight-unseen and prints only what the
customer would say:

```bash
node sabotage/sabotage.js prepare   # once, before your first drill
node sabotage/sabotage.js 3         # apply drill 3, get the customer report
node sabotage/sabotage.js hint      # one nudge, not the answer
node sabotage/sabotage.js heal      # back to the healthy reference app
node sabotage/sabotage.js restore   # put YOUR own lab work back
node sabotage/sabotage.js status    # what's active right now
```

`prepare` copies your labs 01 to 06 work to `.sabotage-backup/` and then
installs the canonical reference solution, so every drill starts from a
known-good state. Two things follow from that. Your work is never lost,
and `restore` brings it back whenever you want. And the app you're
diagnosing is the reference rather than your code, which may differ in
small ways, so skim the reference *after* the drills if you're curious;
the answer keys explain the choices. Restart `npm run dev` after prepare
and after every apply, heal, or restore.

The honor system, stated once: until your customer reply is written, don't
read `sabotage/patches/`, don't diff the app against
`sabotage/reference/` or your backup, and don't open the answer keys. The
drill's value is exactly proportional to how honestly you sit in the
not-knowing. Nobody is grading you here, but the customer conversations
in month 2 will.

## What to do for each drill

1. Apply the drill, then read the symptom like a ticket.
2. **Generate the evidence.** Every drill prints the actions to take
   first, because most of them need you to use the app before there's
   anything to find: leave a tab open, reload a few times, do some
   check-ins, browse with an ad blocker off. Skip this and PostHog will
   look like nothing is wrong, which is a false negative rather than a
   diagnosis. This is also true on real accounts, where the equivalent is
   asking the customer what they did and when.
3. Diagnose from PostHog, using Activity, Trends breakdowns, Persons, the
   replay Doctor, and flag pages. The UI has the evidence and the code
   has the confession, so go UI first, because that's what you'll have on
   a real account. Your MCP-connected agent is allowed too, since on a
   real ticket you'd use every tool you have. Asking it to read the app
   source would work, but it's cheating your own training.
4. Write the reply in `notes/drill-replies.md`: root cause in plain
   language, why it happened without blame (read the tone guidance in
   the [health check][health-checks]), the concrete fix, and the docs
   link. Three to six sentences, like you'd actually post in their
   Slack channel.
5. Then read `answers/08-sabotage.md` for that drill and compare. Note
   what you missed in your reply, not just whether you found the cause.
6. Heal, then next drill.

Work through them in any order, and you don't have to do all twelve in one
sitting. A few today and the rest across the week beats a numb marathon.

## If you pull repo updates partway through

If you pull while your app is in a drill or reference state, git can merge
one file from your side and another from the incoming side, which leaves
the app internally inconsistent. The usual symptom is a console full of
`[PostHog.js] Bad HTTP status: 404` because `api_host` and the proxy
rewrites no longer agree.

Nothing is lost when that happens. Run `heal` to get a complete, coherent
reference set, or `restore` if you want your own lab work back. Both write
every file together, which is exactly what undoes the mixing. Make it a
habit after any pull that touched `app-hoghabits/`.

## If a drill won't reproduce

Check the basics first. Did you restart `npm run dev`? Right project?
Private window where the note says so? If it genuinely won't show the
symptom, heal, note which drill and what you saw in
`notes/drill-replies.md`, and move on. Then fix the drill, or open a PR
saying what you saw, because a drill whose evidence doesn't surface is a
bug in the lab rather than in you.

## Done when

- [ ] `prepare` run, and you understand what it did with your code
- [ ] At least 8 of 12 drills reproduced, diagnosed, reply written, then checked
- [ ] Every reply names root cause, fix, and docs link, in customer-safe tone
- [ ] App healed, and `status` says no drill active

[health-checks]: https://posthog.com/handbook/cs-and-onboarding/health-checks
[foundation-check]: https://posthog.com/handbook/cs-and-onboarding/foundation-check
