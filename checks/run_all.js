// Run every check against the codex folder this file sits in (the parent of checks/).
// Usage: node checks/run_all.js [out folder]
// It starts the local server on port 8765, runs the checks one by one, and stops the server.
// A check counts as failed when it exits with an error or prints a non-empty errs/errors list.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'out'));
fs.mkdirSync(OUT, { recursive: true });
const server = spawn(process.execPath, [path.join(__dirname, 'serve.js'), ROOT, '8765'], { stdio: 'ignore' });
const CHECKS = ['smoke_v7', 'releases_check', 'library_check', 'lamp_check', 'lamp_degrade', 'craft_check', 'forge_check', 'wares_check', 'tooltip_check', 'interact_check', 'render_check', 'books_check', 'v2_check', 'phone_index', 'plates_ui', 'iovu_check', 'fixes_301', 'fixes_302', 'fixes_303', 'fixes_304', 'fixes_305', 'fixes_306', 'fixes_307', 'fixes_311', 'viewer_sweep', 'trust_unit', 'engine_check'];
// The public repository ships a small invented dataset (codex/lores/iovu-data.js starts with "SAMPLE DATA").
// These checks test the series ladder and the map against the keeper's real postings, so on the sample they are skipped and shown as skipped.
const SAMPLE = /^\/\* SAMPLE DATA/.test(fs.readFileSync(path.join(ROOT, 'codex', 'lores', 'iovu-data.js'), 'utf8'));
const NEEDS_REAL_DATA = ['fixes_303', 'fixes_304', 'fixes_305', 'engine_check'];
const BAD = /"(errs|errors|phoneErrs|phoneErrors|light:errors)": \[$/m;
setTimeout(() => {
  let fails = 0;
  for (const c of CHECKS) {
    if (SAMPLE && NEEDS_REAL_DATA.includes(c)) { console.log('skip  ' + c + ' (needs the keeper\'s real data)'); continue; }
    const r = spawnSync('node', [path.join(__dirname, c + '.js'), OUT], { encoding: 'utf8', timeout: 300000 });
    const log = (r.stdout || '') + (r.stderr || '');
    fs.writeFileSync(path.join(OUT, c + '.log'), log);
    const ok = r.status === 0 && !BAD.test(log);
    if (!ok) fails++;
    console.log((ok ? 'ok    ' : 'FAIL  ') + c + (ok ? '' : ' (see ' + path.join(OUT, c + '.log') + ')'));
  }
  const pm = spawnSync('node', [path.join(__dirname, 'plates_math.js'), ROOT], { encoding: 'utf8', timeout: 120000 });
  fs.writeFileSync(path.join(OUT, 'plates_math.log'), (pm.stdout || '') + (pm.stderr || ''));
  if (pm.status === 0) console.log('ok    plates_math'); else { console.log('FAIL  plates_math'); fails++; }
  console.log(fails + ' failed');
  server.kill();
  process.exit(fails);
}, 1500);
