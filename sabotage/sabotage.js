#!/usr/bin/env node
/**
 * The blind-sabotage runner for Lab 08.
 *
 *   node sabotage/sabotage.js prepare   # save your lab work, install the reference solution
 *   node sabotage/sabotage.js 7         # apply drill 7 and print the customer's report
 *   node sabotage/sabotage.js hint      # one nudge for the active drill (not the answer)
 *   node sabotage/sabotage.js heal      # restore the healthy reference app
 *   node sabotage/sabotage.js restore   # put YOUR lab work back, undoing prepare
 *   node sabotage/sabotage.js status    # what's currently applied
 *   node sabotage/sabotage.js list      # available drill numbers
 *
 * Maintainers only:
 *   node sabotage/sabotage.js show 7            # decode drill 7 (SPOILERS)
 *   node sabotage/sabotage.js encode d.json 7   # re-encode a drill definition
 *
 * Your own work is copied to .sabotage-backup/ (gitignored) before anything
 * is overwritten, and `restore` puts it back. Nothing here touches git, so
 * this works whether you cloned the repo or downloaded it.
 *
 * Drills are stored base64-encoded in sabotage/patches/ so a stray glance
 * doesn't spoil the diagnosis. That's spoiler-proofing, not security: the
 * honor system covers the rest.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
const APP = path.join(ROOT, 'app-hoghabits')
const REF = path.join(__dirname, 'reference')
const PATCHES = path.join(__dirname, 'patches')
const STATE = path.join(__dirname, '.state.json')
const BACKUP = path.join(ROOT, '.sabotage-backup')
const WORK = path.join(BACKUP, 'my-work')

// Never copy these around: huge, regenerable, or machine-specific.
const SKIP = ['node_modules', '.next', '.git']

// ---------- small utils ----------

function walk(dir, base = dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full, base))
    else out.push(path.relative(base, full))
  }
  return out
}

function copyTree(src, dest) {
  for (const rel of walk(src)) {
    const to = path.join(dest, rel)
    fs.mkdirSync(path.dirname(to), { recursive: true })
    fs.copyFileSync(path.join(src, rel), to)
  }
}

// Wrap text to a width so long notes stay readable in a terminal.
function wrap(text, width) {
  const out = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if (line && (line + ' ' + word).length > width) {
      out.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) out.push(line)
  return out
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE, 'utf8'))
  } catch {
    return { active: null }
  }
}

function writeState(state) {
  fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n')
}

function loadDrill(n) {
  const file = path.join(PATCHES, `drill-${String(n).padStart(2, '0')}.b64`)
  if (!fs.existsSync(file)) {
    console.error(`No drill ${n}. Run \`node sabotage/sabotage.js list\`.`)
    process.exit(1)
  }
  return JSON.parse(Buffer.from(fs.readFileSync(file, 'utf8'), 'base64').toString('utf8'))
}

function listDrills() {
  if (!fs.existsSync(PATCHES)) return []
  return fs
    .readdirSync(PATCHES)
    .filter((f) => f.endsWith('.b64'))
    .map((f) => parseInt(f.replace('drill-', '').replace('.b64', ''), 10))
    .sort((a, b) => a - b)
}

function packageJsonChanged(fn) {
  const before = fs.readFileSync(path.join(APP, 'package.json'), 'utf8')
  fn()
  const after = fs.readFileSync(path.join(APP, 'package.json'), 'utf8')
  return before !== after
}

function npmInstall() {
  console.log('→ package.json changed; running npm install (this takes a moment)...')
  execSync('npm install --no-audit --no-fund', { cwd: APP, stdio: 'inherit' })
}

function copyReference() {
  copyTree(REF, APP)
}

// Rough check: has anyone actually instrumented this app yet? Used only to
// warn, never to block, since a CSM may legitimately have named things
// differently or skipped a lab.
function looksInstrumented() {
  try {
    return fs
      .readFileSync(path.join(APP, 'instrumentation-client.js'), 'utf8')
      .includes('posthog.init(')
  } catch {
    return false
  }
}

// ---------- env + posthog-node (for data drills) ----------

function loadEnv() {
  const envPath = path.join(APP, '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('Missing app-hoghabits/.env.local — Lab 00 sets this up.')
    process.exit(1)
  }
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  }
  return env
}

function getPostHogNode(env) {
  const { createRequire } = require('module')
  const req = createRequire(path.join(APP, 'package.json'))
  const { PostHog } = req('posthog-node')
  return new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  })
}

// Drill 8's data: exposure events whose observed split can't match
// the configured 80/20, plus a cohort of users exposed to BOTH
// variants. Bounded: ~160 events.
async function runDataScript(name) {
  if (name !== 'ab-skew') throw new Error(`Unknown data script: ${name}`)
  const env = loadEnv()
  const ph = getPostHogNode(env)
  // Minutes back, not days: experiment results are computed from the
  // experiment's start date onward, so anything backdated past that is
  // excluded from the results view and the drill shows nothing there.
  const minsAgo = (m) => new Date(Date.now() - m * 60 * 1000)

  console.log('→ sending experiment exposure data (~160 events, bounded)...')
  for (let i = 1; i <= 120; i += 1) {
    const id = `sim_ab_${String(i).padStart(3, '0')}@hoghabits.test`
    // Lab 06 configures 80/20. This produces ~65/35 observed, and that
    // gap is the drill.
    const variant = i % 100 < 65 ? 'control' : 'trial-copy'
    const minute = 5 + (i % 180)
    ph.capture({
      distinctId: id,
      event: '$feature_flag_called',
      properties: { $feature_flag: 'upgrade-cta-copy', $feature_flag_response: variant },
      timestamp: minsAgo(minute),
    })
    // Every 8th user was exposed to BOTH variants (flag evaluated
    // before identify on a second device, then again after).
    if (i % 8 === 0) {
      ph.capture({
        distinctId: id,
        event: '$feature_flag_called',
        properties: {
          $feature_flag: 'upgrade-cta-copy',
          $feature_flag_response: variant === 'control' ? 'trial-copy' : 'control',
        },
        timestamp: minsAgo(minute - 2),
      })
    }
    // Some convert.
    if (i % 5 === 0) {
      ph.capture({
        distinctId: id,
        event: 'upgrade_clicked',
        properties: { cta_variant: variant },
        timestamp: minsAgo(minute - 1),
      })
    }
  }
  await ph.shutdown()
  console.log('→ done. (These users are namespaced sim_ab_* — junk data, own project only.)')
}

// ---------- commands ----------

function cmdPrepare(force) {
  if (fs.existsSync(WORK) && !force) {
    console.log('A saved copy of your work already exists at .sabotage-backup/my-work/')
    console.log('')
    console.log('Running prepare again would overwrite it with whatever is in the app')
    console.log('right now, which after a drill is the reference solution. So:')
    console.log('')
    console.log('  • already mid-drills?  node sabotage/sabotage.js heal')
    console.log('  • want your work back? node sabotage/sabotage.js restore')
    console.log('  • really re-save?      node sabotage/sabotage.js prepare --force')
    process.exit(1)
  }

  if (!looksInstrumented()) {
    console.log('⚠ app-hoghabits looks uninstrumented (no posthog.init found).')
    console.log('  The drills assume you finished labs 01 to 06. Carry on if you')
    console.log('  meant to skip ahead; your current state is still saved below.')
    console.log('')
  }

  fs.mkdirSync(WORK, { recursive: true })
  copyTree(APP, WORK)
  console.log(`→ saved your work to .sabotage-backup/my-work/ (${walk(APP).length} files)`)

  const changed = packageJsonChanged(copyReference)
  if (changed) npmInstall()
  writeState({ active: null })

  console.log('')
  console.log('✓ Reference solution installed. The app is now in its canonical,')
  console.log('  correctly-instrumented state (it may differ from your code in')
  console.log('  small ways; the answer keys explain the choices).')
  console.log('')
  console.log('  Restart `npm run dev`, then pick a drill: node sabotage/sabotage.js <1-12>')
  console.log('  Your own version is one command away: node sabotage/sabotage.js restore')
}

function cmdApply(n) {
  const drill = loadDrill(n)
  const changed = packageJsonChanged(() => {
    copyReference() // clean baseline first — drills never stack
    for (const [rel, content] of Object.entries(drill.files || {})) {
      const dest = path.join(APP, rel)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, content)
    }
  })
  if (changed) npmInstall()
  writeState({ active: n })

  const run = async () => {
    if (drill.dataScript) await runDataScript(drill.dataScript)
    console.log('')
    console.log('━'.repeat(64))
    console.log(`DRILL ${n} — a message lands in your customer's Slack channel:`)
    console.log('')
    console.log(`  “${drill.symptom}”`)
    console.log('━'.repeat(64))
    console.log('')
    console.log('Restart `npm run dev` if it was running.')
    console.log('')
    if (drill.note) {
      console.log('TO GENERATE THE EVIDENCE, DO THIS FIRST:')
      console.log('')
      for (const line of wrap(drill.note, 62)) console.log(`  ${line}`)
      console.log('')
      console.log('Until you do, PostHog will look like nothing is wrong.')
      console.log('')
    }
    console.log('Then diagnose it from the PostHog UI, and write the Slack')
    console.log('reply you would actually send — root cause, why it happened,')
    console.log('the fix, the docs link. THEN check the answer key.')
    console.log('')
    console.log('Stuck? node sabotage/sabotage.js hint')
    console.log('Done?  node sabotage/sabotage.js heal')
  }
  run().catch((e) => {
    console.error(e.message)
    process.exit(1)
  })
}

function cmdHint() {
  const { active } = readState()
  if (!active) {
    console.log('No drill is active. Apply one first: node sabotage/sabotage.js <1-12>')
    return
  }
  console.log(`Hint for drill ${active}: ${loadDrill(active).hint}`)
}

function cmdHeal() {
  const changed = packageJsonChanged(copyReference)
  if (changed) npmInstall()
  writeState({ active: null })
  console.log('✓ Healed — the app is back to the reference solution. Restart `npm run dev`.')
}

function cmdRestore() {
  if (!fs.existsSync(WORK)) {
    console.error('Nothing to restore: .sabotage-backup/my-work/ does not exist.')
    console.error('(It is created by `prepare`, before the reference is installed.)')
    process.exit(1)
  }
  const changed = packageJsonChanged(() => copyTree(WORK, APP))
  if (changed) npmInstall()
  writeState({ active: null })
  console.log('✓ Your own lab work is back in app-hoghabits. Restart `npm run dev`.')
  console.log('  The saved copy is left in place, so this is repeatable.')
}

function cmdStatus() {
  const { active } = readState()
  console.log(active ? `Drill ${active} is active.` : 'No drill active — app should match the reference solution.')
  console.log(
    fs.existsSync(WORK)
      ? 'Your own work is saved at .sabotage-backup/my-work/ (restore with `restore`).'
      : 'No saved copy of your own work yet (created by `prepare`).'
  )
}

function cmdShow(n) {
  console.log('⚠ SPOILERS — this decodes the drill definition.\n')
  console.log(JSON.stringify(loadDrill(n), null, 2))
}

function cmdEncode(jsonPath, n) {
  const drill = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const out = path.join(PATCHES, `drill-${String(n).padStart(2, '0')}.b64`)
  fs.mkdirSync(PATCHES, { recursive: true })
  fs.writeFileSync(out, Buffer.from(JSON.stringify(drill)).toString('base64') + '\n')
  console.log(`Encoded → ${path.relative(ROOT, out)}`)
}

// ---------- main ----------

const [, , cmd, arg] = process.argv

if (cmd === 'prepare') cmdPrepare(process.argv.includes('--force'))
else if (cmd === 'heal') cmdHeal()
else if (cmd === 'restore') cmdRestore()
else if (cmd === 'hint') cmdHint()
else if (cmd === 'status') cmdStatus()
else if (cmd === 'list') console.log(`Drills: ${listDrills().join(', ')}`)
else if (cmd === 'show') cmdShow(parseInt(arg, 10))
else if (cmd === 'encode') cmdEncode(arg, parseInt(process.argv[4], 10))
else if (/^\d+$/.test(cmd || '')) cmdApply(parseInt(cmd, 10))
else {
  console.log(
    'Usage: node sabotage/sabotage.js <prepare | 1-12 | hint | heal | restore | status | list>'
  )
  process.exit(cmd ? 1 : 0)
}
