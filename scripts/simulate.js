#!/usr/bin/env node
/**
 * Synthetic population for the HogHabits labs.
 *
 *   node scripts/simulate.js            # send ~2,500 backdated events
 *   node scripts/simulate.js --dry-run  # print what WOULD be sent, send nothing
 *   node scripts/simulate.js --sample   # dry-run plus one full payload per
 *                                       # event name, and the person-property
 *                                       # coverage. Use this to answer "does
 *                                       # X actually get sent?" without
 *                                       # touching a real project.
 *
 * Why this exists: one CSM clicking around for an hour cannot produce a
 * retention curve, a lifecycle chart, or an experiment readout. This
 * script backfills a small, bounded population — ~40 users in 4
 * workspaces over the last 21 days — so Labs 03 and 06 have something
 * real to look at.
 *
 * Run it at the END of Lab 01, after your own instrumentation works.
 *
 * Ground rules baked in:
 *   • Bounded: hard abort above 12,000 events (~1% of the free tier's
 *     monthly 1M allowance). A typical run sends ~2,500.
 *   • Namespaced: every user is sim_user_NN@hoghabits.test with person
 *     property is_simulated=true — Lab 03 uses this to teach the
 *     "filter out test users" lesson.
 *   • Deterministic: seeded PRNG, so two runs shape the same story.
 *   • Honest about limits: server-sent events can't fake session
 *     recordings or autocapture. Replay labs use YOUR real sessions.
 *
 * ONLY run this against your own hoglab project. Never a customer's.
 */

const fs = require('fs')
const path = require('path')
const { createRequire } = require('module')

const ROOT = path.resolve(__dirname, '..')
const APP = path.join(ROOT, 'app-hoghabits')
const SAMPLE = process.argv.includes('--sample')
const DRY = process.argv.includes('--dry-run') || SAMPLE
const MAX_EVENTS = 12000
const DAYS = 21

// ---------- seeded PRNG (deterministic runs) ----------
let seed = 424242
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
function pick(arr) {
  return arr[Math.floor(rand() * arr.length)]
}

// ---------- env + client ----------
function loadEnv() {
  const envPath = path.join(APP, '.env.local')
  if (!fs.existsSync(envPath)) {
    if (DRY) return {}
    console.error('Missing app-hoghabits/.env.local — Lab 00 sets this up. (Use --dry-run to preview without it.)')
    process.exit(1)
  }
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return env
}

// ---------- the cast ----------
const WORKSPACES = ['Hedgehogs Inc', 'Quill & Co', 'Spike Labs', 'Burrow Digital']
const HABITS = [
  'Ship something every day', 'No meetings before noon', 'Review one PR',
  'Write 200 words', 'Touch grass', 'Inbox zero', 'Stretch for 5 minutes',
]
const FIRST = ['Alex', 'Sam', 'Noor', 'Kai', 'Robin', 'Dana', 'Jules', 'Priya', 'Marco', 'Yuki']

// Archetypes drive retention/lifecycle shape:
//   power:    joined early, checks in ~daily, invites, some upgrade
//   regular:  checks in a few times a week, gently decaying
//   churned:  3 active days then gone (your churn cohort)
//   browser:  signed up, never created a habit (your activation gap)
const ARCHETYPES = [
  ...Array(8).fill('power'),
  ...Array(14).fill('regular'),
  ...Array(10).fill('churned'),
  ...Array(8).fill('browser'),
]

// ---------- event assembly ----------
const events = []
const now = Date.now()

function at(daysAgo, hour) {
  const d = new Date(now - daysAgo * 86400000)
  d.setHours(hour, Math.floor(rand() * 60), Math.floor(rand() * 60), 0)
  return d
}

function capture(distinctId, event, properties, timestamp, extra = {}) {
  events.push({ distinctId, event, properties, timestamp, ...extra })
}

function pageview(user, url, ts) {
  capture(user.id, '$pageview', {
    $current_url: `http://localhost:3000${url}`,
    $pathname: url,
    $session_id: user.currentSession,
  }, ts, { groups: { workspace: user.workspace } })
}

