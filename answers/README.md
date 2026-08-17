# Answer keys

## Labs 01–06: the reference solution

The complete, canonical implementation for labs 01–06 lives in
**`sabotage/reference/`** — it's the exact state `sabotage.js prepare`
installs before the drills, so it is *guaranteed* current (the drills
are generated from it). Compare your work file-by-file after finishing
a lab, or when stuck:

| Lab | Reference files to compare |
|---|---|
| 01 instrument | `instrumentation-client.js`, `lib/posthog-server.js`, `app/habits/page.jsx`, `components/InviteForm.jsx`, `components/CookieBanner.jsx`, `app/api/checkin/route.js` |
| 02 identity | `app/signup/page.jsx`, `app/api/signup/route.js`, `components/Nav.jsx`, `app/api/checkin/route.js` (groups) |
| 05 flags | `app/providers.jsx`, `app/upgrade/page.jsx`, `app/api/flags/route.js`, `lib/posthog-server.js` (personalApiKey), `next.config.js`, `instrumentation-client.js` (api_host) |
| 06 experiments | `app/upgrade/page.jsx` (variant + capture) |

Labs 03 and 04 are UI work — their "answer key" is the **Done when**
checklist in the lab itself, plus these spot-checks:

- **Lab 03 funnel**: with the default simulated population, the
  workspace_created → habit_created step should lose exactly the 8
  "browser" archetypes (~20%). If your step-1 count isn't 40+ (sims +
  you), your date range or filters are off.
- **Lab 03 retention**: week-1 retention visibly above later weeks,
  curve flattening — if it's a cliff to zero, you're probably measuring
  the wrong returning event.
- **Lab 04**: if no recording appears, the usual causes in order:
  recording not enabled, session shorter than your minimum duration,
  ad blocker on your own browser, or you browsed in the private window
  from Lab 02.

## Lab 07: [07-sabotage.md](07-sabotage.md)

Full spoilers, one entry per drill — root cause, evidence trail,
give-away, model customer reply. Only after your reply is written.

