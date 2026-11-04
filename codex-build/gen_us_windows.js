// Builds codex/lores/iovu-windows.js: a dated copy of the dates on CRETD-D Command's US job track (the H-1B route in data/visa.js).
// Nothing is typed by hand: the dates are read from CRETD-D's own sentence. They are EXPECTED dates (CRETD-D says FY2028 is unannounced
// and extrapolates from FY2027), so every item carries expected:true and the counsel must call it expected, never fixed.
// Usage: node gen_us_windows.js [CRETD-D data dir] [output file] [copy date YYYY-MM-DD]
const fs = require('fs');
global.window = {};
const CR = (process.argv[2] || '/home/claude/cretd_live/data/').replace(/\/?$/, '/');
const OUT = process.argv[3] || 'codex/lores/iovu-windows.js';
const COPIED = process.argv[4] || new Date().toISOString().slice(0, 10);
require(CR + 'visa.js'); require(CR + 'version.js');
const W = global.window;
const h1b = (W.VISA.routes || []).find((r) => r.id === 'h1b');
if (!h1b) throw new Error('no h1b route in visa.js');
const line = (h1b.time || []).find((t) => /Expect\s+[A-Z][a-z]+\s+\d{4}/.test(t) && /registration\s+\d/.test(t));
if (!line) throw new Error('the H-1B timeline sentence changed; read it again');
const M = { January: 1, February: 2, March: 3, April: 4, May: 5, June: 6, July: 7, August: 8, September: 9, October: 10, November: 11, December: 12 };
const exp = /Expect\s+([A-Z][a-z]+)\s+(\d{4})/.exec(line); const year = Number(exp[2]); const month = M[exp[1]];
const reg = /registration\s+(\d{1,2})\s*[–-]\s*(\d{1,2})\s+([A-Z][a-z]+)/.exec(line);
const note = /notification by\s+(\d{1,2})\s+([A-Z][a-z]+)/.exec(line);
if (!month || !reg || !note || M[reg[3]] !== month || M[note[2]] !== month) throw new Error('the sentence does not read as expected: ' + line);
const iso = (d) => year + '-' + String(month).padStart(2, '0') + '-' + String(d).padStart(2, '0');
const items = [
  { date: iso(reg[1]), what: 'H-1B registration opens (expected: CRETD-D extrapolates it from the FY2027 pattern; FY2028 dates are not announced)', expected: true },
  { date: iso(reg[2]), what: 'H-1B registration closes (expected, as above)', expected: true },
  { date: iso(note[1]), what: 'H-1B selection notices due (expected, as above)', expected: true },
];
const out = '/* A dated copy of the dates on CRETD-D Command\'s US job track (the H-1B route). Made by codex-build/gen_us_windows.js from CRETD-D\'s own file; nothing is typed by hand.\n   One page cannot read another page\'s data while it runs, so each build takes a new copy. The PhD deadlines are left out on purpose. */\nwindow.IOVU_WINDOWS = ' +
  JSON.stringify({ copied: COPIED, from: 'CRETD-D Command ' + W.VERSION.v + ', data/visa.js (researched ' + W.VISA.asOf + ')', note: 'The H-1B dates are expected, not announced.', items }, null, 2) + ';\n';
fs.writeFileSync(OUT, out);
console.log(out);