function buildUser(i) {
  const archetype = ARCHETYPES[i]
  const name = `${pick(FIRST)} Sim${i + 1}`
  return {
    id: `sim_user_${String(i + 1).padStart(2, '0')}@hoghabits.test`,
    name,
    archetype,
    workspace: WORKSPACES[i % WORKSPACES.length],
    // power users joined early; everyone else is spread across the window
    signupDay: archetype === 'power' ? DAYS - Math.floor(rand() * 3) : 3 + Math.floor(rand() * (DAYS - 4)),
    habits: [],
    currentSession: null,
  }
}

function simulateUser(user) {
  const hour = 8 + Math.floor(rand() * 10)

  // --- signup day: anonymous browse → signup → (maybe) first habit ---
  user.currentSession = `sim-${user.id}-d${user.signupDay}`
  pageview(user, '/', at(user.signupDay, hour))
  pageview(user, '/signup', at(user.signupDay, hour))
  capture(user.id, 'workspace_created', {
    workspace: user.workspace,
    $session_id: user.currentSession,
    // First event carries $set so the person gets profile properties —
    // including the is_simulated flag Lab 03 filters on, and `workspace`,
    // which is what Lab 03 breaks down by on free tier (group breakdowns
    // need the paid add-on). Mirrors the server-side identify the app
    // does in Lab 02.
    $set: { email: user.id, name: user.name, workspace: user.workspace, is_simulated: true },
  }, at(user.signupDay, hour), { groups: { workspace: user.workspace } })

  if (user.archetype === 'browser') {
    // Signed up, poked around, never activated. Activation-gap cohort.
    pageview(user, '/habits', at(user.signupDay, hour + 1))
    return
  }

  const habit = pick(HABITS)
  pageview(user, '/habits', at(user.signupDay, hour))
  capture(user.id, 'habit_created', {
    habit_name: habit, total_habits: 1, $session_id: user.currentSession,
  }, at(user.signupDay, hour), { groups: { workspace: user.workspace } })

  // --- active days after signup ---
  const activeDays = []
  for (let d = user.signupDay - 1; d >= 0; d -= 1) {
    const sinceSignup = user.signupDay - d
    let p
    if (user.archetype === 'power') p = 0.85
    else if (user.archetype === 'regular') p = Math.max(0.15, 0.65 - sinceSignup * 0.02)
    else p = sinceSignup <= 3 ? 0.9 : 0 // churned: 3 days then silence
    if (rand() < p) activeDays.push(d)
  }

  let streak = 0
  for (const d of activeDays) {
    streak += 1
    const h = 7 + Math.floor(rand() * 12)
    user.currentSession = `sim-${user.id}-d${d}`
    if (rand() < 0.5) pageview(user, '/', at(d, h))
    pageview(user, '/habits', at(d, h))
    capture(user.id, 'habit_checked_in', {
      habit, streak, source: 'api', $session_id: user.currentSession,
    }, at(d, h), { groups: { workspace: user.workspace } })

    // occasional second habit / invite / upgrade wander
    if (user.archetype === 'power' && rand() < 0.1) {
      const h2 = pick(HABITS)
      capture(user.id, 'habit_created', {
        habit_name: h2, total_habits: user.habits.length + 2, $session_id: user.currentSession,
      }, at(d, h), { groups: { workspace: user.workspace } })
    }
    if (rand() < (user.archetype === 'power' ? 0.12 : 0.04)) {
      capture(user.id, 'teammate_invited', {
        invitee_domain: 'hoghabits.test', workspace: user.workspace, $session_id: user.currentSession,
      }, at(d, h), { groups: { workspace: user.workspace } })
    }
    if (rand() < (user.archetype === 'power' ? 0.4 : 0.2)) {
      pageview(user, '/upgrade', at(d, h))
      // Experiment exposure: a healthy 80/20, unlike drill 10's data.
      const variant = rand() < 0.8 ? 'control' : 'trial-copy'
      capture(user.id, '$feature_flag_called', {
        $feature_flag: 'upgrade-cta-copy', $feature_flag_response: variant, $session_id: user.currentSession,
      }, at(d, h), { groups: { workspace: user.workspace } })
      // trial-copy converts a little better — a small, honest effect
      // that will NOT reach significance at this sample size (that's
      // the Lab 06 lesson).
      const convert = variant === 'trial-copy' ? 0.3 : 0.22
      if (rand() < convert) {
        capture(user.id, 'upgrade_clicked', {
          cta_variant: variant, annual_offer_shown: false, $session_id: user.currentSession,
        }, at(d, h), { groups: { workspace: user.workspace } })
      }
    }
  }
}

