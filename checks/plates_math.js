// The plate physics against closed forms (run in node with a stub window).
global.window = { Codex: {}, CodexView: { esc: (s) => String(s) }, addEventListener() {} };
require((process.argv[2] ? require('path').resolve(process.argv[2]) : require('path').resolve(__dirname, '..')) + '/codex/plates.js'); /* 3.0.5: runs without the folder argument too */
const T = window.CodexPlates._test;
const TAU = 2 * Math.PI;
const out = {};
// 1. pure Rabi: P_e = sin²2θ sin²(Ω̃ t) with t in ns and frequencies in MHz (angular = 2π·f·1e-3 per ns)
let worst = 0;
for (const [Om, D] of [[25, 0], [25, 30], [10, -45]]) {
  const pts = T.solveOBE(Om, D, 0, 200, 400);
  const m = T.mixing(Om, D);
  for (const q of pts) { const ex = m.s2 * Math.sin(TAU * 1e-3 * m.Wt * q.t) ** 2; worst = Math.max(worst, Math.abs((1 + q.w) / 2 - ex)); }
}
out.rabiMaxErr = worst;
// 2. steady state after a long time vs the formula
const ssPts = T.solveOBE(10, 7, 6.07, 3000, 3000);
out.steady = { numeric: (1 + ssPts[ssPts.length - 1].w) / 2, formula: T.steadyPe(10, 7, 6.07) };
// 3. Torrey on resonance: frequency of the damped oscillation for Ω_R/2π = 50 MHz, Γ/2π = 6.07 MHz -> 49.977 MHz; 1/e time 35 ns
const tor = T.solveOBE(25, 0, 6.07, 120, 24000);
const peaks = []; for (let i = 1; i < tor.length - 1; i++) if (tor[i].w > tor[i - 1].w && tor[i].w > tor[i + 1].w) peaks.push(tor[i].t);
out.torreyPeriod = (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1);
out.torreyExpected = 1000 / Math.sqrt(50 * 50 - 6.07 * 6.07 / 16);
// 4. Mollow: exact vs secular at strong drive (Ω = 20Γ), weights through the elastic share and the total
const G = 1, Om = 20, D = 15;
const nus = Array.from({ length: 24000 }, (_, i) => -100 + (200 * i) / 23999);
const ex = T.mollowExact(Om, D, G, nus);
const sec = T.mollowSecular(Om, D, G, nus);
const dnu = nus[1] - nus[0];
const area = (S) => S.reduce((a, b) => a + b, 0) * dnu / TAU;
out.mollow = { ree: ex.ree, elastic: ex.elastic, inelasticExact: area(ex.S), inelasticFormula: area(sec.S), elasticFormula: sec.elastic, sideband: sec.x1, peakRatioCheck: Math.max(...ex.S) };
console.log(JSON.stringify(out, null, 1));
