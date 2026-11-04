/* Resonance Codex — live plates: interactive diagrams on entry pages, like the portraits of the bestiary.
   Units: every frequency is f = ω/2π in MHz and every time is in ns.
   Thesis convention: Ω is the coupling, the Rabi frequency is Ω_R = 2Ω, cot 2θ = Δ/(2Ω),
   Ω̃ = √(Ω² + Δ²/4), and without decay P_e(t) = sin²2θ · sin²(Ω̃t).
   Optical Bloch equations for (u, v, w), w = ρ_ee − ρ_gg:
     u' = −Γ/2·u − Δ·v,   v' = Δ·u − Γ/2·v − Ω_R·w,   w' = Ω_R·v − Γ·(w + 1).
   Checked on 2026-10-29 against the closed forms (Rabi, steady state) and, for the resonance-fluorescence
   spectrum, the exact quantum-regression result against the dressed-atom formulas drawn as the dashed curve. */
(function () {
  'use strict';
  const C = window.Codex;
  const V = window.CodexView;
  if (!C || !V) return;
  const esc = V.esc;
  const TAU = 2 * Math.PI;
  const RB = 6.0666; // Γ/2π of the Rb-87 D2 line in MHz (Steck: lifetime 26.235 ns)

  const PLATES_FOR = {
    'rabi-oscillation': ['rabi'],
    'cr-damped-rabi': ['rabi', 'mollow'],
    'decay-rate': ['decay'],
    'mixing-angle': ['dressed'],
    'dressed-states': ['dressed', 'mollow'],
    'secular-approximation': ['dressed'],
    'cr-dressed-axis': ['bloch'],
    'cr-lindblad-atom': ['bloch'],
  };
  const START = {
    'rabi-oscillation': { rabi: { Om: 25, D: 0, G: 0 } },
    'cr-damped-rabi': { rabi: { Om: 25, D: 0, G: RB }, mollow: { Om: 25, D: 0, G: RB } },
    'decay-rate': { decay: { G: RB } },
    'mixing-angle': { dressed: { Om: 25, D: 30 } },
    'dressed-states': { dressed: { Om: 25, D: 0 }, mollow: { Om: 25, D: 20, G: RB } },
    'secular-approximation': { dressed: { Om: 25, D: 35 } },
    'cr-dressed-axis': { bloch: { Om: 25, D: 30, G: 0 } },
    'cr-lindblad-atom': { bloch: { Om: 10, D: 0, G: RB } },
  };
  const TITLES = { rabi: 'Rabi oscillation, with and without decay', mollow: 'Resonance fluorescence spectrum', decay: 'Decay and line shape', dressed: 'Dressed levels and the magic angle', bloch: 'The Bloch vector and its rotation axis' };
  const INTROS = {
    rabi: 'Move the sliders. The curve is the excited-state probability from the optical Bloch equations, solved in your browser. Γ = 0 gives the pure Rabi law of your thesis (1.5).',
    mollow: 'The solid curve is the exact spectrum of one driven atom (quantum regression theorem). The dashed curve is the dressed-atom formula with three Lorentzians, valid for strong drive. Raise Ω until the sidebands separate.',
    decay: 'Spontaneous emission empties the excited state as exp(−Γt). The same Γ is the full width at half maximum of the emitted line.',
    dressed: 'Left: the two dressed levels against the detuning, with the bare levels dashed. Right: your effective coupling δ̃/δ = cos²2θ − sin²2θ/2 from (3.33). It vanishes at the magic angle tan²2θ = 2 (3.40), where the secular approximation behind (3.47) fails for the sideband lines (3.59)–(3.61); the populations, the elastic line and the central line survive.',
    bloch: 'The drive turns the Bloch vector about the axis (2Ω, 0, Δ), tilted by 2θ from the vertical; the dressed states lie along ±n̂. Drag the sphere to turn it. With Γ > 0 the vector spirals into the steady state.',
  };
  const SLIDERS = {
    Om: { label: 'Ω/2π', hint: 'coupling; Ω_R = 2Ω', min: 0, max: 60, step: 0.5 },
    D: { label: 'Δ/2π', hint: 'detuning', min: -120, max: 120, step: 1 },
    G: { label: 'Γ/2π', hint: 'decay rate', min: 0, max: 20, step: 0.01 },
    Gd: { label: 'Γ/2π', hint: 'decay rate', min: 0.5, max: 20, step: 0.01 },
  };
  const PARAMS = { rabi: ['Om', 'D', 'G'], mollow: ['Om', 'D', 'G'], decay: ['G'], dressed: ['Om', 'D'], bloch: ['Om', 'D', 'G'] };

  /* ------------------------------ numbers ------------------------------ */
  const minus = (s) => s.replace(/^-/, '−');
  function fmt(x, d) {
    if (!isFinite(x)) return '∞';
    const dd = d == null ? 2 : d;
    if (Math.abs(x) < 0.5 * Math.pow(10, -dd)) x = 0;
    const s = Math.abs(x) >= 1000 ? Math.round(x).toLocaleString('en-US') : x.toFixed(d == null ? 2 : d);
    return minus(s);
  }
  const deg = (r) => (r * 180) / Math.PI;
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function sci(x) { const [m, e] = x.toExponential(3).split('e'); return m + ' × 10' + String(Number(e)).split('').map((c) => SUP[c] || c).join(''); }
  const subH = (t) => esc(t).replace(/_([A-Za-z0-9]+)/g, '<sub>$1</sub>');
  const subS = (t) => {
    const parts = String(t).split(/_([A-Za-z0-9]+)/); // text, sub, text, sub, …
    let out = esc(parts[0]);
    for (let i = 1; i < parts.length; i += 2) out += '<tspan dy="3" font-size="0.78em">' + esc(parts[i]) + '</tspan><tspan dy="-3">' + esc(parts[i + 1] || '\u200b') + '</tspan>';
    return out;
  };
  function mixing(Om, D) {
    const Wt = Math.sqrt(Om * Om + (D * D) / 4);
    const theta = 0.5 * Math.atan2(2 * Om, D); // cot 2θ = Δ/(2Ω), θ in (0, π/2)
    const s2 = Wt > 0 ? (Om * Om) / (Wt * Wt) : 0; // sin²2θ
    return { Wt, theta, s2, cos2: Wt > 0 ? D / (2 * Wt) : 1 };
  }

  /* optical Bloch equations, RK4; frequencies in MHz, time in ns */
  function solveOBE(Om, D, G, tmax, n) {
    const w0 = TAU * 1e-3; // MHz -> rad/ns
    const OR = 2 * Om * w0; const Dl = D * w0; const Gl = G * w0;
    const fastest = Math.sqrt(OR * OR + Dl * Dl) + Gl + 1e-9;
    const sub = Math.max(1, Math.ceil((tmax / n) / (0.04 / fastest)));
    const dt = tmax / n / sub;
    const f = (u, v, w) => [-Gl / 2 * u - Dl * v, Dl * u - Gl / 2 * v - OR * w, OR * v - Gl * (w + 1)];
    let u = 0, v = 0, w = -1;
    const out = [{ t: 0, u, v, w }];
    for (let i = 1; i <= n; i++) {
      for (let k = 0; k < sub; k++) {
        const a = f(u, v, w);
        const b = f(u + dt / 2 * a[0], v + dt / 2 * a[1], w + dt / 2 * a[2]);
        const c = f(u + dt / 2 * b[0], v + dt / 2 * b[1], w + dt / 2 * b[2]);
        const d = f(u + dt * c[0], v + dt * c[1], w + dt * c[2]);
        u += dt / 6 * (a[0] + 2 * b[0] + 2 * c[0] + d[0]);
        v += dt / 6 * (a[1] + 2 * b[1] + 2 * c[1] + d[1]);
        w += dt / 6 * (a[2] + 2 * b[2] + 2 * c[2] + d[2]);
      }
      out.push({ t: (i * tmax) / n, u, v, w });
    }
    return out;
  }
  function steadyPe(Om, D, G) {
    if (!(G > 0)) return null;
    const OR = 2 * Om;
    return (OR * OR / 4) / (D * D + OR * OR / 2 + G * G / 4);
  }

  /* complex 4×4 linear algebra for the exact spectrum */
  const cx = (re, im) => [re, im || 0];
  const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => { const m = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / m, (a[1] * b[0] - a[0] * b[1]) / m]; };
  const cabs2 = (a) => a[0] * a[0] + a[1] * a[1];
  function csolve(A, b) { // Gaussian elimination with partial pivoting
    const n = b.length;
    const M = A.map((row, i) => row.map((z) => z.slice()).concat([b[i].slice()]));
    for (let k = 0; k < n; k++) {
      let p = k;
      for (let i = k + 1; i < n; i++) if (cabs2(M[i][k]) > cabs2(M[p][k])) p = i;
      [M[k], M[p]] = [M[p], M[k]];
      const piv = M[k][k];
      if (cabs2(piv) < 1e-300) return null;
      for (let i = k + 1; i < n; i++) {
        const fct = cdiv(M[i][k], piv);
        for (let j = k; j <= n; j++) M[i][j] = csub(M[i][j], cmul(fct, M[k][j]));
      }
    }
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let s = M[i][n];
      for (let j = i + 1; j < n; j++) s = csub(s, cmul(M[i][j], x[j]));
      x[i] = cdiv(s, M[i][i]);
    }
    return x;
  }
  /* Liouvillian of the driven, decaying atom; vector (ρgg, ρeg, ρge, ρee); H = −Δ|e⟩⟨e| + Ω(σ⁺ + σ⁻) */
  function liouvillian(Om, D, G) {
    const iO = cx(0, Om), miO = cx(0, -Om);
    return [
      [cx(0), miO, iO, cx(G)],
      [miO, cx(-G / 2, D), cx(0), iO],
      [iO, cx(0), cx(-G / 2, -D), miO],
      [cx(0), iO, miO, cx(-G)],
    ];
  }
  function mollowExact(Om, D, G, nus) {
    const L = liouvillian(Om, D, G);
    // steady state: L ρ = 0 with the first row replaced by the trace condition ρgg + ρee = 1
    const A = L.map((r) => r.map((z) => z.slice()));
    A[0] = [cx(1), cx(0), cx(0), cx(1)];
    const rho = csolve(A, [cx(1), cx(0), cx(0), cx(0)]);
    if (!rho) return null;
    const ree = rho[3][0];
    const sp = rho[2]; // ⟨σ⁺⟩ = ρge
    const X0 = [rho[2], rho[3], cx(0), cx(0)]; // vec(ρ σ⁺)
    const Xc = X0.map((z, i) => csub(z, cmul(rho[i], sp))); // remove the coherent (elastic) part
    const S = nus.map((nu) => {
      const M = L.map((r, i) => r.map((z, j) => (i === j ? csub(cx(0, nu), z) : cx(-z[0], -z[1]))));
      const Y = csolve(M, Xc);
      return Y ? 2 * Y[1][0] : 0;
    });
    return { S, elastic: cabs2(rho[1]), ree };
  }
  function mollowSecular(Om, D, G, nus) {
    const m = mixing(Om, D);
    const c2 = (1 + m.cos2) / 2, s2 = (1 - m.cos2) / 2; // cos²θ, sin²θ
    const c4 = c2 * c2, s4 = s2 * s2, den = c4 + s4;
    const A0 = m.s2 * c4 * s4 / (den * den), A1 = c4 * s4 / den;
    const g0 = G * den, g1 = G * (0.5 + c2 * s2), x1 = 2 * m.Wt;
    const lor = (x, A, g) => (A * 2 * g) / (x * x + g * g);
    return { S: nus.map((nu) => lor(nu, A0, g0) + lor(nu - x1, A1, g1) + lor(nu + x1, A1, g1)), g0, g1, x1, elastic: c2 * s2 * m.cos2 * m.cos2 / (den * den) };
  }

  /* ------------------------------ drawing ------------------------------ */
  function niceTicks(lo, hi, n) {
    const span = hi - lo; if (!(span > 0)) return [lo];
    const raw = span / Math.max(1, n); const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw) || 10 * mag;
    const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return out;
  }
  /* a line chart in pixel units: crisp hairlines, 2px series lines, one axis */
  let chartN = 0;
  function lineChart(o) {
    const mid = 'pl-head-' + (++chartN);
    const W = o.w, H = o.h, P = { l: 44, r: 14, t: 24, b: 34 };
    const X = (x) => P.l + ((x - o.x0) / (o.x1 - o.x0)) * (W - P.l - P.r);
    const Y = (y) => P.t + (1 - (y - o.y0) / (o.y1 - o.y0)) * (H - P.t - P.b);
    let s = '<svg class="pl-svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria) + '">';
    for (const ty of o.yt || niceTicks(o.y0, o.y1, 4)) s += '<line class="pl-grid" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + Y(ty).toFixed(1) + '" y2="' + Y(ty).toFixed(1) + '"/><text class="pl-tick" x="' + (P.l - 6) + '" y="' + (Y(ty) + 4).toFixed(1) + '" text-anchor="end">' + esc(fmt(ty, o.yd == null ? 1 : o.yd)) + '</text>';
    for (const tx of o.xt || niceTicks(o.x0, o.x1, Math.max(3, Math.floor(W / 90)))) s += '<line class="pl-tickmark" x1="' + X(tx).toFixed(1) + '" x2="' + X(tx).toFixed(1) + '" y1="' + (H - P.b) + '" y2="' + (H - P.b + 4) + '"/><text class="pl-tick" x="' + X(tx).toFixed(1) + '" y="' + (H - P.b + 16) + '" text-anchor="middle">' + esc(fmt(tx, o.xd == null ? 0 : o.xd)) + '</text>';
    s += '<line class="pl-axis" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + (H - P.b) + '" y2="' + (H - P.b) + '"/>';
    s += '<text class="pl-axlab" x="' + (W - P.r) + '" y="' + (H - 4) + '" text-anchor="end">' + subS(o.xlab) + '</text>';
    s += '<text class="pl-axlab" x="' + (P.l - 6) + '" y="13" text-anchor="start">' + subS(o.ylab) + '</text>';
    for (const r of o.refs || []) {
      if (r.y != null) s += '<line class="pl-ref" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + Y(r.y).toFixed(1) + '" y2="' + Y(r.y).toFixed(1) + '"/>' + (r.label ? '<text class="pl-reflab" x="' + (W - P.r - 4) + '" y="' + (Y(r.y) - 5).toFixed(1) + '" text-anchor="end">' + esc(r.label) + '</text>' : '');
      if (r.x != null) s += '<line class="pl-ref" x1="' + X(r.x).toFixed(1) + '" x2="' + X(r.x).toFixed(1) + '" y1="' + P.t + '" y2="' + (H - P.b) + '"/>' + (r.label ? '<text class="pl-reflab" x="' + (X(r.x) + 5).toFixed(1) + '" y="' + (P.t + 11) + '">' + esc(r.label) + '</text>' : '');
    }
    for (const se of o.series) {
      let d = '';
      se.pts.forEach((p, i) => { const yy = Math.max(o.y0 - (o.y1 - o.y0) * 0.02, Math.min(o.y1 + (o.y1 - o.y0) * 0.02, p[1])); d += (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(yy).toFixed(1); });
      s += '<path class="pl-line ' + se.cls + '" d="' + d + '"/>';
    }
    for (const a of o.arrows || []) s += '<line class="pl-arrow" x1="' + X(a.x).toFixed(1) + '" x2="' + X(a.x).toFixed(1) + '" y1="' + Y(o.y0).toFixed(1) + '" y2="' + Y(a.y).toFixed(1) + '" marker-end="url(#' + mid + ')"/><text class="pl-reflab" x="' + (X(a.x) + 6).toFixed(1) + '" y="' + (Y(a.y) + 4).toFixed(1) + '">' + esc(a.label) + '</text>';
    for (const m of o.marks || []) s += '<circle class="pl-dot ' + (m.cls || 's1') + '" cx="' + X(m.x).toFixed(1) + '" cy="' + Y(m.y).toFixed(1) + '" r="4.5"/>' + (m.label ? '<text class="pl-reflab" x="' + (X(m.x) + (m.dx || 8)).toFixed(1) + '" y="' + (Y(m.y) + (m.dy || -7)).toFixed(1) + '" text-anchor="' + (m.anchor || 'start') + '">' + esc(m.label) + '</text>' : '');
    s += '<defs><marker id="' + mid + '" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 8 4 0 8z" class="pl-headfill"/></marker></defs>';
    s += '<line class="pl-cross" x1="0" x2="0" y1="' + P.t + '" y2="' + (H - P.b) + '" visibility="hidden"/>';
    return { svg: s + '</svg>', X, Y, P, W, H };
  }
  function legendHtml(items) {
    return '<div class="pl-legend">' + items.map((it) => '<span class="pl-key"><svg width="22" height="10" aria-hidden="true"><line x1="1" x2="21" y1="5" y2="5" class="pl-line ' + it.cls + '"/></svg>' + subH(it.label) + '</span>').join('') + '</div>';
  }
  /* crosshair and tooltip: the vertical hairline snaps to the nearest sample; arrows move it from the keyboard */
  function attachCrosshair(fig, chart, xs, rows, xfmt) {
    const svg = fig.querySelector('svg'); const line = svg.querySelector('.pl-cross');
    const tip = document.createElement('div'); tip.className = 'pl-tip'; tip.hidden = true; fig.appendChild(tip);
    let idx = -1;
    const show = (i) => {
      idx = Math.max(0, Math.min(xs.length - 1, i));
      const px = chart.X(xs[idx]);
      line.setAttribute('x1', px); line.setAttribute('x2', px); line.setAttribute('visibility', 'visible');
      tip.textContent = '';
      const head = document.createElement('div'); head.className = 'pl-tip-x'; head.textContent = xfmt(xs[idx]); tip.appendChild(head);
      for (const r of rows) {
        const row = document.createElement('div'); row.className = 'pl-tip-row';
        const k = document.createElement('span'); k.className = 'pl-tip-key ' + r.cls; row.appendChild(k);
        const v = document.createElement('b'); v.textContent = r.fmt(r.vals[idx]); row.appendChild(v);
        const lab = document.createElement('span'); lab.textContent = r.label; row.appendChild(lab);
        tip.appendChild(row);
      }
      tip.hidden = false;
      const fw = fig.clientWidth; const tw = tip.offsetWidth;
      tip.style.left = Math.round(Math.min(Math.max(4, px + 12), fw - tw - 4)) + 'px';
      tip.style.top = Math.round(chart.P.t + 4) + 'px';
    };
    const hide = () => { line.setAttribute('visibility', 'hidden'); tip.hidden = true; };
    const nearest = (clientX) => {
      const r = svg.getBoundingClientRect(); const x = clientX - r.left;
      let best = 0, bd = Infinity;
      for (let i = 0; i < xs.length; i++) { const d = Math.abs(chart.X(xs[i]) - x); if (d < bd) { bd = d; best = i; } }
      return best;
    };
    svg.addEventListener('pointermove', (ev) => show(nearest(ev.clientX)));
    svg.addEventListener('pointerleave', hide);
    fig.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { ev.preventDefault(); const step = Math.max(1, Math.round(xs.length / 60)); show((idx < 0 ? 0 : idx) + (ev.key === 'ArrowRight' ? step : -step)); }
      else if (ev.key === 'Escape') hide();
    });
    fig.addEventListener('blur', hide);
  }
  function tableHtml(head, rows) {
    return '<details class="pl-table"><summary>Values</summary><div class="pl-tablewrap"><table><thead><tr>' + head.map((h) => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map((r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></details>';
  }
  const readout = (items) => '<dl class="pl-read">' + items.filter(Boolean).map((it) => '<div' + (it.warn ? ' class="warn"' : '') + '><dt>' + subH(it.k) + '</dt><dd>' + subH(it.v) + '</dd></div>').join('') + '</dl>';
  const sample = (arr, n) => { const out = []; for (let i = 0; i < n; i++) out.push(arr[Math.round((i * (arr.length - 1)) / (n - 1))]); return out; };

  /* ------------------------------ the five plates ------------------------------ */
  function drawRabi(st, w) {
    const { Om, D, G } = st.p;
    const m = mixing(Om, D);
    const T = m.Wt > 0 ? 1000 / (2 * m.Wt) : Infinity; // period of P_e, ns
    const gD = G * (0.5 + m.s2 / 4); // strong-drive damping rate (MHz, per 2π)
    const tDecay = gD > 0 ? 1000 / (TAU * gD) : Infinity;
    let tmax = G > 0 ? 5 * tDecay : 4 * T;
    if (isFinite(T)) tmax = Math.max(tmax, Math.min(2.2 * T, 1000));
    tmax = Math.min(1000, Math.max(20, isFinite(tmax) ? tmax : 200));
    const n = Math.max(240, Math.min(900, Math.round(w * 1.2)));
    const withG = solveOBE(Om, D, G, tmax, n);
    const noG = G > 0 ? solveOBE(Om, D, 0, tmax, n) : null;
    const xs = withG.map((q) => q.t);
    const pe = withG.map((q) => (1 + q.w) / 2);
    const pe0 = noG ? noG.map((q) => (1 + q.w) / 2) : null;
    const ss = steadyPe(Om, D, G);
    const series = [];
    if (pe0) series.push({ cls: 's2', pts: xs.map((x, i) => [x, pe0[i]]) });
    series.push({ cls: 's1', pts: xs.map((x, i) => [x, pe[i]]) });
    const chart = lineChart({ w, h: Math.round(Math.min(300, Math.max(200, w * 0.42))), x0: 0, x1: tmax, y0: 0, y1: 1, yt: [0, 0.25, 0.5, 0.75, 1], yd: 2, xlab: 'time (ns)', ylab: 'P_e(t)', aria: 'Excited-state probability against time', series, refs: ss != null ? [{ y: ss, label: 'steady state ' + fmt(ss, 3) }] : [] });
    const rows = [{ cls: 's1', label: G > 0 ? 'with decay' : 'P_e', vals: pe, fmt: (v) => fmt(v, 3) }];
    if (pe0) rows.push({ cls: 's2', label: 'without decay', vals: pe0, fmt: (v) => fmt(v, 3) });
    const OR = 2 * Om;
    const lam = D === 0 && G > 0 ? Math.sqrt(Math.max(0, OR * OR - G * G / 16)) : null;
    const over = D === 0 && G > 0 && OR < G / 4;
    const read = readout([
      { k: 'Rabi frequency Ω_R/2π = 2Ω/2π', v: fmt(OR, 1) + ' MHz' },
      { k: 'Generalized Ω̃/2π', v: fmt(m.Wt, 2) + ' MHz' },
      { k: 'P_e oscillates at 2Ω̃/2π', v: isFinite(T) ? fmt(2 * m.Wt, 2) + ' MHz · period ' + fmt(T, 1) + ' ns' : 'no oscillation' },
      { k: 'Largest excitation sin²2θ', v: fmt(m.s2, 3) + ' (θ = ' + fmt(deg(m.theta), 1) + '°)' },
      G > 0 && D === 0 ? { k: 'Damped frequency √(Ω_R² − Γ²/16)/2π', v: over ? 'none: overdamped' : fmt(lam, 3) + ' MHz' } : null,
      G > 0 ? { k: 'Damping Γ(1/2 + sin²2θ/4) (for 2Ω̃ ≫ Γ), 1/e time', v: fmt(1000 / (TAU * gD), 1) + ' ns' } : null,
      ss != null ? { k: 'Steady state P_e', v: fmt(ss, 4) } : null,
      over ? { k: 'Overdamped', v: 'Ω_R < Γ/4: P_e rises without oscillating', warn: true } : null,
    ]);
    const legend = pe0 ? legendHtml([{ cls: 's1', label: 'with decay Γ' }, { cls: 's2', label: 'without decay (Γ = 0)' }]) : '';
    const tab = tableHtml(['t (ns)', G > 0 ? 'P_e with decay' : 'P_e'].concat(pe0 ? ['P_e without decay'] : []), sample(xs.map((x, i) => i), 11).map((i) => [fmt(xs[i], 1), fmt(pe[i], 4)].concat(pe0 ? [fmt(pe0[i], 4)] : [])));
    return { chart, xs, rows, xfmt: (x) => 't = ' + fmt(x, 1) + ' ns', html: legend + '<div class="pl-fig" tabindex="0" aria-label="Chart: use the left and right arrow keys to read values">' + chart.svg + '</div>' + read + tab };
  }

  function drawMollow(st, w) {
    const { Om, D, G } = st.p;
    const m = mixing(Om, D);
    const g = Math.max(G, 0.05);
    const R = Math.max(30, 2 * m.Wt + 7 * g);
    const n = (Math.max(300, Math.min(800, Math.round(w * 1.2))) >> 1) << 1; // even: the grid avoids ν = 0 exactly
    const nus = Array.from({ length: n }, (_, i) => -R + (2 * R * i) / (n - 1));
    const ex = G > 0 ? mollowExact(Om, D, G, nus) : null;
    if (!ex) return { html: '<p class="muted small">Set Γ above zero: without decay the atom emits no light.</p>' };
    if (!(ex.ree > 1e-9)) return { html: '<p class="muted small">Set Ω above zero: without a drive the atom stays in |g⟩ and emits nothing.</p>' };
    const sec = mollowSecular(Om, D, G, nus);
    const top = Math.max(...ex.S, 1e-12);
    const S1 = ex.S.map((v) => v / top), S2 = sec.S.map((v) => v / top);
    const elFrac = ex.ree > 0 ? ex.elastic / ex.ree : 0;
    const strong = (2 * m.Wt) / Math.max(G, 1e-9);
    const chart = lineChart({ w, h: Math.round(Math.min(300, Math.max(200, w * 0.42))), x0: -R, x1: R, y0: 0, y1: 1.08, yt: [0, 0.25, 0.5, 0.75, 1], yd: 2, xlab: '(ν − ν_L)/MHz', ylab: 'inelastic spectrum (peak = 1)', aria: 'Resonance fluorescence spectrum',
      series: [{ cls: 's2 dash', pts: nus.map((x, i) => [x, S2[i]]) }, { cls: 's1', pts: nus.map((x, i) => [x, S1[i]]) }],
      arrows: elFrac > 0.002 ? [{ x: 0, y: 1.04, label: 'elastic ' + fmt(100 * elFrac, 1) + '%' }] : [] });
    const read = readout([
      { k: 'Sidebands at ±2Ω̃/2π', v: '±' + fmt(2 * m.Wt, 2) + ' MHz' },
      { k: 'Centre FWHM 2Γ(cos⁴θ + sin⁴θ)', v: fmt(2 * sec.g0, 2) + ' MHz' },
      { k: 'Sideband FWHM 2Γ(1/2 + sin²2θ/4)', v: fmt(2 * sec.g1, 2) + ' MHz' },
      { k: 'Elastic share of the light', v: fmt(100 * elFrac, 1) + '% (formula ' + fmt(100 * sec.elastic / Math.max(ex.ree, 1e-12), 1) + '%)' },
      { k: 'Drive strength 2Ω̃/Γ', v: fmt(strong, 1) + (strong < 3 ? ': the dashed formula needs this ≫ 1' : '') , warn: strong < 3 },
    ]);
    const legend = legendHtml([{ cls: 's1', label: 'exact (one atom)' }, { cls: 's2 dash', label: 'dressed-atom formula' }]);
    const tab = tableHtml(['(ν − ν_L) (MHz)', 'exact', 'formula'], sample(nus.map((x, i) => i), 13).map((i) => [fmt(nus[i], 1), fmt(S1[i], 3), fmt(S2[i], 3)]));
    return { chart, xs: nus, rows: [{ cls: 's1', label: 'exact', vals: S1, fmt: (v) => fmt(v, 3) }, { cls: 's2', label: 'formula', vals: S2, fmt: (v) => fmt(v, 3) }], xfmt: (x) => 'ν − ν_L = ' + fmt(x, 1) + ' MHz',
      html: legend + '<div class="pl-fig" tabindex="0" aria-label="Chart: use the left and right arrow keys to read values">' + chart.svg + '</div>' + read + tab };
  }

  function drawDecay(st, w) {
    const { G } = st.p;
    const g = Math.max(G, 0.05);
    const tau = 1000 / (TAU * g); // ns
    const half = w >= 560 ? Math.floor((w - 16) / 2) : w;
    const n = 200;
    const ts = Array.from({ length: n }, (_, i) => (5 * tau * i) / (n - 1));
    const pe = ts.map((t) => Math.exp(-t / tau));
    const c1 = lineChart({ w: half, h: 220, x0: 0, x1: 5 * tau, y0: 0, y1: 1, yt: [0, 0.5, 1], yd: 1, xlab: 'time (ns)', ylab: 'P_e(t)', aria: 'Exponential decay', series: [{ cls: 's1', pts: ts.map((t, i) => [t, pe[i]]) }], refs: [{ x: tau, label: 'τ = 1/Γ' }], marks: [{ x: tau, y: Math.exp(-1), label: '1/e', cls: 's1' }] });
    const R = 5 * g;
    const nus = Array.from({ length: n }, (_, i) => -R + (2 * R * i) / (n - 1));
    const lor = nus.map((x) => 1 / (1 + (2 * x / g) ** 2));
    const c2 = lineChart({ w: half, h: 220, x0: -R, x1: R, y0: 0, y1: 1.05, yt: [0, 0.5, 1], yd: 1, xlab: '(ν − ν₀)/MHz', ylab: 'line shape (peak = 1)', aria: 'Lorentzian line shape', series: [{ cls: 's1', pts: nus.map((x, i) => [x, lor[i]]) }], refs: [{ y: 0.5, label: 'FWHM = Γ/2π' }], marks: [{ x: -g / 2, y: 0.5, cls: 's1' }, { x: g / 2, y: 0.5, cls: 's1' }] });
    const read = readout([
      { k: 'Lifetime τ = 1/Γ', v: fmt(tau, 2) + ' ns' },
      { k: 'Line width (FWHM) Γ/2π', v: fmt(G, 2) + ' MHz' },
      { k: 'Γ in s⁻¹', v: sci(TAU * G * 1e6) },
    ]);
    return { charts: [{ chart: c1, xs: ts, rows: [{ cls: 's1', label: 'P_e', vals: pe, fmt: (v) => fmt(v, 3) }], xfmt: (x) => 't = ' + fmt(x, 1) + ' ns' }, { chart: c2, xs: nus, rows: [{ cls: 's1', label: 'line shape', vals: lor, fmt: (v) => fmt(v, 3) }], xfmt: (x) => 'ν − ν₀ = ' + fmt(x, 2) + ' MHz' }],
      html: '<div class="pl-pair"><div class="pl-fig" tabindex="0" aria-label="Decay chart">' + c1.svg + '</div><div class="pl-fig" tabindex="0" aria-label="Line shape chart">' + c2.svg + '</div></div>' + read +
        tableHtml(['t (ns)', 'P_e'], sample(ts.map((t, i) => i), 6).map((i) => [fmt(ts[i], 1), fmt(pe[i], 4)])) };
  }

  function drawDressed(st, w) {
    const { Om, D } = st.p;
    const m = mixing(Om, D);
    const half = w >= 560 ? Math.floor((w - 16) / 2) : w;
    const R = Math.max(60, 4 * Math.max(Om, 5));
    const n = 241;
    const ds = Array.from({ length: n }, (_, i) => -R + (2 * R * i) / (n - 1));
    const Ep = ds.map((d) => Math.sqrt(Om * Om + d * d / 4)), Em = Ep.map((e) => -e);
    const top = Math.max(Ep[0], R / 2) * 1.08;
    const c1 = lineChart({ w: half, h: 250, x0: -R, x1: R, y0: -top, y1: top, xlab: 'Δ/2π (MHz)', ylab: 'energy/h (MHz)', yd: 0, aria: 'Dressed levels against detuning',
      series: [{ cls: 's2 dash', pts: ds.map((d) => [d, d / 2]) }, { cls: 's2 dash', pts: ds.map((d) => [d, -d / 2]) }, { cls: 's1', pts: ds.map((d, i) => [d, Ep[i]]) }, { cls: 's1', pts: ds.map((d, i) => [d, Em[i]]) }],
      refs: [{ x: D }], marks: [{ x: D, y: m.Wt, label: '|+⟩', cls: 's1' }, { x: D, y: -m.Wt, label: '|−⟩', cls: 's1', dy: 16 }] });
    const ths = Array.from({ length: 181 }, (_, i) => i / 2);
    const dd = ths.map((t) => { const c = Math.cos(2 * t * Math.PI / 180), s = Math.sin(2 * t * Math.PI / 180); return c * c - s * s / 2; });
    const magic = deg(0.5 * Math.atan(Math.SQRT2));
    const thNow = deg(m.theta);
    const ddNow = Math.cos(2 * m.theta) ** 2 - Math.sin(2 * m.theta) ** 2 / 2;
    const c2 = lineChart({ w: half, h: 250, x0: 0, x1: 90, y0: -0.6, y1: 1.05, xt: [0, 15, 30, 45, 60, 75, 90], yt: [-0.5, 0, 0.5, 1], yd: 1, xlab: 'θ (degrees)', ylab: 'δ̃/δ', aria: 'Effective dipole-dipole coupling against the mixing angle',
      series: [{ cls: 's1', pts: ths.map((t, i) => [t, dd[i]]) }], refs: [{ y: 0 }, { x: magic, label: fmt(magic, 1) + '°' }, { x: 90 - magic, label: fmt(90 - magic, 1) + '°' }],
      marks: [{ x: thNow, y: ddNow, cls: 's1', label: 'now', dy: ddNow > 0.7 ? 16 : -8 }] });
    const nearMagic = Math.abs(ddNow) < 0.12;
    const read = readout([
      { k: 'Mixing angle θ', v: fmt(thNow, 2) + '° (cot 2θ = Δ/2Ω)' },
      { k: 'Dressed splitting 2Ω̃/2π', v: fmt(2 * m.Wt, 2) + ' MHz' },
      { k: 'sin²2θ', v: fmt(m.s2, 3) },
      { k: 'δ̃/δ = cos²2θ − sin²2θ/2', v: fmt(ddNow, 3) },
      { k: 'Magic angle (tan²2θ = 2)', v: 'θ = ' + fmt(magic, 2) + '° and ' + fmt(90 - magic, 2) + '°, that is 2θ = ' + fmt(2 * magic, 2) + '° and ' + fmt(180 - 2 * magic, 2) + '° (the axis tilt), at Δ/2Ω = ±' + fmt(1 / Math.SQRT2, 3) },
      nearMagic ? { k: 'Near the magic angle', v: 'δ̃ is small here: the secular approximation behind (3.47) needs |δ̃| ≫ Γ, so only the sideband lines (3.59)–(3.61) are affected', warn: true } : null,
    ]);
    return { charts: [{ chart: c1, xs: ds, rows: [{ cls: 's1', label: '|+⟩ energy', vals: Ep, fmt: (v) => fmt(v, 2) + ' MHz' }, { cls: 's2', label: 'bare |e⟩ level', vals: ds.map((d) => d / 2), fmt: (v) => fmt(v, 2) + ' MHz' }], xfmt: (x) => 'Δ/2π = ' + fmt(x, 1) + ' MHz' },
      { chart: c2, xs: ths, rows: [{ cls: 's1', label: 'δ̃/δ', vals: dd, fmt: (v) => fmt(v, 3) }], xfmt: (x) => 'θ = ' + fmt(x, 1) + '°' }],
      html: legendHtml([{ cls: 's1', label: 'dressed levels ±Ω̃' }, { cls: 's2 dash', label: 'bare levels ±Δ/2' }]) + '<div class="pl-pair"><div class="pl-fig" tabindex="0" aria-label="Dressed levels chart">' + c1.svg + '</div><div class="pl-fig" tabindex="0" aria-label="Effective coupling chart">' + c2.svg + '</div></div>' + read +
        tableHtml(['θ (°)', 'δ̃/δ'], [0, 15, 27.37, 30, 45, 60, 62.63, 75, 90].map((t) => { const c = Math.cos(2 * t * Math.PI / 180), s = Math.sin(2 * t * Math.PI / 180); return [fmt(t, 2), fmt(c * c - s * s / 2, 3)]; })) };
  }

  function drawBloch(st, w) {
    const { Om, D, G } = st.p;
    const m = mixing(Om, D);
    const T = m.Wt > 0 ? 1000 / (2 * m.Wt) : 200;
    const gD = G * (0.5 + m.s2 / 4);
    let tmax = G > 0 ? Math.min(1000, 4 * 1000 / (TAU * Math.max(gD, 1e-6))) : Math.min(1000, 1.0 * T);
    tmax = Math.max(10, tmax);
    if (st.t == null || st.tmax !== tmax) { st.t = st.t == null ? (G > 0 ? tmax : tmax / 2) : Math.min(st.t, tmax); st.tmax = tmax; }
    const key = [Om, D, G, tmax].join('|');
    if (!st.cache || st.cache.key !== key) st.cache = { key, pts: solveOBE(Om, D, G, tmax, 600) };
    const pts = st.cache.pts;
    const size = Math.min(w, 420);
    const Rr = size * 0.36, cxp = size / 2, cyp = size / 2 + 6;
    const ph = st.view.az * Math.PI / 180, el = st.view.el * Math.PI / 180;
    const proj = (x, y, z) => { const xr = x * Math.cos(ph) - y * Math.sin(ph); const yr = x * Math.sin(ph) + y * Math.cos(ph); return { X: cxp + Rr * xr, Y: cyp - Rr * (z * Math.cos(el) - yr * Math.sin(el)), d: yr * Math.cos(el) + z * Math.sin(el) }; };
    const path = (arr, front) => { let d = ''; let on = false; for (const p of arr) { const q = proj(p[0], p[1], p[2]); const f = q.d <= 0; if (f === front) { d += (on ? 'L' : 'M') + q.X.toFixed(1) + ' ' + q.Y.toFixed(1); on = true; } else on = false; } return d; };
    const ring = (fn) => Array.from({ length: 145 }, (_, i) => fn((i / 144) * TAU));
    const eq = ring((a) => [Math.cos(a), Math.sin(a), 0]);
    const mer = ring((a) => [Math.sin(a), 0, Math.cos(a)]);
    const nrm = Math.sqrt(4 * Om * Om + D * D) || 1;
    const n = [2 * Om / nrm, 0, D / nrm];
    // the circle the vector traces without decay: points with S·n = n_z·(−1)… (cone about n through the south pole)
    const k = -n[2];
    const e1 = [n[2], 0, -n[0]]; const e2 = [0, 1, 0];
    const rc = Math.sqrt(Math.max(0, 1 - k * k));
    const circ = ring((a) => [k * n[0] + rc * (Math.cos(a) * e1[0] + Math.sin(a) * e2[0]), k * n[1] + rc * (Math.cos(a) * e1[1] + Math.sin(a) * e2[1]), k * n[2] + rc * (Math.cos(a) * e1[2] + Math.sin(a) * e2[2])]);
    const iNow = Math.round((st.t / tmax) * (pts.length - 1));
    const traj = pts.slice(0, iNow + 1).map((q) => [q.u, q.v, q.w]);
    const now = pts[iNow];
    const Pn = proj(now.u, now.v, now.w);
    const tip1 = proj(n[0], n[1], n[2]), tip2 = proj(-n[0], -n[1], -n[2]), o = proj(0, 0, 0);
    const top = proj(0, 0, 1), bot = proj(0, 0, -1);
    const axU = proj(1.18, 0, 0), axV = proj(0, 1.18, 0);
    let s = '<svg class="pl-svg pl-bloch" width="' + size + '" height="' + (size + 12) + '" viewBox="0 0 ' + size + ' ' + (size + 12) + '" role="img" aria-label="Bloch sphere: the state vector and the rotation axis tilted by 2θ">';
    s += '<circle class="pl-sphere" cx="' + cxp + '" cy="' + cyp + '" r="' + Rr + '"/>';
    s += '<path class="pl-grid back" d="' + path(eq, false) + '"/><path class="pl-grid back" d="' + path(mer, false) + '"/><path class="pl-line s2 back" d="' + path(circ, false) + '"/><path class="pl-line s1 back" d="' + path(traj, false) + '"/>';
    s += '<line class="pl-axis thin" x1="' + o.X + '" y1="' + o.Y + '" x2="' + axU.X.toFixed(1) + '" y2="' + axU.Y.toFixed(1) + '"/><text class="pl-tick" x="' + (axU.X + 4).toFixed(1) + '" y="' + (axU.Y + 4).toFixed(1) + '">u</text>';
    s += '<line class="pl-axis thin" x1="' + o.X + '" y1="' + o.Y + '" x2="' + axV.X.toFixed(1) + '" y2="' + axV.Y.toFixed(1) + '"/><text class="pl-tick" x="' + (axV.X + 4).toFixed(1) + '" y="' + (axV.Y + 4).toFixed(1) + '">v</text>';
    s += '<line class="pl-axis thin" x1="' + bot.X + '" y1="' + bot.Y + '" x2="' + top.X.toFixed(1) + '" y2="' + top.Y.toFixed(1) + '"/>';
    s += '<text class="pl-reflab" x="' + (top.X + 8).toFixed(1) + '" y="' + (top.Y - 4).toFixed(1) + '">|e⟩</text><text class="pl-reflab" x="' + (bot.X + 8).toFixed(1) + '" y="' + (bot.Y + 14).toFixed(1) + '">|g⟩</text>';
    s += '<path class="pl-grid" d="' + path(eq, true) + '"/><path class="pl-grid" d="' + path(mer, true) + '"/><path class="pl-line s2" d="' + path(circ, true) + '"/>';
    s += '<line class="pl-naxis" x1="' + tip2.X.toFixed(1) + '" y1="' + tip2.Y.toFixed(1) + '" x2="' + tip1.X.toFixed(1) + '" y2="' + tip1.Y.toFixed(1) + '"/>';
    s += '<text class="pl-reflab" x="' + (tip1.X + 6).toFixed(1) + '" y="' + (tip1.Y - 4).toFixed(1) + '">+n̂</text><text class="pl-reflab" x="' + (tip2.X + 6).toFixed(1) + '" y="' + (tip2.Y + 12).toFixed(1) + '">−n̂</text>';
    s += '<path class="pl-line s1" d="' + path(traj, true) + '"/>';
    s += '<line class="pl-vec" x1="' + o.X + '" y1="' + o.Y + '" x2="' + Pn.X.toFixed(1) + '" y2="' + Pn.Y.toFixed(1) + '"/><circle class="pl-dot s1" cx="' + Pn.X.toFixed(1) + '" cy="' + Pn.Y.toFixed(1) + '" r="5"/>';
    s += '</svg>';
    const pe = (1 + now.w) / 2;
    const read = readout([
      { k: 'Axis tilt 2θ from |e⟩', v: fmt(2 * deg(m.theta), 1) + '° (θ = ' + fmt(deg(m.theta), 1) + '°)' },
      { k: 'Turn rate 2Ω̃/2π', v: fmt(2 * m.Wt, 2) + ' MHz' },
      { k: 'Time', v: fmt(st.t, 1) + ' ns of ' + fmt(tmax, 0) },
      { k: 'Bloch vector (u, v, w)', v: '(' + fmt(now.u, 2) + ', ' + fmt(now.v, 2) + ', ' + fmt(now.w, 2) + ')' },
      { k: 'P_e now', v: fmt(pe, 3) + (G === 0 ? ' · largest sin²2θ = ' + fmt(m.s2, 3) : '') },
    ]);
    return { html: legendHtml([{ cls: 's1', label: 'Bloch vector path' }, { cls: 's2', label: 'circle without decay' }]) + '<div class="pl-fig pl-sphere-wrap" tabindex="0" aria-label="Bloch sphere. Drag, or use the arrow keys, to turn it.">' + s + '</div>' + read, bloch: true, tmax };
  }

  const DRAW = { rabi: drawRabi, mollow: drawMollow, decay: drawDecay, dressed: drawDressed, bloch: drawBloch };

  /* ------------------------------ mounting ------------------------------ */
  const states = new WeakMap();
  function controlsHtml(kind, st) {
    const presets = PARAMS[kind].includes('G') ? '<div class="pl-presets"><button type="button" class="pl-btn ghost" data-pl-preset="rb">Rb-87 D2 (Γ/2π = 6.07 MHz)</button>' + (kind === 'decay' ? '' : '<button type="button" class="pl-btn ghost" data-pl-preset="nodecay">No decay</button>') + '<button type="button" class="pl-btn ghost" data-pl-preset="reset">Start values</button></div>' : '<div class="pl-presets"><button type="button" class="pl-btn ghost" data-pl-preset="magic">Go to the magic angle</button><button type="button" class="pl-btn ghost" data-pl-preset="reset">Start values</button></div>';
    return '<div class="pl-controls">' + PARAMS[kind].map((k) => {
      const d = kind === 'decay' && k === 'G' ? SLIDERS.Gd : SLIDERS[k]; const id = 'pl-' + st.uid + '-' + k;
      return '<label class="pl-slider" for="' + id + '"><span class="pl-lab">' + esc(d.label) + ' <small>' + subH(d.hint) + '</small></span><input id="' + id + '" type="range" min="' + d.min + '" max="' + d.max + '" step="' + d.step + '" value="' + st.p[k] + '" data-pl-k="' + k + '"><output>' + esc(fmt(st.p[k], k === 'G' ? 2 : 1)) + ' MHz</output></label>';
    }).join('') + '</div>' + presets;
  }
  let uid = 0;
  function draw(el) {
    const st = states.get(el); if (!st) return;
    const body = el.querySelector('.pl-body');
    const w = Math.max(260, Math.floor(body.clientWidth || el.clientWidth || 600));
    const out = DRAW[st.kind](st, w);
    body.innerHTML = out.html;
    const figs = body.querySelectorAll('.pl-fig');
    if (out.chart) attachCrosshair(figs[0], out.chart, out.xs, out.rows, out.xfmt);
    if (out.charts) out.charts.forEach((c, i) => figs[i] && attachCrosshair(figs[i], c.chart, c.xs, c.rows, c.xfmt));
    if (out.bloch) {
      attachBloch(el, st, body);
      const ti = el.querySelector('[data-pl-t]');
      if (ti) { ti.max = st.tmax.toFixed(2); ti.step = (st.tmax / 600).toFixed(4); if (document.activeElement !== ti || st.playing) ti.value = st.t.toFixed(3); const o = ti.parentElement.querySelector('output'); if (o) o.textContent = fmt(st.t, 1) + ' ns'; }
      const pb = el.querySelector('[data-pl-play]'); if (pb) pb.textContent = st.playing ? 'Pause' : 'Play';
    }
  }
  function attachBloch(el, st, body) {
    const fig = body.querySelector('.pl-sphere-wrap');
    let drag = null;
    fig.addEventListener('pointerdown', (ev) => { drag = { x: ev.clientX, y: ev.clientY, az: st.view.az, el: st.view.el }; fig.setPointerCapture(ev.pointerId); });
    fig.addEventListener('pointermove', (ev) => {
      if (!drag) return;
      st.view.az = drag.az - (ev.clientX - drag.x) * 0.5;
      st.view.el = Math.max(-80, Math.min(80, drag.el + (ev.clientY - drag.y) * 0.4));
      schedule(el);
    });
    const end = () => { drag = null; };
    fig.addEventListener('pointerup', end); fig.addEventListener('pointercancel', end);
    fig.addEventListener('keydown', (ev) => {
      const map = { ArrowLeft: [8, 0], ArrowRight: [-8, 0], ArrowUp: [0, -6], ArrowDown: [0, 6] };
      if (!map[ev.key]) return;
      ev.preventDefault(); st.view.az += map[ev.key][0]; st.view.el = Math.max(-80, Math.min(80, st.view.el + map[ev.key][1])); draw(el); el.querySelector('.pl-sphere-wrap').focus();
    });
  }
  const pending = new Set(); let raf = 0;
  function schedule(el) { pending.add(el); if (!raf) raf = requestAnimationFrame(() => { raf = 0; for (const x of pending) draw(x); pending.clear(); }); }
  function play(el) {
    const st = states.get(el);
    if (!st || !st.playing) return;
    const now = performance.now();
    const dt = st.last ? now - st.last : 16; st.last = now;
    st.t += (st.tmax / 6000) * dt; // the whole window in six seconds
    if (st.t >= st.tmax) { st.t = st.tmax; st.playing = false; }
    draw(el);
    if (st.playing && el.isConnected) requestAnimationFrame(() => play(el)); else { st.playing = false; st.last = 0; const b = el.querySelector('[data-pl-play]'); if (b) b.textContent = 'Play'; }
  }

  function mount(el) {
    if (states.has(el)) return;
    const kind = el.dataset.plate; const entry = el.dataset.entry;
    if (!DRAW[kind]) return;
    const start = Object.assign({ Om: 25, D: 0, G: RB }, (START[entry] || {})[kind] || {});
    const st = { kind, entry, uid: ++uid, p: Object.assign({}, start), start, view: { az: -35, el: 18 }, t: null, tmax: null, playing: false, last: 0 };
    states.set(el, st);
    const timeBar = kind === 'bloch' ? '<div class="pl-time"><button type="button" class="pl-btn" data-pl-play>Play</button><label class="pl-slider pl-tslider" for="pl-' + st.uid + '-t"><span class="pl-lab">time</span><input id="pl-' + st.uid + '-t" type="range" min="0" max="100" step="0.1" value="100" data-pl-t><output>…</output></label><button type="button" class="pl-btn ghost" data-pl-view>Reset view</button></div>' : '';
    el.innerHTML = '<p class="pl-intro">' + esc(INTROS[kind]) + '</p>' + controlsHtml(kind, st) + timeBar + '<div class="pl-body"></div>';
    el.addEventListener('input', (ev) => {
      const t = ev.target;
      if (t.dataset.plK) { st.p[t.dataset.plK] = Number(t.value); const o = t.parentElement.querySelector('output'); if (o) o.textContent = fmt(st.p[t.dataset.plK], t.dataset.plK === 'G' ? 2 : 1) + ' MHz'; if (st.kind === 'bloch') st.t = null; schedule(el); }
      if (t.hasAttribute('data-pl-t')) { st.t = Number(t.value); st.playing = false; schedule(el); }
    });
    el.addEventListener('click', (ev) => {
      const pr = ev.target.closest('[data-pl-preset]');
      if (pr) {
        const k = pr.dataset.plPreset;
        if (k === 'rb') st.p.G = RB;
        else if (k === 'nodecay') st.p.G = 0;
        else if (k === 'magic') st.p.D = Math.round(2 * Math.max(st.p.Om, 1) / Math.SQRT2 * 10) / 10; // cot 2θ = 1/√2
        else st.p = Object.assign({}, st.start);
        if (st.kind === 'bloch') st.t = null;
        el.querySelectorAll('[data-pl-k]').forEach((inp) => { inp.value = st.p[inp.dataset.plK]; const o = inp.parentElement.querySelector('output'); if (o) o.textContent = fmt(st.p[inp.dataset.plK], inp.dataset.plK === 'G' ? 2 : 1) + ' MHz'; });
        draw(el); return;
      }
      if (ev.target.closest('[data-pl-play]')) {
        st.playing = !st.playing;
        if (st.playing) { if (st.t >= st.tmax) st.t = 0; st.last = 0; requestAnimationFrame(() => play(el)); }
        ev.target.closest('[data-pl-play]').textContent = st.playing ? 'Pause' : 'Play';
        return;
      }
      if (ev.target.closest('[data-pl-view]')) { st.view = { az: -35, el: 18 }; draw(el); }
    });
    draw(el);
  }
  function mountAll(root) { (root || document).querySelectorAll('.plate-mount[data-plate]').forEach(mount); }
  let resizeTimer = 0;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => document.querySelectorAll('.plate-mount[data-plate]').forEach((el) => { if (states.has(el)) draw(el); }), 150); });

  window.CodexPlates = {
    has: (id) => !!PLATES_FOR[id],
    kinds: (id) => PLATES_FOR[id] || [],
    title: (kind) => TITLES[kind] || 'Live plate',
    mountAll,
    // exposed for the checks
    _test: { solveOBE, steadyPe, mollowExact, mollowSecular, mixing },
  };
})();