// ---------- build ----------
const users = Array.from({ length: ARCHETYPES.length }, (_, i) => buildUser(i))
users.forEach(simulateUser)

if (events.length > MAX_EVENTS) {
  console.error(`Refusing to run: ${events.length} events exceeds the ${MAX_EVENTS} safety cap.`)
  process.exit(1)
}

// ---------- report ----------
const byEvent = {}
for (const e of events) byEvent[e.event] = (byEvent[e.event] || 0) + 1
console.log(`Population: ${users.length} users / ${WORKSPACES.length} workspaces / last ${DAYS} days`)
console.log(`Archetypes: 8 power, 14 regular, 10 churned, 8 never-activated`)
console.log(`Events to send: ${events.length}`)
for (const [k, v] of Object.entries(byEvent).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(5)}  ${k}`)
}

if (SAMPLE) {
  // Person-property coverage: which persons actually receive $set, and what's in it.
  const persons = new Set(events.map((e) => e.distinctId))
  const setEvents = events.filter((e) => e.properties && e.properties.$set)
  const covered = {}
  for (const e of setEvents) {
    for (const k of Object.keys(e.properties.$set)) {
      covered[k] = covered[k] || new Set()
      covered[k].add(e.distinctId)
    }
  }
  console.log(`\nPerson properties, across ${persons.size} simulated persons:`)
  for (const [prop, who] of Object.entries(covered)) {
    const all = who.size === persons.size
    console.log(`  ${all ? '✓' : '✗'} ${prop.padEnd(14)} ${who.size}/${persons.size} persons`)
  }
  console.log('\nOne full payload per event name:')
  for (const name of Object.keys(byEvent)) {
    const e = events.find((x) => x.event === name)
    console.log(`\n${name}:`)
    console.log(JSON.stringify(e, null, 2).split('\n').map((l) => '  ' + l).join('\n'))
  }
  console.log('\n--sample: nothing was sent.')
  process.exit(0)
}

if (DRY) {
  console.log('\n--dry-run: nothing was sent.')
  process.exit(0)
}

// ---------- send ----------
async function send() {
  const env = loadEnv()
  if (!env.NEXT_PUBLIC_POSTHOG_KEY || env.NEXT_PUBLIC_POSTHOG_KEY.includes('YOUR_')) {
    console.error('NEXT_PUBLIC_POSTHOG_KEY in app-hoghabits/.env.local is not set.')
    process.exit(1)
  }
  const req = createRequire(path.join(APP, 'package.json'))
  const { PostHog } = req('posthog-node')
  const ph = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  })

  // Group properties once per workspace.
  for (const w of WORKSPACES) {
    ph.groupIdentify({ groupType: 'workspace', groupKey: w, properties: { name: w, plan: 'free', is_simulated: true } })
  }

  console.log(`\nSending to ${env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'} ...`)
  let sent = 0
  for (const e of events) {
    ph.capture({
      distinctId: e.distinctId,
      event: e.event,
      properties: e.properties,
      groups: e.groups,
      timestamp: e.timestamp,
    })
    sent += 1
    if (sent % 500 === 0) console.log(`  ${sent}/${events.length}`)
  }
  await ph.shutdown()
  console.log(`✓ Sent ${sent} events. Ingestion can take a minute or two — check Activity.`)
  console.log('  (All simulated people are sim_user_* with is_simulated=true — filterable, deletable, junk.)')
}

send().catch((err) => {
  console.error('Send failed:', err.message)
  process.exit(1)
})
