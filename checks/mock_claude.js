// Injected before page scripts: a stand-in for the claude.ai runtime (db, user, comments, sample).
(() => {
  const store = new Map(); const listeners = [];
  const emit = (l) => {
    if (l.kind === 'doc') { const d = store.get(l.path); l.cb({ id: l.path.split('/').pop(), exists: !!d, data: () => d, metadata: {} }); return; }
    const depth = l.path.split('/').length + 1;
    const docs = [...store.entries()].filter(([p]) => p.startsWith(l.path + '/') && p.split('/').length === depth).map(([p, d]) => ({ id: p.split('/').pop(), exists: true, data: () => d }));
    l.cb({ docs, size: docs.length, empty: !docs.length, docChanges: () => [] });
  };
  const notify = () => listeners.forEach(emit);
  const docRef = (path) => ({ id: path.split('/').pop(), path,
    get: async () => ({ exists: store.has(path), data: () => store.get(path) }),
    set: async (data) => { store.set(path, JSON.parse(JSON.stringify(data))); setTimeout(notify, 0); },
    update: async (data) => { store.set(path, Object.assign({}, store.get(path), data)); setTimeout(notify, 0); },
    delete: async () => { store.delete(path); setTimeout(notify, 0); },
    onSnapshot: (cb) => { const l = { kind: 'doc', path, cb }; listeners.push(l); setTimeout(() => emit(l), 0); return () => {}; } });
  const colDocs = (p) => { const depth = p.split('/').length + 1; return [...store.entries()].filter(([q]) => q.startsWith(p + '/') && q.split('/').length === depth).map(([q, d]) => ({ id: q.split('/').pop(), exists: true, data: () => d })); };
  const db = { doc: (p) => docRef(p), collection: (p) => ({ doc: (id) => docRef(p + '/' + id), get: async () => { const docs = colDocs(p); return { docs, size: docs.length, empty: !docs.length }; }, onSnapshot: (cb) => { const l = { kind: 'col', path: p, cb }; listeners.push(l); setTimeout(() => emit(l), 0); return () => {}; } }) };
  window.__store = store;

  const options = ['A', 'B', 'C', 'D', 'E'].map((L, i) => ({ letter: L, title: ['Torrey transients', 'Collective damping of two atoms', 'Qubit calibration', 'Damped Rabi in waveguides', 'A Rabi-based start-up'][i],
    summary: 'Direction ' + L + ' explains the damped oscillation with $\\Gamma$ and the steady state.', why_you: 'It links to your sideband widths in (3.55).', kind: ['derivation', 'thesis link', 'computing', 'technology', 'start-up'][i],
    add: i === 0 ? [{ id: 'mollow-triplet', name: 'Mollow triplet', why: 'the spectrum' }, { id: null, name: 'Optical nutation', why: 'the experiment' }] : [{ id: 'bloch-sphere', name: 'Bloch sphere', why: 'geometry' }], difficulty: (i % 3) + 1 }));
  const page = { name: 'Collective damped Rabi oscillation', glyph: 'NΓ', aliases: ['collective Rabi damping'], teaser: 'Two atoms swing together and decay faster.',
    tip: { text: 'The pair oscillates at $\\sqrt2\\Omega$ and damps at $5\\Gamma/4$.', tex: '\\Gamma_e=5\\Gamma/4', ref: 'thesis (3.55)' },
    overview: ['First paragraph with $\\Gamma$ and a test of escaping: <script>window.__xss=1</script><img src=x onerror="window.__xss=2">.', 'Second paragraph about **damping** in plain words.'],
    equations: [{ tex: '\\dot w=-\\Gamma(w+1)-\\Omega_R v', ref: 'optical Bloch', note: 'one convention' }],
    steps: [1, 2, 3, 4, 5, 6].map((n) => ({ text: 'Step ' + n + ' with $x_' + n + '$.', ref: 'CHECK IN BOOK' })),
    textbook: [{ book: 'Scully & Zubairy', where: '§10.C', why: 'Exact solution.' }],
    research: ['Links to your (3.55).'], deeper: ['Deeper note.'], mastery: ['Exercise.'],
    literature: { seminal: [{ authors: 'H. C. Torrey', title: 'Transient Nutations in Nuclear Magnetic Resonance', venue: 'Phys. Rev. 76, 1059', year: 1949, doi: '10.1103/PhysRev.76.1059', arxiv: '', field: 'general', fit: 'The first solution.', verified: false }],
      cited: [{ authors: 'Somebody et al.', title: 'A made-up 2022 paper', venue: 'Journal', year: 2022, doi: 'not-a-doi', arxiv: '9999', field: 'QC', fit: 'Bad identifiers must be dropped.', verified: false }], latest: [] },
    techs: ['Qubit calibration'], startups: [{ name: 'Quantum Machines', what: 'control systems' }],
    quiz: [0, 1, 2, 3, 4].map((n) => ({ q: 'Question ' + n + '?', options: ['right', 'wrong', 'wrong', 'wrong'], answer: 0, why: 'Because.' })).concat([{ q: 'Broken', options: ['a'], answer: 3 }]),
    new_keywords: [{ name: 'Optical nutation', teaser: 'Damped Rabi oscillation at optical frequencies.' }] };
  const sample = async () => ({ text: 'ok', truncated: false, modelTierApplied: 'default' });
  sample.json = async (input, opts) => {
    window.__prompts = (window.__prompts || []).concat([{ input, tier: opts && opts.modelTier }]);
    await new Promise((r) => setTimeout(r, 150));
    if (opts && opts.onText) opts.onText({ text: '{"x": "partial answer..."}', delta: '' });
    await new Promise((r) => setTimeout(r, 150));
    if (/WANTS TO ADD THIS EXTRA INGREDIENT/.test(input)) return { verdict: 'fits', maps_to: [], why: 'Floquet theory treats periodically driven systems, so it extends your dressed states.', direction: 'A page on Floquet states of driven emitters.', new_keyword: { name: 'Floquet theory', teaser: 'Periodically driven quantum systems.' } };
    if (/Propose exactly 5 directions/.test(input)) return { options };
    if (/You write one study page/.test(input)) return page;
    if (/full study breakdown of one document/.test(input)) return { steps: [1, 2, 3, 4].map((n) => ({ text: 'Breakdown step ' + n + ' with $\\Omega_R$.', ref: n < 3 ? 'p. ' + n + ', eq. (' + n + ')' : 'CHECK IN PAPER' })),
      quiz: [0, 1, 2, 3, 4].map((n) => ({ q: 'Paper question ' + n + '?', options: ['right', 'wrong', 'wrong', 'wrong'], answer: 0, why: 'Because.' })), research: ['Links to (3.55).'],
      references: [{ authors: 'A. Author', title: 'A real-looking paper', venue: 'Phys. Rev. A 1, 1', year: 2020, doi: '', arxiv: '', field: 'QO', fit: 'fits', verified: false }], key_keywords: ['rabi-oscillation', 'mollow-triplet'], new_keywords: [{ name: 'Spectral hole', teaser: 'A dip in a spectrum.', page: 4 }] };
    if (/You are the EMPATHY LAMP/.test(input)) {
      const n = (window.__prayers = (window.__prayers || 0) + 1);
      return { ratio: n === 1 ? '62' : 81, drift: n === 1 ? [{ said: 'the two atoms decay independently', record: 'In his review with Tanaś the pair shares a collective damping $\\gamma_{12}$ and a dipole–dipole shift.', fix: 'Start from the collective master equation, not from two separate Bloch equations.' }, 'A string drift <script>window.__xss=4</script>'] : [],
        hint: 'Ask the question the way the review frames it: in terms of the symmetric and antisymmetric states.', answer: ['The record answers with $\\gamma_{12}$ and <b>bold</b> <img src=x onerror="window.__xss=5">.', 'Second paragraph of the answer about Subradiance and dark states.'],
        gaps: [{ gap: 'Your bestiary has no entry for the collective Lamb shift.', options: [{ letter: 'A', kind: 'bestiary', label: 'Collective Lamb shift', why: 'The shift that comes with $\\gamma_{12}$.', payload: { name: 'Collective Lamb shift', teaser: 'The level shift of a pair of atoms from exchanging virtual photons.' } },
          { letter: 'B', kind: 'craft', label: 'Decay rate × Rabi oscillation', why: 'Craft the damped pair.', payload: { ids: ['decay-rate', 'rabi-oscillation'], recipe: '', name: 'Damped pair' } },
          { letter: 'Z', kind: 'read', label: 'Ficek & Swain, chapter 2', why: 'The formalism with cross-damping.', payload: { figure: 'ficek', book: 'ficek-swain', chapter: 2, title: 'Quantum Interference and Coherence' } }] },
          { gap: 'Something only Claude can settle.', options: [{ letter: 'A', kind: 'ask', label: 'Ask about retardation', why: 'Not in the record.', payload: { text: 'How does the Lehmberg master equation treat retardation?' } },
          { letter: 'B', kind: 'mmvc', label: 'An Observatory', why: 'Nowhere to keep measured spectra.', payload: { name: 'Observatory', what: 'A section that keeps measured and simulated spectra side by side.', why: 'The codex has no place for data.' } },
          { letter: 'C', kind: 'study', label: 'Dipole–dipole interaction', why: 'Still only discovered.', payload: { id: 'dipole-dipole' } },
          { letter: 'D', kind: 'rough', label: 'Decay rate × Rabi oscillation', why: 'Rough the crossing here.', payload: { a: 'decay-rate', b: 'rabi-oscillation', via: '' } },
          { kind: 'bogus', label: 'dropped' }, { kind: 'study', label: 'dropped too', payload: { id: 'no-such-entry' } }] }],
        record: 'She tried the two-atom problem as Ficek and drifted to independent decay; sync ' + (n === 1 ? 62 : 81) + '%.' };
    }
    if (/ROUGH DRAFT/.test(input)) return { title: 'Rough crossing', caption: 'A first sketch at the crossing.', summary: ['First rough paragraph with $\\Gamma$ and <b>bold</b> <script>window.__xss=3</script>.', 'Second rough paragraph.'], points: [{ text: 'Try the derivation.', check: true }, { text: 'Find the paper.', check: true }], keywords: ['rabi-oscillation'] };
    if (/You design one LORE/.test(input)) return { name: 'Systems Codex', short: 'Systems', subject: 'operating systems', tagline: 'Processes, memory and the kernel, chapter by chapter.',
      tomes: [{ id: 'ostep', short: 'Arpaci-Dusseau', title: 'Operating Systems: Three Easy Pieces', authors: 'R. and A. Arpaci-Dusseau', publisher: 'Arpaci-Dusseau Books', chapters: [{ num: '4', title: 'Processes', pages: '1–10', sections: [{ num: '4.1', title: 'The abstraction: a process', page: 2 }, { num: '4.2', title: 'Process API', page: 4 }] }, { num: '13', title: 'Address spaces', pages: '11–20', sections: [{ num: '13.1', title: 'Early systems', page: 12 }] }] }],
      families: [{ id: 'virtualization', name: 'Virtualization', hint: 'How the CPU and memory are shared.' }, { id: 'persistence', name: 'Persistence', hint: 'Disks and files.' }],
      keywords: [{ id: 'process', name: 'Process', teaser: 'A running program.', family: 'virtualization', tome: 'ostep', num: '4.1', page: 2 }, { id: 'address-space', name: 'Address space', teaser: 'The memory a process sees.', family: 'virtualization', tome: 'ostep', num: '13.1', page: 12 }, { id: 'inode', name: 'Inode', teaser: 'The on-disk record of a file.', family: 'persistence' }],
      library: { id: 'archive', name: 'The Kernel Archive', blurb: 'A library of systems.', places: [{ id: 'ritchie-wing', kind: 'wing', name: 'Ritchie Wing', year: 1974, figures: ['ritchie'], blurb: 'The front.', children: [{ id: 'reading-room', kind: 'room', name: 'Reading Room', role: 'open', blurb: 'Open shelves.' }] }, { id: 'thompson-wing', kind: 'wing', name: 'Thompson Wing', year: 1969, figures: ['thompson'], blurb: 'Your own.', children: [{ id: 'workshop', kind: 'room', name: 'Workshop', role: 'own', blurb: 'Your writing.' }] }, { id: 'lampson-wing', kind: 'wing', name: 'Lampson Wing', year: 1983, figures: ['lampson'], blurb: 'Hidden.', children: [{ id: 'vault', kind: 'room', name: 'The Vault', role: 'hidden', blurb: 'Only you.' }] }] },
      figures: [{ id: 'ritchie', name: 'Dennis Ritchie', aliases: ['Ritchie'], years: '1941–2011', role: 'Namesake of the Ritchie Wing', place: 'ritchie-wing', teaser: 'Co-creator of Unix and C.', bio: ['Bio paragraph.'], why: 'Why.', works: [{ year: 1974, title: 'The UNIX Time-Sharing System', venue: 'CACM 17' }] }, { id: 'thompson', name: 'Ken Thompson', aliases: ['Thompson'], years: 'born 1943', role: 'Namesake', place: 'thompson-wing', teaser: 'Co-creator of Unix.', bio: ['Bio.'], why: 'Why.', works: [] }, { id: 'lampson', name: 'Butler Lampson', aliases: ['Lampson'], years: 'born 1943', role: 'Namesake', place: 'lampson-wing', teaser: 'Hints for computer system design.', bio: ['Bio.'], why: 'Why.', works: [] }],
      context: 'A systems codex for an engineer preparing interviews. Plain full sentences; CHECK IN BOOK when unsure.', how: ['Send pages.', 'Tick steps.'], suggested: [{ tome: 'ostep', num: '4.1', why: 'Start here.' }] };
    return {};
  };
  sample.limits = async () => ({ maxPromptBytes: 262144, modelTiers: ['quick', 'default', 'complex'] });
  const comments = { canSendToClaude: async () => 'available', anchorFor: async () => ({ path: 'x', x: 0, y: 0 }),
    sendToClaude: async ({ text }) => { window.__sent = text; return { threadId: 't', commentId: 'c' }; }, openComposer: async () => ({ opened: true }) };
  const user = { isOwner: async () => true, canEdit: async () => true, can: async () => true, id: async () => 'u_test' };
  const hex = () => Array.from({ length: 32 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
  const assets = {
    upload: async (blob, opts) => { const id = hex(); const type = (opts && opts.type) || blob.type; window.__assets = (window.__assets || []).concat([{ id, size: blob.size, type }]); return { id, url: '/_blob/' + id, sizeBytes: blob.size, contentType: type }; },
    delete: async (id) => { window.__deletedAssets = (window.__deletedAssets || []).concat([id]); return { deleted: true }; },
    list: async () => ({ assets: [], usage: { files: 0, bytes: 0, maxFiles: 1000, maxBytes: 1e9 } }),
  };
  const caps = { db, sample, comments, user, assets };
  window.claude = { use: async (name) => { await new Promise((r) => setTimeout(r, 20)); return caps[name] || null; } };
})();
